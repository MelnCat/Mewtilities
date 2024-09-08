import { JSDOM } from "jsdom";

export const parseDom = (str: string) => {
	if ("DOMParser" in globalThis) return new DOMParser().parseFromString(str, "text/html");
	return new JSDOM(str).window.document;
};
