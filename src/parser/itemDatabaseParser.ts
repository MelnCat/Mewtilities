import { parseDom } from "@/util/dom";
import { failure, Result, success } from "@/util/result";
import { Season } from "@prisma/client";

export interface RawItemDatabaseEntry {
	id: number;
	key: string;
	name: string;
	image: string;
	category: string;
	seasons: Season[];
	extraText: string[];
	info: Record<string, string>;
	custom: boolean;
	customItemData: PrismaJson.CustomItemData | null;
}

export const parseItemDatabasePage = (content: string): Result<RawItemDatabaseEntry[]> => {
	const doc = parseDom(content);
	const form = doc.querySelector(".forumwide-content-area form");
	if (!form) return failure("Invalid page layout");
	if (!form.getAttribute("action")?.includes("/items")) return failure("Not an item database page");
	const cubes = [...form.querySelectorAll(".itemcube")];
	const entries: RawItemDatabaseEntry[] = [];
	for (const cube of cubes) {
		const builder: Partial<RawItemDatabaseEntry> = {};

		const topRightText = cube.querySelector(".itemtitle")?.innerHTML;
		if (!topRightText) return failure("Top right text missing");
		const topRightLines = topRightText.split(/<br\s*\/?>/).map(x => x.trim());
		if (topRightLines.length <= 0) return failure("Top right text empty");
		const id = topRightLines[0].match(/ID# (\d+)/)?.[1];
		if (!id || isNaN(+id)) return failure("ID missing or invalid");
		builder.id = +id;

		const centerText = cube.querySelector(".shifting-flex > .item-mid > .itemtitle");
		if (!centerText) return failure("Center text missing");
		const nodes = [...centerText.childNodes];

		const name = centerText.querySelector("h4");
		if (!name?.innerHTML) return failure("Item name missing or empty");
		builder.name = name.innerHTML;

		const key = centerText.querySelector("i");
		if (!key?.innerHTML) return failure("Item key missing or empty");
		builder.key = key.innerHTML;

		const overlayImages = cube.querySelectorAll(".itemjail > .itemoverlay");
		if (!overlayImages.length) return failure("Overlay image missing");
		const overlays = [...overlayImages].map(x => x.getAttribute("src")?.match(/item_icons\/ic_(.+)\.png/)?.[1]);
		if (overlays.includes(undefined)) return failure("Overlay image invalid");
		const overlay = overlays[0];
		if (overlay === "custom") {
			builder.category = overlays[1];
			builder.seasons = [];
			builder.info = {};
			const customData = {} as Partial<PrismaJson.CustomItemData>;
			const hr = centerText.querySelector(".horizontalrule");
			if (!hr) return failure("Custom hr missing");
			const hrIndex = nodes.indexOf(hr);
			if (hrIndex === -1) return failure("Custom hr index missing");
			const text = nodes.slice(hrIndex + 1).filter(x => !(x instanceof dom.window.HTMLElement) || !x.hasAttribute("href") || !x.getAttribute("href")!.includes("report")).map(x => x.textContent).join("");
			builder.extraText = [text];
			const displayContainer = cube.querySelector("div[class^='custom-jail']");
			if (!displayContainer) return failure("Display container missing");
			const [first, second] = [...displayContainer.children] as ((HTMLImageElement | undefined)[]);
			const customImage = second ?? first;
			const modelImage = second ? first : null;
			if (!customImage) return failure("Display container children missing");
			builder.image = customImage.getAttribute("src")!;
			const offsetTop = customImage.style.top.replace("px", "");
			const offsetLeft = customImage.style.left.replace("px", "");
			customData.model = {
				x: +offsetLeft,
				y: +offsetTop,
				...(modelImage ? { image: modelImage.getAttribute("src")! } : null)
			}
			const authorLink = centerText.querySelector(".userlink");
			if (!authorLink) return failure("Author link missing");
			const authorId = authorLink.getAttribute("href")?.match(/&id=(\d+)/)?.[1];
			if (!authorId || isNaN(+authorId)) return failure("Author id missing or invalid");
			const authorName = authorLink.textContent?.replaceAll("@", "").trim();
			if (!authorName) return failure("Author name missing");
			customData.author = {
				id: +authorId,
				name: authorName
			}
			const customIndex = key.innerHTML.replace("custom_", "");
			if (!customIndex || isNaN(+customIndex)) return failure("Custom item index missing or invalid");
			customData.index = +customIndex;
			builder.custom = true;
			builder.customItemData = customData as PrismaJson.CustomItemData;
		} else {
			builder.category = overlay!;
			const seasons = topRightLines.slice(1).map(x => (Season[x.toUpperCase() as keyof typeof Season] as Season | null) ?? null);
			if (seasons.includes(null))
				return failure(
					`Unknown season(s) ${topRightLines
						.slice(1)
						.filter(x => !(x.toUpperCase() in Season))
						.join(", ")}`
				);
			builder.seasons = seasons as Season[];
			const image = cube.querySelector(".itemjail > img:last-child");
			if (!image || image.classList.contains("itemoverlay")) return failure("Image missing or invalid");
			const imageSrc = image.getAttribute("src");
			if (!imageSrc) return failure("Image src missing or invalid");
			builder.image = imageSrc;

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
			builder.custom = false;
			builder.customItemData = null;
		}


		entries.push(builder as RawItemDatabaseEntry);
	}
	return success(entries);
};
