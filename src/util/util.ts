import { Currency } from "@prisma/client";

export const bestOffersByCurrency = (offers: { priceCount: number; priceType: Currency }[]) => {
	const output = {} as Record<Currency, number>;
	for (const offer of offers) {
		if (!(offer.priceType in output) || output[offer.priceType] > offer.priceCount) output[offer.priceType] = offer.priceCount;
	}
	return Object.entries(output);
};

export const parsePriceType = (raw: string) =>
	({
		Notes: Currency.NOTE,
		"Essence Fragments": Currency.ESSENCE,
	}[raw]);

export const numberFormat = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 2 });

export const smallNumberFormat = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 6 });
