/**
 * Maps SSR selection to TripJack traveller structure
 * SAFE for Instant / Hold / Confirm flows
 */
function mapSSRToTripJack(travellers, supplierReview, ssrSelections = {}) {
  // ✅ SAFETY GUARD
  if (!supplierReview || !Array.isArray(supplierReview.tripInfos)) {
    return travellers;
  }

  const segmentMap = {};

  supplierReview.tripInfos.forEach((trip) => {
    trip?.sI?.forEach((seg) => {
      if (seg?.id) segmentMap[seg.id] = true;
    });
  });

  return travellers.map((trav, tIdx) => {
    const tSSR = ssrSelections[tIdx] || {};

    const nextTrav = {
      ...trav,
      ssrMealInfos: [],
      ssrBaggageInfos: [],
      ssrSeatInfos: [],
      ssrExtraServiceInfos: [],
    };

    Object.entries(tSSR).forEach(([segmentId, services]) => {
      if (!segmentMap[segmentId]) return;

      if (Array.isArray(services.MEAL)) {
        nextTrav.ssrMealInfos.push(
          ...services.MEAL.map((m) => ({
            key: segmentId,
            code: m.code,
            amount: m.amount || 0,
          }))
        );
      }

      if (Array.isArray(services.BAGGAGE)) {
        nextTrav.ssrBaggageInfos.push(
          ...services.BAGGAGE.map((b) => ({
            key: segmentId,
            code: b.code,
            amount: b.amount || 0,
          }))
        );
      }

      if (Array.isArray(services.SEAT)) {
        nextTrav.ssrSeatInfos.push(
          ...services.SEAT.map((s) => ({
            key: segmentId,
            code: s.code,
          }))
        );
      }

      if (Array.isArray(services.EXTRA)) {
        nextTrav.ssrExtraServiceInfos.push(
          ...services.EXTRA.map((e) => ({
            key: segmentId,
            code: e.code,
            amount: e.amount || 0,
          }))
        );
      }
    });

    return nextTrav;
  });
}


module.exports = mapSSRToTripJack;
