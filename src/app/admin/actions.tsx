"use server";

import { getAdminState } from "@/admin/auth";
import prisma from "@/db/prisma";
import { parseItemDatabasePage } from "@/parser/itemDatabaseParser";
import { parseMarketPage } from "@/parser/marketParser";
import { parseQuickSellPage } from "@/parser/quickSellParser";
import { parseShopListPage } from "@/parser/shopListParser";
import { parseShopPage } from "@/parser/shopParser";
import { Failure, Result, unwrap } from "@/util/result";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { revalidatePath } from "next/cache";

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
		} finally {
			revalidatePath("/api/items");
		}
	};

export const processMarketFiles = processFileAction(parseMarketPage, async data => {
	try {
		let added = 0;
		let updated = 0;
		let untouched = 0;
		for (const x of data.flat()) {
			const existing = await prisma.marketEntry.findFirst({ where: { id: x.id } });
			const details = await prisma.marketEntry.upsert({
				where: {
					id: x.id
				},
				update: {
					expiryTime: new Date(x.expiryTime)
				},
				create: {
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
				}
			});
			if (!existing) added++;
			else if (+existing.expiryTime !== +details.expiryTime) updated++;
			else untouched++;
		}
		return { success: true, message: `+${added} ~${updated} @${untouched}` };
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
	let i = 0;
	for (const item of data.flat()) {
		await prisma.item.upsert({
			where: {
				id: item.id,
			},
			update: {
				category: item.category,
				image: item.image,
				key: item.key,
				name: item.name,
				info: item.info,
				extraText: item.extraText,
				seasons: item.seasons,
			},
			create: {
				id: item.id,
				category: item.category,
				image: item.image,
				key: item.key,
				name: item.name,
				info: item.info,
				extraText: item.extraText,
				seasons: item.seasons,
			},
		});
		i++;
	}
	return { success: true, message: `${i} entries updated` };
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
			message: `Unknown shop(s) ${shops
				.filter(x => !foundShops.some(y => y.url === x.url))
				.map(x => x.url)
				.join(", ")}`,
		};
	const updatedShops = new Set<string>();
	for (const shop of shops) {
		if (updatedShops.has(shop.url)) continue;
		await prisma.shop.update({
			where: { url: shop.url },
			data: { blurb: shop.blurb, image: shop.image },
		});
		updatedShops.add(shop.url);
	}
	const itemIds = data.flatMap(x => x.entries.map(y => y.itemId));
	const items = await prisma.item.findMany({ select: { id: true, seasons: true }, where: { id: { in: itemIds } } });
	const itemMap = Object.fromEntries(items.map(x => [x.id, x.seasons]));
	if (!itemIds.every(x => items.some(y => y.id === x))) return { success: false, message: `Unknown item(s) ${itemIds.filter(x => !items.some(y => y.id === x)).join(", ")}` };
	const result = await prisma.shopEntry.createMany({
		data: data.flatMap(x =>
			x.entries.map(y => ({
				itemId: y.itemId,
				shopUrl: x.shop.url,
				priceType: y.priceType,
				priceCount: itemMap[y.itemId].includes(x.season) ? y.priceCount : y.priceCount / 3,
			}))
		),
		skipDuplicates: true,
	});
	return { success: true, message: `${result.count} entries updated` };
});

export const processQuickSellFiles = processFileAction(parseQuickSellPage, async data => {
	const items = await prisma.item.findMany({ where: { id: { in: data.flat().map(x => x.itemId) } } });

	const result = await prisma.quickSellEntry.createMany({
		data: data.flat().filter(x => items.some(y => y.id === x.itemId)).map(x => ({
			itemId: x.itemId,
			priceCount: x.priceCount,
			priceType: x.priceType,
		})),
		skipDuplicates: true,
	});
	return { success: true, message: `${result.count} entries updated, ${data.flat().filter(y => !items.some(x => x.id === y.itemId)).length} unknown items` };
});

export const getItemDatabaseInfo = async () => {
	const allItems = await prisma.item.findMany({ orderBy: { id: "asc" } });
	return {
		count: allItems.length,
		firstMissing: [{ id: 0 }, ...allItems].find((x, i, a) => a[i + 1]?.id !== x.id + 1)!.id + 1,
		highest: allItems.at(-1)?.id ?? -1,
	};
};
