import { readFileSync } from "fs";
import { JSDOM } from "jsdom";
import { Temporal } from "temporal-polyfill";
import { RawMarketEntry } from "./marketParser";
import { Result } from "@/util/result";

export interface RawShopEntry {
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
	}
	return { type: "success", data: entries };
};
