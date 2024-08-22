import { failure, Result, success } from "@/util/result";
import { JSDOM } from "jsdom";
import { RawMarketEntry } from "./marketParser";

export interface RawShopEntry {
	shopName: string;
	shopUrl: string;
}

export const parseShopPage = (content: string): Result<RawShopEntry[]> => {
	const dom = new JSDOM(content);
	const doc = dom.window.document;
	const form = doc.querySelector(".forumwide-content-area form");
	if (!form) return failure("Invalid page layout");
	const lines = [...form.querySelectorAll(".shops-itemcube")];
	const entries: RawShopEntry[] = [];
	const template: Partial<RawShopEntry> = {};
	for (const line of lines) {

	}
	return success(entries);
};