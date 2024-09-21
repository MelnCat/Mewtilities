import { parseDom } from "@/util/dom";
import { failure, Result, success } from "@/util/result";
import { Season } from "@prisma/client";

export interface RawBeanSandboxEntry {
	parents: [number, number];
	results: {

	}
}

export const parseBeanSandboxPage = (content: string): Result<RawBeanSandboxEntry> => {
	const doc = parseDom(content);
	const form = doc.querySelector(".forumwide-content-area form");
	if (!form) return failure("Invalid page layout");
	if (!form.getAttribute("action")?.includes("/sandbox/beans")) return failure("Not a bean sandbox page");
	const cubes = [...form.querySelectorAll(".itemcube")];
	return success({} as RawBeanSandboxEntry)
};
