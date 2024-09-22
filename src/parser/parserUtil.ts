import { CatAppearance } from "@/util/cat";
import { parseDom } from "@/util/dom";
import { failure, Result, success } from "@/util/result";

export const parseItemCubeId = (element: Element | null) => {
	if (!element) return failure("Missing item element");
	const idNodes = element.querySelector(".itemtitle")?.childNodes;
	if (!idNodes) return failure("Item title nodes missing");
	const idText = [...idNodes].find(x => x.nodeType === x.TEXT_NODE && x.textContent?.includes("ID#"))?.textContent?.match(/ID# (\d+)/)?.[1];
	if (!idText) return failure("Item id missing or invalid");
	const id = +idText;
	if (isNaN(id)) return failure("Item id invalid");
	return success(id);
};

export const parseCatJail = (element: Element | null): Result<CatAppearance> => {
	if (!element) return failure("Missing catjail element");
	const bases = [...element.querySelectorAll(".cat-base")];
	const mainBase = bases.find(x => x.getAttribute("src")?.includes("_main_"));
	const tradeBase = bases.find(x => x.getAttribute("src")?.includes("_trade_"));
	const accentBase = bases.find(x => x.getAttribute("src")?.includes("_accent_"));
	const white = element.querySelector(".cat-white");
	const eyes = element.querySelector(".cat-eyes");
	const species = (mainBase ?? white)?.getAttribute("src")?.match(/images\/cats\/(\w+)\//)?.[1];
	if (!species) return failure("Missing species");
	const mainColor = mainBase?.getAttribute("src")?.match(/\/(?<color>\w+)_main_(?<spotting>\w+)\.png$/)?.groups;
	const tradeColor = tradeBase?.getAttribute("src")?.match(/\/(?<color>\w+)_trade_(?<spotting>\w+)\.png$/)?.groups;
	const whiteLayer = white?.getAttribute("src")?.match(/\/white_(?<type>\w+)_(?<number>\d+)\.png$/)?.groups;
	const accent = accentBase?.getAttribute("src")?.match(/\/(?<color>\w+)_accent_(?<spotting>\w+)\.png$/)?.groups;
	return success({
		species: species as "c" | "m",
		mainColor: mainColor?.color ?? null,
		tradeColor: tradeColor?.color ?? null,
		pattern: mainColor?.spotting ?? accent?.spotting ?? null,
		pose: [...(bases[0]?.classList ?? [])].find(x => x !== "cat-base"),
		whiteType: whiteLayer?.type ?? null,
		whiteNumber: whiteLayer?.number ?? null,
		accent: accent?.color ?? null,
	} as CatAppearance);
};

export const getPageAction = (content: string) => {
	const doc = parseDom(content);
	const form = doc.querySelector(".forumwide-content-area form");
	return form?.getAttribute("action") ?? null;
};
