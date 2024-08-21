"use server";

import { getAdminState } from "@/admin/auth";
import { parseItemDatabasePage } from "@/parser/itemDatabaseParser";
import prisma from "@/db/prisma";
import { parseMarketPage } from "@/parser/marketParser";
import { createInitialRouterState } from "next/dist/client/components/router-reducer/create-initial-router-state";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

const decoder = new TextDecoder();

export const processMarketFiles = async (data: FormData): Promise<{ success: boolean; message: string }> => {
	if (!(await getAdminState())) return { success: false, message: ":(" };
	const files = data.getAll("files") as File[];
	try {
		const processed = await Promise.all(files.map(async x => parseMarketPage(decoder.decode(await x.arrayBuffer()))));
		const errors = processed.map((x, i) => [x, i] as const).filter(x => x[0].type === "error");
		if (errors.length) return { success: false, message: `${errors.map(x => `${files[x[1]].name}: ${(x[0] as { type: "error"; message: string }).message}`).join("\n")}` };
		const flattened = processed.flatMap(x => (x.type === "success" ? x.data : []));
		try {
			const result = await prisma.marketEntry.createMany({
				data: flattened.map(x => ({
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
				const items = [...new Set(flattened.map(x => x.item.id))];
				const found = await prisma.item.findMany({ where: { id: { in: items } } });
				const missing = items.filter(x => !found.some(y => y.id === x));
				if (missing.length > 0) return { success: false, message: `Missing item(s) ${missing.join(", ")}` };
			}
			throw e;
		}
	} catch (e) {
		return { success: false, message: String(e) };
	}
};
export const processItemDatabaseFiles = async (data: FormData): Promise<{ success: boolean; message: string }> => {
	if (!(await getAdminState())) return { success: false, message: ":(" };
	const files = data.getAll("files") as File[];
	try {
		const processed = await Promise.all(files.map(async x => parseItemDatabasePage(decoder.decode(await x.arrayBuffer()))));
		const errors = processed.map((x, i) => [x, i] as const).filter(x => x[0].type === "error");
		if (errors.length) return { success: false, message: `${errors.map(x => `${files[x[1]].name}: ${(x[0] as { type: "error"; message: string }).message}`).join("\n")}` };
		const flattened = processed.flatMap(x => (x.type === "success" ? x.data : []));
		const result = await prisma.item.createMany({
			data: flattened.map(x => ({
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
	} catch (e) {
		return { success: false, message: String(e) };
	}
};

export const getItemDatabaseInfo = async () => {
	const allItems = await prisma.item.findMany({ orderBy: { id: "asc" } });
	return {
		count: allItems.length,
		firstMissing: [{ id: 0 }, ...allItems].find((x, i, a) => a[i + 1]?.id !== x.id + 1)!.id + 1,
		highest: allItems.at(-1)?.id ?? -1,
	};
};
