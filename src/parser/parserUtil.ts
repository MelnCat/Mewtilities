import { failure, success } from "@/util/result";

export const parseItemCubeId = (element: HTMLElement | null) => {
	if (!element) return failure("Missing item element");
	const idNodes = element.querySelector(".itemtitle")?.childNodes;
	if (!idNodes) return failure("Item title nodes missing");
	const idText = [...idNodes].find(x => x.nodeType === x.TEXT_NODE && x.textContent?.includes("ID#"))?.textContent?.match(/ID# (\d+)/)?.[1];
	if (!idText) return failure("Item id missing or invalid");
	const id = +idText;
	if (isNaN(id)) return failure("Item id invalid");
	return success(id);
};
