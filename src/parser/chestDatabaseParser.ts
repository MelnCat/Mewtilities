import { parseDom } from "@/util/dom";
import { failure, Result, success } from "@/util/result";

export interface RawChestDatabaseEntry {
	id: number;
	pools?: {
		id: string;
		count: number;
		items: number[];
	}[];
	notes?: number;
	essence?: number;
	cat?: string;
}

export const parseChestDatabasePage = (content: string): Result<RawChestDatabaseEntry[]> => {
	const doc = parseDom(content);
	const list = doc.querySelector(".forumwide-content-area");
	if (!list) return failure("Invalid page layout");
	const lines = list.querySelectorAll(".enclosed-group");
	if (!lines.length) return failure("No valid entries found");
	const entries: RawChestDatabaseEntry[] = [];
	for (const line of lines) {
		const builder: Partial<RawChestDatabaseEntry> = {};

		const title = line.querySelector("h4");
		if (!title) return failure("Title missing");
		const titleContent = title.textContent?.trim().match(/#(\d+)/)?.[1];
		if (!titleContent || isNaN(+titleContent)) return failure(`Title content invalid: ${title}`);
		builder.id = +titleContent;

		const findWithName: {
			(name: string, type: "text"): string | null;
			(name: string, type?: "number"): number | null;
		} = (name, type) => {
			const index = [...line.childNodes].findIndex(x => x.textContent?.trim() === name);
			if (!index) return null;
			const child = line.childNodes[index + 1];
			if (!child || !child.textContent || (type === "number" && isNaN(+child.textContent))) return null;
			return type === "number" ? (+child.textContent as any) : (child.textContent.trim() as any);
		};

		const notes = findWithName("Notes:");
		const essence = findWithName("Essence Fragments:");
		const cat = findWithName("Spawns Cat:", "text");

		if (notes) builder.notes = notes;
		if (essence) builder.essence = essence;
		if (cat) builder.cat = cat;

		const pools = [...line.childNodes.entries()].filter(x => x[1].textContent?.toLowerCase().startsWith("pool "));
		builder.pools = [];
		for (const [i, pool] of pools) {
			const text = pool.textContent!;
			const content = line.childNodes[i + 2]?.textContent
				?.split(",")
				.map(x => x.trim())
				.map(x => x.match(/#(\d+)/)?.[1])
				.filter(x => x);
			if (!content?.length) return failure(`Pool ${text} invalid`);
			const data = text.match(/pool (\w+) \[x(\d+)\]/i);
			if (!data) return failure(`Failed to parse ${text} title`);
			const [, id, n] = data;
			if (!id || !n) failure(`Missing ${text}`);
			builder.pools.push({
				id,
				count: +n,
				items: content.map(x => +x!),
			});
		}

		entries.push(builder as RawChestDatabaseEntry);
	}
	return success(entries);
};
