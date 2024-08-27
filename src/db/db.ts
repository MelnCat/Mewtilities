"use server";
import { Currency, Item, MarketEntry } from "@prisma/client";
import prisma from "./prisma";
import { getCheapestEntries } from "./dbUtil";

declare global {
	namespace PrismaJson {
		export interface ItemInfo {
			[key: string]: string;
		}
		export interface CustomItemData {
			index: number;
			author: {
				id: number;
				name: string;
			};
			model: {
				image?: string;
				x: number;
				y: number;
			};
		}
	}
}

export const getItemData = (id: number) =>
	prisma.item.findFirst({
		where: { id },
		include: {
			marketEntries: true,
			shopEntries: { include: { shop: true } },
			quickSellEntries: true,
			recipe: { include: { ingredients: { include: { item: { include: { marketEntries: true, shopEntries: true } } } } } },
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
		cheapestMarketEntries: getCheapestEntries(x.marketEntries),
		cityOffers: x.shopEntries.map(e => ({ priceType: e.priceType, priceCount: e.priceCount })),
		quickSell:
			(x.quickSellEntries.map(e => ({ priceCount: e.priceCount, priceType: e.priceType })).map(x => (x.priceType !== null ? x : null)) as ({
				priceType: Currency;
				priceCount: number;
			} | null)[]) ?? null,
		craftable: x.recipe !== null,
		custom: x.custom,
		customData: x.customData,
	}));
};

export interface ProcessedClothing {
	id: number;
	name: string;
	key: string;
	image: string;
	custom: boolean;
}
export const getClothing = () => prisma.item.findMany({ select: { id: true, name: true, key: true, image: true, custom: true }, where: { category: { contains: "clothing" } }, orderBy: { id: "asc" } });
