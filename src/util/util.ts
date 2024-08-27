import { Currency } from "@prisma/client";
import { randomInteger } from "remeda";

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

export const weightedRandom = <T,>(data: { weight: number; data: T }[]) => {
	const sum = data.reduce((l, c) => l + c.weight, 0);
	const found = randomInteger(1, sum);
	let acc = 0;
	for (const entry of data) {
		const prev = acc;
		acc += entry.weight;
		if (prev <= found && found <= acc) return entry.data;
	}
}
export const weightedRandomKeys = <T extends string | number | symbol>(data: Record<T, number>) => {
	return weightedRandom(Object.entries(data).map(x => ({ data: x[0], weight: x[1] as number }))) as T;
}

export const pceLink = (path: string) => `https://www.pixelcatsend.com/${path}`;

export const sampleRandom = <T>(array: T[]) => array[Math.floor(Math.random() * array.length)];