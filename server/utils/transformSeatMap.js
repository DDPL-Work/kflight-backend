module.exports = function transformSeatMap(tripSeat) {
  if (!tripSeat) return [];

  return Object.entries(tripSeat).map(([segmentId, seg]) => ({
    segmentId,
    layout: {
      rows: seg.sData?.row || 0,
      columns: seg.sData?.column || 0,
    },
    notes: seg.nt || null,
    seats: (seg.sInfo || []).map(seat => ({
      seatNo: seat.seatNo,
      code: seat.code,
      row: seat.seatPosition?.row,
      column: seat.seatPosition?.column,
      price: seat.amount || 0,
      isBooked: seat.isBooked,
      isLegRoom: seat.isLegRoom || false,
      isAisle: seat.isAisle || false,
    })),
  }));
};
