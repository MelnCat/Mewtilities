import { failure, Result, success } from "@/util/result";
import { Season } from "@prisma/client";
import { JSDOM } from "jsdom";
import { parseItemCubeId } from "./parserUtil";

export interface RawResourceGatherEntry {
	roll: number;
	skillBonus: number;
	catName: string;
	catId: number;
	profession: string;
	id: string;
	time: string;
	results: {
		type: number,
		count: number
	}[]
}

export const parseGatherResourcesPage = (content: string): Result<RawResourceGatherEntry[]> => {
	const dom = new JSDOM(content);
	const doc = dom.window.document;
	const form = doc.querySelector(".forumwide-content-area");
	if (!form) return failure("Invalid page layout");
	const rows = [...form.querySelectorAll(".forum-post-group")];
	const entries: RawResourceGatherEntry[] = [];
	for (const row of rows) {
		if (row.querySelector(".jobdo-input")) continue;
		const builder: Partial<RawResourceGatherEntry> = {};
		const jobTitle = row.querySelector(".jobdo-title")?.textContent?.trim();
		if (!jobTitle) return failure("Job title missing");
		builder.profession = jobTitle;
		const skillBonus = row.querySelector(".jobdo-title + div")?.textContent?.match(/Skill (.+)/)?.[1];
		if (!skillBonus || isNaN(+skillBonus)) return failure("Skill bonus missing");
		builder.skillBonus = +skillBonus;

		const catLink = row.querySelector(".cat-head h4 a")
		if (!catLink) return failure("Cat link missing");
		const catName = catLink.textContent?.trim();
		if (!catName) return failure("Cat name missing");
		builder.catName = catName;
		const catId = catLink.getAttribute("href")?.match(/&id=(\d+)/)?.[1];
		if (!catId || isNaN(+catId)) return failure("Cat id missing");
		builder.catId = +catId;

		const catRoll = row.querySelector(".die-roll")?.textContent;
		if (!catRoll || isNaN(+catRoll)) return failure("Roll missing or invalid");
		builder.roll = +catRoll;

		const timeText = doc.querySelector("#weatherlink")?.textContent?.trim().match(/.+?\| (\w+) (.+)?, Year (.+?) \|/);
		if (!timeText || !timeText[1] || !timeText[2] || !timeText[3]) return failure("Time missing or invalid");
		const formatted = `${timeText[3]}-${timeText[1]}-${timeText[2]}`;
		builder.time = formatted;
		builder.id = `${formatted}_${catId}`;

		const items = row.querySelectorAll(".jobdo-bottomhalf .mini-itemcube");
		builder.results = [];
		for (const item of items) {
			const type = parseItemCubeId(item);
			if (!type.ok) return type;
			const quantity = item.querySelector(".itemqty")?.textContent?.match(/Qty: (\d+)/)?.[1];
			if (!quantity || isNaN(+quantity)) return failure("Quantity missing or invalid");
			builder.results.push({ type: type.data, count: +quantity });
		}
		
		entries.push(builder as RawResourceGatherEntry);
	}
	return success(entries);
};
