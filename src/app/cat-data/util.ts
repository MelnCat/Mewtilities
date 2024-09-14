export const calculateWindAlleles = (data: { north: number; south: number; trade: number }) => {
	const north = isNaN(data.north) ? 0 : data.north;
	const south = isNaN(data.south) ? 0 : data.south;
	const trade = isNaN(data.trade) ? 0 : data.trade;
	return {
		N: (Math.sqrt(trade) * Math.sqrt(2 * north + trade)) / (Math.SQRT2 * Math.sqrt(2 * south + trade)),
		S: (Math.sqrt(trade) * Math.sqrt(2 * south + trade)) / (Math.SQRT2 * Math.sqrt(2 * north + trade)),
		O: -(trade ** 2 - 4 * north * south) / (2 * Math.SQRT2 * Math.sqrt(trade) * Math.sqrt(2 * north + trade) * Math.sqrt(2 * south + trade)),
	};
};
export const calculateMendelianAlleles = (data: { dominant: number; recessive: number }) => {
	const dominant = isNaN(data.dominant) ? 0 : data.dominant;
	const recessive = isNaN(data.recessive) ? 0 : data.recessive;
	return {
		dominant: Math.sqrt(-2 * Math.sqrt(recessive * (recessive + dominant)) + 2 * recessive + dominant),
		recessive: -(recessive - Math.sqrt(recessive * (recessive + dominant))) / Math.sqrt(-2 * Math.sqrt(recessive * (recessive + dominant)) + 2 * recessive + dominant),
	};
};
