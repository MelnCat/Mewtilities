import { parseDom } from "@/util/dom";
import { failure, Result, success } from "@/util/result";
import { parsePriceType } from "@/util/util";
import { Currency, Season } from "@prisma/client";

export interface RawShopEntries {
	entries: RawShopEntry[];
	season: Season;
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
	const doc = parseDom(content);
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
	const seasonText = doc.querySelector("#weatherlink")?.textContent?.trim().match(/.+?\| (\w+) .+?,.+?\|/)?.[1].toUpperCase().trim();
	if (!seasonText) return failure("Season missing or invalid");
	if (!(seasonText in Season)) return failure(`Unknown season "${seasonText}"`)
	const season = Season[seasonText as keyof typeof Season];
	for (const line of lines) {
		const builder: Partial<RawShopEntry> = {};

		const itemTitleNodes = line.querySelector(".shops-itemtitle")?.childNodes;
		if (!itemTitleNodes) return failure("Item title nodes missing");
		const itemId = [...itemTitleNodes].find(x => x.nodeType === x.TEXT_NODE && x.textContent?.includes("ID#"))?.textContent?.match(/ID# (\d+)/)?.[1];
		if (!itemId || isNaN(+itemId)) return failure("Item id missing or invalid");
		builder.itemId = +itemId;

		const costNodes = line.querySelector(".cost-cube")?.childNodes;
		if (!costNodes) return failure("Cost nodes missing");
		const cost = [...costNodes].findLast(x => x.nodeType === x.TEXT_NODE)?.textContent?.match(/Cost: (\d+) ([\w\s]*)/);
		if (!cost) return failure("Cost missing or invalid");
		const priceCount = +cost[1];
		if (isNaN(priceCount)) return failure(`Invalid cost "${cost[1]}"`);
		builder.priceCount = priceCount;
		const priceType = parsePriceType(cost[2].trim());
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
		season
	});
};
