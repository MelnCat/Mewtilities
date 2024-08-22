import { failure, Result, success } from "@/util/result";
import { Season } from "@prisma/client";
import { JSDOM } from "jsdom";

export interface RawItemDatabaseEntry {
	id: number;
	key: string;
	name: string;
	image: string;
	category: string;
	seasons: Season[];
	extraText: string[];
	info: Record<string, string>;
}

export const parseItemDatabasePage = (content: string): Result<RawItemDatabaseEntry[]> => {
	const dom = new JSDOM(content);
	const doc = dom.window.document;
	const form = doc.querySelector(".forumwide-content-area form");
	if (!form) return failure("Invalid page layout");
	if (!form.getAttribute("action")?.includes("/items")) return failure("Not an item database page");
	const cubes = [...form.querySelectorAll(".itemcube")];
	const entries: RawItemDatabaseEntry[] = [];
	for (const cube of cubes) {
		const builder: Partial<RawItemDatabaseEntry> = {};

		const topRightText = cube.querySelector(".horizontalflex > .item-mid > .itemtitle")?.innerHTML;
		if (!topRightText) return failure("Top right text missing");
		const topRightLines = topRightText.split(/<br\s*\/?>/).map(x => x.trim());
		if (topRightLines.length <= 0) return failure("Top right text empty");
		const id = topRightLines[0].match(/ID# (\d+)/)?.[1];
		if (!id || isNaN(+id)) return failure("ID missing or invalid");
		builder.id = +id;
		const seasons = topRightLines.slice(1).map(x => (Season[x.toUpperCase() as keyof typeof Season] as Season | null) ?? null);
		if (seasons.includes(null))
			return failure(
				`Unknown season(s) ${topRightLines
					.slice(1)
					.filter(x => !(x.toUpperCase() in Season))
					.join(", ")}`
			);
		builder.seasons = seasons as Season[];

		const centerText = cube.querySelector(".shifting-flex > .item-mid > .itemtitle");
		if (!centerText) return failure("Center text missing");

		const name = centerText.querySelector("h4");
		if (!name?.innerHTML) return failure("Item name missing or empty");
		builder.name = name.innerHTML;

		const key = centerText.querySelector("i");
		if (!key?.innerHTML) return failure("Item key missing or empty");
		builder.key = key.innerHTML;

		const nodes = [...centerText.childNodes];
		const hr = centerText.querySelector("div.horizontalrule");
		if (!hr) return failure("No hr found");
		const hrIndex = nodes.indexOf(hr);
		if (hrIndex === -1) return failure("No index for hr found");
		const sourceList = nodes
			.slice(hrIndex + 1)
			.filter(x => x.nodeType === 3 /* Node.TEXT_NODE */)
			.map(x => x.textContent?.split(": ") as [string, string] | [string]);
		if (sourceList.some(x => !x)) return failure("Invalid source list");
		builder.info = Object.fromEntries(sourceList.filter(x => x.length === 2));
		builder.extraText = sourceList.filter(x => x.length === 1).flat();

		const image = cube.querySelector(".itemjail > img:last-child");
		if (!image || image.classList.contains("itemoverlay")) return failure("Image missing or invalid");
		const imageSrc = image.getAttribute("src");
		if (!imageSrc) return failure("Image src missing or invalid");
		builder.image = imageSrc;

		const overlayImage = cube.querySelector(".itemjail > .itemoverlay");
		if (!overlayImage) return failure("Overlay image missing");
		const overlayAlt = overlayImage.getAttribute("alt");
		if (!overlayAlt) return failure("Overlay alt missing");
		builder.category = overlayAlt;

		entries.push(builder as RawItemDatabaseEntry);
	}
	return success(entries);
};
