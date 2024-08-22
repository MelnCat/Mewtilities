import { failure, Result, success } from "@/util/result";
import { JSDOM } from "jsdom";
import { RawMarketEntry } from "./marketParser";
import { Currency } from "@prisma/client";

export interface RawShopEntries {
	entries: RawShopEntry[];
	shop: {
		url: string;
		blurb: string;
		image: string;
	};
}

export interface RawShopEntry {
	itemId: number;
	priceType: Currency;
	priceCount: number;
}

export const parseShopPage = (content: string): Result<RawShopEntries> => {
	const dom = new JSDOM(content);
	const doc = dom.window.document;
	const form = doc.querySelector(".forumwide-content-area form");
	if (!form) return failure("Invalid page layout");
	const lines = [...form.querySelectorAll(".shops-itemcube")];
	const entries: RawShopEntry[] = [];
	const shopUrl = form.getAttribute("action");
	if (!shopUrl) return failure("Missing shop action");
	const shopBlurb = doc.querySelector(".shopbanner > p")?.innerHTML?.trim();
	if (!shopBlurb) return failure("Missing shop blurb");
	const shopImage = doc.querySelector(".bannergroup > div > img")?.getAttribute("src");
	if (!shopImage) return failure("Missing shop image");
	for (const line of lines) {
		const builder: Partial<RawShopEntry> = {};

		const itemTitleNodes = line.querySelector(".shops-itemtitle")?.childNodes;
		if (!itemTitleNodes) return failure("Item title nodes missing");
		const itemId = [...itemTitleNodes].findLast(x => x.nodeType === x.TEXT_NODE)?.textContent?.match(/ID# (\d+)/)?.[1];
		if (!itemId || isNaN(+itemId)) return failure("Item id missing or invalid");
		builder.itemId = +itemId;

		const costNodes = line.querySelector(".cost-cube")?.childNodes;
		if (!costNodes) return failure("Cost nodes missing");
		const cost = [...costNodes].findLast(x => x.nodeType === x.TEXT_NODE)?.textContent?.match(/Cost: (\d+) ([\w\s]*)/);
		if (!cost) return failure("Cost missing or invalid");
		const priceCount = +cost[1];
		if (isNaN(priceCount)) return failure(`Invalid cost "${cost[1]}"`);
		builder.priceCount = priceCount;
		const priceType = {
			"Notes": Currency.NOTE,
			"Essence Fragments": Currency.ESSENCE
		}[cost[2].trim()];
		if (!priceType) return failure(`Unknown currency "${cost[2].trim()}"`);
		builder.priceType = priceType;

		entries.push(builder as RawShopEntry);
	}
	return success({
		shop: {
			url: shopUrl,
			blurb: shopBlurb,
			image: shopImage,
		},
		entries,
	});
};
