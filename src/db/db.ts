"use server";
import { Currency, Item, MarketEntry } from "@prisma/client";
import prisma from "./prisma";
import { groupBy } from "remeda";

export const getItemData = (id: number) =>
	prisma.item.findFirst({
		where: { id },
		include: {
			marketEntries: { select: { itemCount: true, priceCount: true, priceType: true, expiryTime: true, creationTime: true, unitPrice: true } },
			shopEntries: { include: { shop: true } },
			quickSellEntries: true,
			recipe: { include: { ingredients: { include: { item: true } } } },
		},
	});

export const getAllItems = () =>
	prisma.item.findMany({
		orderBy: { id: "asc" },
		include: { marketEntries: { where: { expiryTime: { gt: new Date() } } }, shopEntries: true, quickSellEntries: { orderBy: { priceCount: "asc" } }, recipe: true },
	});
export type ProcessedItem = Item & {
	records: number;
	cheapestMarketEntries: { priceType: Currency; priceCount: number }[];
	cityOffers: { priceType: Currency; priceCount: number }[];
	quickSell: ({ priceType: Currency; priceCount: number } | null)[] | null;
	craftable: boolean;
};

export const getProcessedItems = async (): Promise<ProcessedItem[]> => {
	const items = await getAllItems();
	return items.map(x => ({
		id: x.id,
		key: x.key,
		name: x.name,
		image: x.image,
		category: x.category,
		seasons: x.seasons,
		extraText: x.extraText,
		info: x.info,
		records: x.marketEntries.length,
		cheapestMarketEntries: Object.values(groupBy(x.marketEntries, y => y.priceType))
			.map(m => m.reduce((l, c) => (c.unitPrice < l.unitPrice ? c : l)))
			.map(m => ({ priceType: m.priceType, priceCount: m.unitPrice })),
		cityOffers: x.shopEntries.map(e => ({ priceType: e.priceType, priceCount: e.priceCount })),
		quickSell:
			(x.quickSellEntries.map(e => ({ priceCount: e.priceCount, priceType: e.priceType })).map(x => (x.priceType !== null ? x : null)) as ({
				priceType: Currency;
				priceCount: number;
			} | null)[]) ?? null,
		craftable: x.recipe !== null,
	}));
};
