"use server";

import { getAdminState } from "@/admin/auth";
import prisma from "@/db/prisma";
import { parseItemDatabasePage } from "@/parser/itemDatabaseParser";
import { parseMarketPage } from "@/parser/marketParser";
import { parseShopListPage } from "@/parser/shopListParser";
import { parseShopPage } from "@/parser/shopParser";
import { Failure, Result, unwrap } from "@/util/result";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

const decoder = new TextDecoder();

const processFileAction =
	<T,>(parser: (content: string) => Result<T>, cb: (args: T[]) => Promise<{ success: boolean; message: string }>) =>
	async (data: FormData): Promise<{ success: boolean; message: string }> => {
		if (!(await getAdminState())) return { success: false, message: ":(" };
		const files = data.getAll("files") as File[];
		try {
			const processed = await Promise.all(files.map(async x => parser(decoder.decode(await x.arrayBuffer()))));
			const errors = processed.map((x, i) => [x, i] as const).filter(x => !x[0].ok);
			if (errors.length) return { success: false, message: `${errors.map(x => `${files[x[1]].name}: ${(x[0] as Failure).message}`).join("\n")}` };
			const unwrapped = processed.map(x => unwrap(x));
			return await cb(unwrapped);
		} catch (e) {
			return { success: false, message: String(e) };
		}
	};

export const processMarketFiles = processFileAction(parseMarketPage, async data => {
	try {
		const result = await prisma.marketEntry.createMany({
			data: data.flat().map(x => ({
				id: x.id,
				category: x.category,
				expiryTime: new Date(x.expiryTime),
				itemId: x.item.id,
				itemCount: x.item.count,
				priceCount: x.priceCount,
				priceType: x.priceType,
				sellerId: x.seller.id,
				sellerName: x.seller.name,
				creationTime: new Date(x.expiryTime - 1000 * 60 * 60 * 24 * 7),
			})),
			skipDuplicates: true,
		});
		return { success: true, message: `${result.count} entries updated` };
	} catch (e) {
		if (e instanceof PrismaClientKnownRequestError && e.message.includes("Foreign key constraint failed")) {
			const items = [...new Set(data.flat().map(x => x.item.id))];
			const found = await prisma.item.findMany({ where: { id: { in: items } } });
			const missing = items.filter(x => !found.some(y => y.id === x));
			if (missing.length > 0) return { success: false, message: `Missing item(s) ${missing.join(", ")}` };
		}
		throw e;
	}
});
export const processItemDatabaseFiles = processFileAction(parseItemDatabasePage, async data => {
	const result = await prisma.item.createMany({
		data: data.flat().map(x => ({
			id: x.id,
			category: x.category,
			image: x.image,
			key: x.key,
			name: x.name,
			source: x.sources,
			extraText: x.extraText,
			seasons: x.seasons,
		})),
		skipDuplicates: true,
	});
	return { success: true, message: `${result.count} entries updated` };
});

export const processShopListFiles = processFileAction(parseShopListPage, async data => {
	const result = await prisma.shop.createMany({
		data: data.flat().map(x => ({
			url: x.url,
			category: x.category,
			description: x.description,
			name: x.name,
			previewImage: x.previewImage,
		})),
		skipDuplicates: true,
	});
	return { success: true, message: `${result.count} entries updated` };
});

export const processShopEntryFiles = processFileAction(parseShopPage, async data => {
	const shops = data.map(x => x.shop);
	const foundShops = await prisma.shop.findMany({ where: { url: { in: shops.map(x => x.url) } } });
	if (!shops.every(x => foundShops.some(y => y.url === x.url)))
		return {
			success: false,
			message: `Unknown shops ${shops
				.filter(x => !foundShops.some(y => y.url === x.url))
				.map(x => x.url)
				.join(", ")}`,
		};
	for (const shop of shops) {
		
	}
	return { success: true, message: `${result.count} entries updated` };
});

export const getItemDatabaseInfo = async () => {
	const allItems = await prisma.item.findMany({ orderBy: { id: "asc" } });
	return {
		count: allItems.length,
		firstMissing: [{ id: 0 }, ...allItems].find((x, i, a) => a[i + 1]?.id !== x.id + 1)!.id + 1,
		highest: allItems.at(-1)?.id ?? -1,
	};
};
