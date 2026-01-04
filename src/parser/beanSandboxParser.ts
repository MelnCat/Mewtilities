import { CatAppearance } from "@/util/cat";
import { parseDom } from "@/util/dom";
import { failure, Result, success } from "@/util/result";
import { Season } from "@/../generated/prisma/client";
import { parseCatJail } from "./parserUtil";

export interface RawBeanSandboxEntry {
	parents: [number, number];
	results: CatAppearance[];
}

export const parseBeanSandboxPage = (content: string): Result<RawBeanSandboxEntry> => {
	const doc = parseDom(content);
	const form = doc.querySelector(".formlike-content-area form");
	if (!form) return failure("Invalid page layout");
	if (!form.getAttribute("action")?.includes("/sandbox/beans")) return failure("Not a bean sandbox page");
	const firstParent = doc.getElementById("cat_id_n")?.getAttribute("value");
	if (!firstParent || isNaN(+firstParent)) return failure("First parent missing or invalid");
	const secondParent = doc.getElementById("cat_id_s")?.getAttribute("value");
	if (!secondParent || isNaN(+secondParent)) return failure("Second parent missing or invalid");
	const cubes = [...doc.querySelectorAll(".formlike-content-area > .horizontalflex.wrapflex.justify .catjail")];
	const results: CatAppearance[] = [];
	for (const cube of cubes) {
		const parsed = parseCatJail(cube);
		if (!parsed.ok) return parsed;
		results.push(parsed.data);
	}
	return success({
		parents: [+firstParent, +secondParent],
		results
	})
};
