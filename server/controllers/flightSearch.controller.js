// server-render-kflight/server/controllers/flightSearch.controller.js

const { v4: uuidv4 } = require("uuid");
const PricingRule = require("../models/PricingRule.model");

const PriceSnapshot = require("../models/PriceSnapshot.model");
const { applyPricingFromDB } = require("../utils/applyPricing");
const tripjack = require("../services/tripjackFlightService");

// -------------------------------
// Airport Checker
// -------------------------------
function isIndianAirport(code) {
  return [
    "DEL","BOM","MAA","BLR","HYD","CCU","COK","AMD","GOI","PNQ","PAT","GAU",
    "JAI","LKO","SXR","IXC","RPR","VNS","TRV","VGA","IXB","BDQ","IXM","IXE"
  ].includes(code);
}

// -------------------------------
// Apply Pricing + Create Snapshot
// -------------------------------
async function applyFinalPricing(allFlights, region, searchSessionId) {
  const finalFlights = [];

  // 1️⃣ fetch all rules once
  const allRules = await PricingRule.find({
    isActive: true,
    productType: "FLIGHT",
    $or: [{ region: "global" }, { region }]
  }).sort({ precedence: 1 });

  for (const flight of allFlights) {
    const airline = flight.sI?.[0]?.fD?.aI?.code;
    const from = flight.sI?.[0]?.da?.code;
    const to = flight.sI?.[flight.sI.length - 1]?.aa?.code;
    const flightType = isIndianAirport(from) && isIndianAirport(to) ? "domestic" : "international";

    const updatedPriceList = await Promise.all(
      (flight.totalPriceList || []).map(async (priceOption) => {
        const fareObj = priceOption?.fd?.ADULT?.fC || priceOption?.fd?.ADT?.fC;
        if (!fareObj?.NF) return null;

        const supplierFare = fareObj.TF || fareObj.NF;
        const pricingResult = applyPricingFromDB(supplierFare, { airline, from, to, flightType }, allRules);

        const snapshot = await PriceSnapshot.create({
          searchSessionId,
          priceId: priceOption.id,
          supplierFare,
          finalFare: pricingResult.finalFare,
          markupApplied: pricingResult.finalFare - supplierFare,
pricingRules: pricingResult.appliedRules.filter(
  r => r.productType === "FLIGHT"
),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });

        return {
          ...priceOption,
          supplierFare,
          finalFare: pricingResult.finalFare,
          markupApplied: pricingResult.finalFare - supplierFare,
          snapshotId: snapshot._id
        };
      })
    );

    finalFlights.push({
      ...flight,
      totalPriceList: updatedPriceList.filter(Boolean)
    });
  }

  return finalFlights;
}




// -------------------------------
// SEARCH CONTROLLER
// -------------------------------
exports.searchFlights = async (req, res) => {
  try {
    const { tripType, routeInfos, passengers, region = "global" } = req.body;

    const searchSessionId = uuidv4();

    const rawQuery = {
      cabinClass: "ECONOMY",
      tripType,
      paxInfo: {
        ADULT: String(passengers?.adult || 1),
        CHILD: String(passengers?.child || 0),
        INFANT: String(passengers?.infant || 0)
      },
      routeInfos: routeInfos.map(r => ({
        fromCityOrAirport: { code: r.fromCityOrAirport.code },
        toCityOrAirport: { code: r.toCityOrAirport.code },
        travelDate: r.travelDate
      })),
      searchModifiers: {
        isDirectFlight: false,
        isConnectingFlight: true
      }
    };

    const tjResp = await tripjack.searchFlights(rawQuery);
    const tripInfos = tjResp?.searchResult?.tripInfos || {};

    let allFlights = [];    
    if (tripType === "ONE_WAY") allFlights = tripInfos.ONWARD || [];
    else if (tripType === "ROUND_TRIP")
      allFlights = [...(tripInfos.ONWARD || []), ...(tripInfos.RETURN || [])];
    else if (tripType === "MULTI_CITY")
      allFlights = Object.values(tripInfos).flat();

    const pricedFlights = await applyFinalPricing(
      allFlights,
      region,
      searchSessionId
    );

    return res.json({
      success: true,
      searchSessionId,
      data: pricedFlights
    });

  } catch (err) {
    console.error("Flight search error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
