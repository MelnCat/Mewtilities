import { Result } from "@/util/result";
import { readFileSync } from "fs";
import { JSDOM } from "jsdom";
import { Temporal } from "temporal-polyfill";

export interface RawMarketEntry {
	id: number;
	item: { id: number; name: string; count: number };
	seller: { id: number; name: string };
	category: string;
	priceType: "NOTE" | "ESSENCE";
	priceCount: number;
	expiryTime: number;
}

export const parseMarketPage = (content: string): Result<RawMarketEntry[]> => {
	const dom = new JSDOM(content);
	const doc = dom.window.document;
	const form = doc.querySelector(".forumwide-content-area form");
	if (!form) return { type: "error", message: "Invalid page layout" };
	if (!form.getAttribute("action")?.includes("/market")) return { type: "error", message: "Not a marketplace page" };
	const lines = [...form.querySelectorAll(".forum-line-wrapless")];
	const entries: RawMarketEntry[] = [];
	for (const line of lines) {
		const builder: Partial<RawMarketEntry> = {};

		const buyButton = line.querySelector("button.craft-button");
		if (!buyButton) {
			const cancelButton = line.querySelector("input.craft-button");
			if (!cancelButton) return { type: "error", message: "Buy and Cancel button missing" }
			const id = cancelButton.getAttribute("name")?.match(/buy\[(\d+)\]/)?.[1];
			if (!id || isNaN(+id)) return { type: "error", message: "Id missing or invalid (cancel edition)" };
			builder.id = +id;
		} else {
			const id = buyButton.getAttribute("onclick")?.match(/buy\[(\d+)\]/)?.[1];
			if (!id || isNaN(+id)) return { type: "error", message: "Id missing or invalid" };
			builder.id = +id;
		}

		const itemDetails = line.querySelector(".shops-itemtitle");
		if (!itemDetails) return { type: "error", message: "Item details missing" };
		const itemId = itemDetails.childNodes[2]?.textContent?.match(/ID# (\d+)/)?.[1];
		if (itemId === undefined || itemId === null || isNaN(+itemId)) return { type: "error", message: "Item ID matching failed" };
		const itemName = itemDetails.childNodes[0]?.textContent;
		if (!itemName) return { type: "error", message: "Item name matching failed" };
		const itemCount = itemDetails.childNodes[5]?.textContent?.match(/: (\d+)/)?.[1];
		if (!itemCount || isNaN(+itemCount)) return { type: "error", message: "Item count matching failed" };
		builder.item = { id: +itemId, name: itemName, count: +itemCount };

		const sellDetails = line.querySelector(".salesinfo-slim");
		if (!sellDetails) return { type: "error", message: "Sell details missing" };

		const sellerAnchor = sellDetails.childNodes[1] as HTMLAnchorElement | undefined;
		if (!sellerAnchor) return { type: "error", message: "Seller anchor missing" };
		const sellerName = sellerAnchor.innerHTML;
		const sellerId = sellerAnchor.getAttribute?.("href")?.match(/&id=(\d+)/)?.[1];
		if (!sellerName || !sellerId || isNaN(+sellerId)) return { type: "error", message: "Seller details missing or invalid" };
		builder.seller = { id: +sellerId, name: sellerName };

		const priceImage = sellDetails.childNodes[4] as HTMLImageElement | undefined;
		if (!priceImage) return { type: "error", message: "Seller image missing" };
		const priceRawType = priceImage.getAttribute?.("title");
		if (!priceRawType) return { type: "error", message: "Price raw type missing" };
		const priceCount = sellDetails.childNodes[5]?.textContent;
		if (!priceCount || isNaN(+priceCount)) return { type: "error", message: "Price count missing" };
		const priceType = priceRawType === "paper notes" ? "NOTE" : priceRawType === "essence fragments" ? "ESSENCE" : null;
		if (!priceType) return { type: "error", message: `Invalid price type ${priceRawType}` };
		builder.priceType = priceType;
		builder.priceCount = +priceCount;

		const category = line.querySelector(".itemoverlay")?.getAttribute("alt");
		if (!category) return { type: "error", message: "Category missing" };
		builder.category = category;

		const expiryText = sellDetails.childNodes[7]?.textContent?.match(/Expires on (.+)/)?.[1];
		if (!expiryText) return { type: "error", message: "Expiry text missing" };
		try {
			const expiryTime = Temporal.ZonedDateTime.from(`${expiryText}[America/New_York]`);
			builder.expiryTime = expiryTime.epochMilliseconds;
		} catch (e) {
			return { type: "error", message: `Expiry time parsing failed\n${e}` };
		}
		entries.push(builder as RawMarketEntry);
	}
	return { type: "success", data: entries };
};
