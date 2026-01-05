import { parseDom } from "@/util/dom";
import { failure, Result, success } from "@/util/result";
import { RecipeCategory } from "@/generated/prisma/enums";
import { parseItemCubeId } from "./parserUtil";

export interface RawRecipeDatabaseEntries {
	entries: RawRecipeDatabaseEntry[];
	category: RecipeCategory;
}
export interface RawRecipeDatabaseEntry {
	resultId: number;
	resultCount: number;
	ingredients: { itemId: number; count: number }[];
}

export const parseRecipeDatabasePage = (content: string): Result<RawRecipeDatabaseEntries> => {
	const doc = parseDom(content);
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
		const builder: Partial<RawRecipeDatabaseEntry> = { ingredients: [] };

		const resultItem = parseItemCubeId(group.querySelector(".mini-itemcube"));
		if (!resultItem.ok) return failure(`Failed to parse result item: ${resultItem.message}`);
		builder.resultId = resultItem.data;
		const resultCount = group.querySelector(".mini-itemcube .itemqty")?.textContent?.match(/Qty: (\d+)/)?.[1];
		if (!resultCount || isNaN(+resultCount)) return failure("Result count missing or invalid");
		builder.resultCount = +resultCount;

		for (const ingredient of group.querySelectorAll(".subtle-itemcube")) {
			const item = parseItemCubeId(ingredient);
			if (!item.ok) return failure(`Failed to parse ingredient: ${item.message}`);
			const count = ingredient.querySelector(".itemqty")?.textContent?.match(/Qty: \d+\/(\d+)/)?.[1];
			if (!count || isNaN(+count)) return failure(`Ingredient count missing or invalid`);
			builder.ingredients!.push({ itemId: item.data, count: +count });
		}

		entries.push(builder as RawRecipeDatabaseEntry);
	}
	return success({ entries, category });
}; 