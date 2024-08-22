import { failure, Result, success } from "@/util/result";
import { RecipeCategory, Season } from "@prisma/client";
import { JSDOM } from "jsdom";
import { parseItemCubeId } from "./parserUtil";

export interface RawRecipeDatabaseEntries {
	entries: RawRecipeDatabaseEntry[];
	category: RecipeCategory;
}
export interface RawRecipeDatabaseEntry {
	resultId: number;
	resultCount: number;
	ingredients: { itemId: number; count: number };
}

export const parseItemDatabasePage = (content: string): Result<RawRecipeDatabaseEntries> => {
	const dom = new JSDOM(content);
	const doc = dom.window.document;
	const form = doc.querySelector(".forumwide-content-area form");
	if (!form) return failure("Invalid page layout");
	if (!form.getAttribute("action")?.includes("/crafts")) return failure("Not a crafting database page");
	const categoryHref = form.querySelector(".crafting-category.chosen a")?.getAttribute("href");
	if (!categoryHref) return failure("Category missing or invalid");
	const categoryId = categoryHref?.match(/&group=(.+)/)?.[1];
	if (!categoryId) return failure(categoryHref.endsWith("crafts") ? "Category filter cannot be [View all Crafts]" : "Missing category id");
	const category = RecipeCategory[categoryId.toUpperCase() as keyof typeof RecipeCategory] as RecipeCategory | undefined;
	if (!category) return failure(`Unknown category "${categoryId}`);
	const groups = [...form.querySelectorAll(".crafting-group")];
	const entries: RawRecipeDatabaseEntry[] = [];
	for (const group of groups) {
		const builder: Partial<RawRecipeDatabaseEntry> = {};

		const resultItem = parseItemCubeId(group.querySelector(".mini-itemcube"));
		if (!resultItem.ok) return failure(`Failed to parse result item: ${resultItem.message}`);
		builder.resultId = resultItem.data;



		entries.push(builder as RawRecipeDatabaseEntry);
	}
	return success({ entries, category });
};
