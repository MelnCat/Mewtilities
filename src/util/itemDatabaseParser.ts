import { readFileSync } from "fs";
import { JSDOM } from "jsdom";

export interface RawItemDatabaseEntry {
	id: number;
	key: string;
	name: string;
	image: string;
	category: string;
	seasons: string[];
	sources: Record<string, string>;
}

export type ItemDatabaseParseResult = { type: "error"; message: string } | { type: "success"; data: RawItemDatabaseEntry[] };

export const parseItemDatabasePage = (content: string): ItemDatabaseParseResult => {
	const dom = new JSDOM(content);
	const doc = dom.window.document;
	const form = doc.querySelector(".forumwide-content-area form");
	if (!form) return { type: "error", message: "Invalid page layout" };
	const cubes = [...form.querySelectorAll(".itemcube")];
	const entries: RawItemDatabaseEntry[] = [];
	for (const cube of cubes) {
		const builder: Partial<ItemDatabaseParseResult> = {};

		const topRightText = cube.querySelector(".itemtitle")?.innerHTML;
		if (!topRightText) return { type: "error", message: "Top right text missing" };
		const topRightLines = topRightText.split(/<br\s*(\/)?>/);
		console.log(topRightLines);

		entries.push(builder as RawItemDatabaseEntry);
	}
	return { type: "success", data: entries };
};

parseItemDatabasePage(readFileSync("./test.html", "utf8"))