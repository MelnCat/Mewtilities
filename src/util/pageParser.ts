import { readFileSync } from "fs";
import { JSDOM } from "jsdom";
import { RawMarketEntry } from "./marketEntry";

const parse = (content: string) => {
	const dom = new JSDOM(content);
	const doc = dom.window.document;
	const form = doc.querySelector(".forumwide-content-area form");
	if (!form) return { type: "error", message: "Invalid page layout" };
	const lines = [...form.querySelectorAll(".forum-line-wrapless")];
	const entries: RawMarketEntry[] = [];
	for (const line of lines) {
		const builder: Partial<RawMarketEntry> = {};
		const itemDetails = line.querySelector(".shops-itemtitle");
		if (!itemDetails) return { type: "error", message: "Item details missing" };
		const itemId = itemDetails.childNodes[2]?.textContent?.match(/ID# (\d+)/)?.[1];
		if (itemId === undefined || itemId === null) return { type: "error", message: "Item ID matching failed" };
		const itemName = itemDetails.childNodes[0]?.textContent;
		if (!itemName) return { type: "error", message: "Item name matching failed" };
		const itemCount = itemDetails.childNodes[5]?.textContent?.match(/: (\d)+/)?.[1];
		if (!itemCount) return { type: "error", message: "Item count matching failed" };
		const item = { id: +itemId, name: itemName, count: +itemCount };
	}
	console.log(entries);
};

parse(readFileSync("./test.html", "utf8"));
