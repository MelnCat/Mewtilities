import { readFileSync } from "fs";
import { JSDOM } from "jsdom";

export interface RawItemDatabaseEntry {
	id: number;
	key: string;
	name: string;
	image: string;
	category: string;
	seasons: string[];
	extraText: string[];
	sources: Record<string, string>;
}

export type ItemDatabaseParseResult = { type: "error"; message: string } | { type: "success"; data: RawItemDatabaseEntry[] };

export const parseItemDatabasePage = (content: string): ItemDatabaseParseResult => {
	const dom = new JSDOM(content);
	const doc = dom.window.document;
	const form = doc.querySelector(".forumwide-content-area form");
	if (!form) return { type: "error", message: "Invalid page layout" };
	if (!form.getAttribute("action")?.includes("/items")) return { type: "error", message: "Not an item database page" };
	const cubes = [...form.querySelectorAll(".itemcube")];
	const entries: RawItemDatabaseEntry[] = [];
	for (const cube of cubes) {
		const builder: Partial<RawItemDatabaseEntry> = {};

		const topRightText = cube.querySelector(".horizontalflex > .item-mid > .itemtitle")?.innerHTML;
		if (!topRightText) return { type: "error", message: "Top right text missing" };
		const topRightLines = topRightText.split(/<br\s*\/?>/).map(x => x.trim());
		if (topRightLines.length <= 0) return { type: "error", message: "Top right text empty" };
		const id = topRightLines[0].match(/ID# (\d+)/)?.[1];
		if (!id || isNaN(+id)) return { type: "error", message: "ID missing or invalid" };
		builder.id = +id;
		builder.seasons = topRightLines.slice(1);

		const centerText = cube.querySelector(".shifting-flex > .item-mid > .itemtitle");
		if (!centerText) return { type: "error", message: "Center text missing" };

		const name = centerText.querySelector("h4");
		if (!name?.innerHTML) return { type: "error", message: "Item name missing or empty" };
		builder.name = name.innerHTML;

		const key = centerText.querySelector("i");
		if (!key?.innerHTML) return { type: "error", message: "Item key missing or empty" };
		builder.key = key.innerHTML;

		const nodes = [...centerText.childNodes];
		const hr = centerText.querySelector("div.horizontalrule");
		if (!hr) return { type: "error", message: "No hr found" };
		const hrIndex = nodes.indexOf(hr);
		if (hrIndex === -1) return { type: "error", message: "No index for hr found" };
		const sourceList = nodes
			.slice(hrIndex + 1)
			.filter(x => x.nodeType === 3 /* Node.TEXT_NODE */)
			.map(x => x.textContent?.split(": ") as [string, string] | [string]);
		if (sourceList.some(x => !x)) return { type: "error", message: "Invalid source list" };
		builder.sources = Object.fromEntries(sourceList.filter(x => x.length === 2));
		builder.extraText = sourceList.filter(x => x.length === 1).flat();

		const image = cube.querySelector(".itemjail > img:last-child");
		if (!image || image.classList.contains("itemoverlay")) return { type: "error", message: "Image missing or invalid" };
		const imageSrc = image.getAttribute("src");
		if (!imageSrc) return { type: "error", message: "Image src missing or invalid" };
		builder.image = imageSrc;

		const overlayImage = cube.querySelector(".itemjail > .itemoverlay");
		if (!overlayImage) return { type: "error", message: "Overlay image missing" };
		const overlayAlt = overlayImage.getAttribute("alt");
		if (!overlayAlt) return { type: "error", message: "Overlay alt missing" };
		builder.category = overlayAlt;

		entries.push(builder as RawItemDatabaseEntry);
	}
	return { type: "success", data: entries };
};

