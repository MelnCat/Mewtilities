export const calculateWindAlleles = ({ north, south, trade }: { north: number; south: number; trade: number }) => {
	return {
		N: (Math.sqrt(trade) * Math.sqrt(2 * north + trade)) / (Math.SQRT2 * Math.sqrt(2 * south + trade)),
		S: (Math.sqrt(trade) * Math.sqrt(2 * south + trade)) / (Math.SQRT2 * Math.sqrt(2 * north + trade)),
		O: -(trade ** 2 - 4 * north * south) / (2 * Math.SQRT2 * Math.sqrt(trade) * Math.sqrt(2 * north + trade) * Math.sqrt(2 * south + trade)),
	};
};
export const calculateMendelianAlleles = ({ dominant, recessive }: { dominant: number; recessive: number }) => {
	return {
		dominant: Math.sqrt(-2 * Math.sqrt(recessive * (recessive + dominant)) + 2 * recessive + dominant),
		recessive: -(recessive - Math.sqrt(recessive * (recessive + dominant))) / Math.sqrt(-2 * Math.sqrt(recessive * (recessive + dominant)) + 2 * recessive + dominant),
	};
};
