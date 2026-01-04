import { Currency, Item, MarketEntry, ShopEntry } from "@/../generated/prisma/client";
import prisma from "./prisma";
import { groupBy } from "remeda";

export const getCheapestEntries = (entries: (MarketEntry & { unitPrice: number })[]) =>
	Object.values(groupBy(entries, y => y.priceType))
		.map(m => m.reduce((l, c) => (c.unitPrice < l.unitPrice ? c : l)))
		.map(m => ({ priceType: m.priceType, priceCount: m.unitPrice }));
export const getCheapestNote = (item: Item & { marketEntries: (MarketEntry & { unitPrice: number })[] } & { shopEntries: ShopEntry[] }) => {
	const cheapestM = getCheapestEntries(item.marketEntries).find(x => x.priceType === Currency.NOTE);
	const cheapestS = item.shopEntries.filter(x => x.priceType === Currency.NOTE).sort((a, b) => b.priceCount - a.priceCount)[0];
	return Math.min(cheapestM?.priceCount ?? Infinity, cheapestS?.priceCount ?? Infinity);
};
