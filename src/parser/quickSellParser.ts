import { parseDom } from "@/util/dom";
import { failure, Result, success } from "@/util/result";
import { parsePriceType } from "@/util/util";
import { Currency } from "@prisma/client";

export interface RawQuickSellEntry {
	itemId: number;
	priceType: Currency | null;
	priceCount: number;
}

export const parseQuickSellPage = (content: string): Result<RawQuickSellEntry[]> => {
	const doc = parseDom(content);
	const form = doc.querySelector(".forumwide-content-area form");
	if (!form) return failure("Invalid page layout");
	if (!form.getAttribute("action")?.includes("/quick-sales")) return failure("Not a marketplace page");
	const lines = [...form.querySelectorAll(".shops-itemcube")];
	const entries: RawQuickSellEntry[] = [];
	for (const line of lines) {
		const builder: Partial<RawQuickSellEntry> = {};

		const itemTitleNodes = line.querySelector(".shops-itemtitle")?.childNodes;
		if (!itemTitleNodes) return failure("Item title nodes missing");
		const itemId = [...itemTitleNodes].find(x => x.nodeType === x.TEXT_NODE && x.textContent?.includes("ID#"))?.textContent?.match(/ID# (\d+)/)?.[1];
		if (!itemId || isNaN(+itemId)) return failure("Item id missing or invalid");
		builder.itemId = +itemId;

		const costNodes = line.querySelector(".cost-cube")?.childNodes;
		if (!costNodes) return failure("Cost nodes missing");
		const costText = [...costNodes].at(-1)?.textContent;
		if (!costText) return failure("Cost text missing");
		const cost = costText === "This Item is Unsellable" ? -1 : costText?.match(/Sell Value: (\d+) ([\w\s]*)/);
		if (!cost) return failure("Cost missing or invalid");
		const priceCount = typeof cost === "number" ? cost : +cost[1];
		if (isNaN(priceCount)) return failure(`Invalid cost "${typeof cost === "number" ? cost : cost[1]}"`);
		builder.priceCount = priceCount;
		const priceType = cost === -1 ? null : parsePriceType(cost[2].trim());
		if (cost !== -1 && !priceType) return failure(`Unknown currency "${cost[2].trim()}"`);
		builder.priceType = priceType ?? null;

		entries.push(builder as RawQuickSellEntry);
	}
	return success(entries);
};
