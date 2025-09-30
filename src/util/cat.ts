import * as R from "remeda";
import { pceLink, weightedRandom, weightedRandomKeys } from "./util";
import { z } from "zod";
import offsets from "./catOffsets.json";
import { regex } from "regex";
import { failure, success } from "./result";
import { accentNames, colorNames, patternNames } from "./catData";
import type { Cat } from "@prisma/client";

export const offsetList = Object.entries(offsets).flatMap(([k, v]) =>
	Object.entries(v).flatMap(([n, l]) => Object.entries(l).flatMap(([m, q]) => Object.entries(q).flatMap(([key, data]) => ({ position: data, key: [k, n, m, key].join("_") }))))
);
const speciesType = z.enum(["C", "M"]);
const windType = z.enum(["O", "N", "S"]);
const furType = z.enum(["S", "L"]);
const colorType = z.enum(["B", "O"]);
const dilutionType = z.enum(["F", "D"]);
const density = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
const patternType = z.enum(["Y", "N"]);
const spottingType = z.enum(["T", "M", "S", "P", "A"]);
const whiteType = z.enum(["Y", "N"]);
const whiteNumberType = z.union([
	z.literal(0),
	z.literal(1),
	z.literal(2),
	z.literal(3),
	z.literal(4),
	z.literal(5),
	z.literal(6),
	z.literal(7),
	z.literal(8),
	z.literal(9),
	z.literal(10),
]);
const whitePatternType = z.enum(["C", "P", "L", "R", "I", "T"]);
const accentType = z.enum(["B", "L", "R", "Y"]);
const growthType = z.enum(["A", "B", "C"]);
const unknownType = z.literal("?");

const optional = <T>(type: z.ZodType<T>) => {
	return z.union([type, z.literal("?")]);
};

export const catGeneSchema = z.object({
	species: speciesType,
	wind: z.tuple([windType, windType]).readonly(),
	fur: z.tuple([furType, furType]).readonly(),
	color: z.tuple([colorType, colorType]).readonly(),
	dilution: z.tuple([dilutionType, dilutionType]).readonly(),
	density: density,
	pattern: z.tuple([patternType, patternType]).readonly(),
	spotting: z.tuple([spottingType, spottingType]).readonly(),
	white: z.tuple([whiteType, whiteType]).readonly(),
	whiteNumber: whiteNumberType,
	whiteType: whitePatternType,
	accent: z.tuple([accentType, accentType]).readonly(),
	growth: z.tuple([growthType, growthType]).readonly(),
});

export type CatGene = Readonly<z.TypeOf<typeof catGeneSchema>>;

const partialCatGeneSchema = catGeneSchema.extend({
	wind: z.tuple([windType, z.union([windType, unknownType])]).readonly(),
	fur: z.tuple([furType, optional(furType)]).readonly(),
	pattern: z.tuple([optional(patternType), optional(patternType)]).readonly(),
	color: z.tuple([optional(colorType), optional(colorType)]).readonly(),
	dilution: z.tuple([optional(dilutionType), optional(dilutionType)]).readonly(),
	density: optional(density),
	spotting: z.tuple([optional(spottingType), optional(spottingType)]).readonly(),
	white: z.tuple([optional(whiteType), optional(whiteType)]).readonly(),
	whiteNumber: optional(whiteNumberType),
	whiteType: optional(whitePatternType),
	growth: z.tuple([optional(growthType), optional(growthType)]).readonly(),
	accent: z.tuple([optional(accentType), optional(accentType)]).readonly(),
	unknownOrder: z
		.object({
			wind: z.boolean().optional(),
			fur: z.boolean().optional(),
			color: z.boolean().optional(),
			dilution: z.boolean().optional(),
			pattern: z.boolean().optional(),
			spotting: z.boolean().optional(),
			white: z.boolean().optional(),
			growth: z.boolean().optional(),
			accent: z.boolean().optional(),
		})
		.readonly()
		.optional(),
});

export type PartialCatGene = z.TypeOf<typeof partialCatGeneSchema>;

export const randomCatGene = (species: "C" | "M" = R.sample(["C", "M"] as const, 1)[0]): CatGene => {
	const firstWind = weightedRandomKeys({
		O: 14,
		N: 43,
		S: 43,
	});
	const secondWind = weightedRandomKeys({
		O: 14,
		N: 43,
		S: 43,
	});
	const firstFur = weightedRandomKeys({
		S: 50,
		L: 50,
	});
	const secondFur = weightedRandomKeys({
		S: 50,
		L: 50,
	});
	const firstColor = weightedRandomKeys({
		B: 50,
		O: 50,
	});
	const secondColor = weightedRandomKeys({
		B: 50,
		O: 50,
	});
	const firstDilution = weightedRandomKeys({
		F: 50,
		D: 50,
	});
	const secondDilution = weightedRandomKeys({
		F: 50,
		D: 50,
	});
	const density = +weightedRandomKeys({
		1: 10,
		2: 20,
		3: 40,
		4: 30,
	});

	const firstPattern = weightedRandomKeys({
		Y: 80,
		N: 20,
	});
	const secondPattern = weightedRandomKeys({
		Y: 80,
		N: 20,
	});
	const firstSpotting = weightedRandomKeys({
		T: 50,
		M: 20,
		S: 25,
		P: 5,
	});
	const secondSpotting = weightedRandomKeys({
		T: 50,
		M: 20,
		S: 25,
		P: 5,
	});

	const firstWhite = weightedRandomKeys({
		Y: 50,
		N: 50,
	});
	const secondWhite = weightedRandomKeys({
		Y: 50,
		N: 50,
	});
	// i now realize that all of the weightings are slightly off by 1%
	const whiteNumber = +weightedRandomKeys({
		0: 1,
		1: 20,
		2: 20,
		3: 15,
		4: 10,
		5: 10,
		6: 10,
		7: 5,
		8: 5,
		9: 3,
		10: 1,
	});
	const whiteType = weightedRandomKeys({
		I: 10,
		R: 20,
		L: 20,
		P: 65,
		C: 85,
	});

	// growth values experimentally found
	const firstGrowth = weightedRandomKeys({
		A: 30,
		B: 50,
		C: 20,
	});
	const secondGrowth = weightedRandomKeys({
		A: 30,
		B: 50,
		C: 20,
	});
	// accent values experimentally found
	const firstAccent = weightedRandomKeys({
		R: 21,
		B: 41,
		L: 31,
		Y: 7,
	});
	const secondAccent = weightedRandomKeys({
		R: 21,
		B: 41,
		L: 31,
		Y: 7,
	}); // TODO maybe add the new white and pattern
	return {
		species,
		wind: [firstWind, secondWind],
		fur: [firstFur, secondFur],
		color: [firstColor, secondColor],
		dilution: [firstDilution, secondDilution],
		density: density as 1 | 2 | 3 | 4,
		pattern: [firstPattern, secondPattern],
		spotting: [firstSpotting, secondSpotting],
		white: [firstWhite, secondWhite],
		whiteNumber: whiteNumber as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
		whiteType,
		accent: [firstAccent, secondAccent],
		growth: [firstGrowth, secondGrowth],
	};
};

export type CatColor =
	| "black"
	| "choco"
	| "brown"
	| "tan"
	| "snow"
	| "charc"
	| "grey"
	| "smoke"
	| "silver"
	| "red"
	| "orange"
	| "ginger"
	| "aprico"
	| "buff"
	| "cream"
	| "almond"
	| "beige";
export type CatAccent = "blue" | "indigo" | "violet" | "green" | "black" | "pink" | "ruby" | "amber" | "teal" | "gold";

const catColors = {
	B: {
		F: { 4: "black", 3: "choco", 2: "brown", 1: "tan", 0: "snow" },
		D: { 4: "charc", 3: "grey", 2: "smoke", 1: "silver", 0: "snow" },
	},
	O: {
		F: { 4: "red", 3: "ginger", 2: "orange", 1: "aprico", 0: "snow" },
		D: { 4: "buff", 3: "cream", 2: "almond", 1: "beige", 0: "snow" },
	},
} satisfies Record<z.TypeOf<typeof colorType>, Record<z.TypeOf<typeof dilutionType>, Record<number, CatColor>>>;

export const catColorList = [...new Set(Object.values(catColors).flatMap(x => Object.values(x).flatMap(x => Object.values(x))))] as CatColor[];

const generateAlleleMap = <T>(map: Record<string, T>) => {
	const out: Record<string, Record<string, T>> = {};
	for (const [k, v] of Object.entries(map)) {
		out[k[0]] ??= {};
		out[k[0]][k[1]] = v;
		out[k[1]] ??= {};
		out[k[1]][k[0]] = v;
	}
	return out;
};

export const catPatterns = generateAlleleMap({
	TT: "mackerel",
	TM: "classic",
	TS: "broken",
	TP: "lynxpoint",
	TA: "ticked",
	MM: "clouded",
	MS: "rosette",
	MP: "cloudpoint",
	MA: "ripple",
	SS: "spotted",
	SP: "mink",
	SA: "agouti",
	PP: "colorpoint",
	PA: "karpati",
	AA: "freckle",
} as const);

export type CatPattern = (typeof catPatterns)[keyof typeof catPatterns][keyof typeof catPatterns] | "solid";

export const catPatternList = ["solid" as CatPattern].concat([...new Set(Object.values(catPatterns).flatMap(x => Object.values(x)))] as CatPattern[]);

export type CatSpecies = "c" | "m";

export const catSpeciesList: CatSpecies[] = ["c", "m"];
export const catSpeciesNames = { c: "Not-Cat", m: "Mercat" };

export const whiteTypes = {
	I: "inverse",
	R: "right",
	L: "left",
	P: "piebald",
	C: "classic",
	T: "tabby",
} as const satisfies Record<z.TypeOf<typeof whitePatternType>, string>;

export type CatWhiteType = (typeof whiteTypes)[keyof typeof whiteTypes];

export const whiteTypeList = Object.values(whiteTypes) as CatWhiteType[];

export const accents: Record<z.TypeOf<typeof accentType>, Record<z.TypeOf<typeof accentType>, CatAccent>> = {
	B: { B: "blue", L: "indigo", R: "violet", Y: "green" },
	L: { B: "indigo", L: "black", R: "pink", Y: "teal" },
	R: { B: "violet", L: "pink", R: "ruby", Y: "amber" },
	Y: { B: "green", L: "teal", R: "amber", Y: "gold" },
};

export const accentTypeList = [...new Set(Object.values(accents).flatMap(x => Object.values(x)))] as CatAccent[];

const growthTypes = {
	A: {
		A: "Very Early",
		B: "Early",
		C: "Decreasing",
	},
	B: {
		A: "Arch",
		B: "Steady",
		C: "Dip",
	},
	C: {
		A: "Very Late",
		B: "Late",
		C: "Increasing",
	},
};

export const randomCatTexture = (species: "C" | "M" = "C") => {
	const age = weightedRandomKeys({
		adult: 7,
		kitten: 2,
		bean: 1,
	});

	const pose = weightedRandomKeys({
		upsidedown: 10,
		playing: 20,
		sleeping: 20,
		standing: 25,
		sitting: 25,
	});

	const eyes = weightedRandomKeys({
		squint: 10,
		sleepy: 10,
		uwu: 10,
		content: 10,
		danger: 10,
		sad: 10,
		stern: 10,
		right: 10,
		left: 10,
		neutral: 110,
	});
	return textureFromGene(age, pose, eyes, randomCatGene(species));
};

export interface GenePhenotype {
	wind: "North" | "South" | "Null" | "Trade";
	fur: "shorthair" | "longhair";
	mainColor: CatColor | null;
	tradeColor: CatColor | null;
	pattern: CatPattern | null;
	accent: CatAccent | "?";
	whiteType: CatWhiteType | "?";
	whiteNumber: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | "?";
	species: "c" | "m";
	growthType: string;
}

export const getGenePhenotype = (gene: PartialCatGene): GenePhenotype => {
	const species = gene.species === "C" ? "c" : gene.species === "M" ? "m" : "c";
	const wind = (() => {
		if ((gene.wind[0] === "O" && gene.wind[1] === "?") || gene.wind.every(x => x === "O")) return "Null";
		if (gene.wind.every(x => x === "N" || x === "S") && gene.wind[0] !== gene.wind[1]) return "Trade";
		const found = gene.wind.find(x => x === "N" || x === "S")!;
		if (found === "N") return "North";
		return "South";
	})();

	const fur = gene.fur.includes("S") ? "shorthair" : "longhair";

	const mainColor = (() => {
		if (gene.color.every(x => x === "?")) return null;
		if (wind === "Null") return "snow";
		const g = gene as PartialCatGene;
		const dilution = g.dilution.includes("F") ? "F" : "D";
		if (wind === "North" || wind === "Trade") return catColors[g.color[0] === "?" ? (g.color[1] as "O") : g.color[0]][dilution as "F"][g.density as 1];
		else return catColors[g.color[1] === "?" ? (g.color[0] as "O") : g.color[1]][dilution as "F"][g.density as 1];
	})();
	const tradeColor = (() => {
		if (gene.color.every(x => x === "?")) return null;
		if (wind !== "Trade") return null;
		const g = gene as PartialCatGene;
		const dilution = g.dilution.includes("F") ? "F" : "D";
		if (g.color[0] === g.color[1]) return catColors[g.color[0] as "O"][dilution][((g.density as 1) - 1) as 0 | 1 | 2 | 3 | 4];
		else return catColors[g.color[1] as "O"][dilution][g.density as 1];
	})();

	const pattern = (() => {
		if (gene.pattern.every(x => x === "?")) return null;
		if (!gene.pattern.includes("Y") || gene.spotting[0] === "?" || gene.spotting[1] === "?") return "solid";
		return catPatterns[gene.spotting[0]][gene.spotting[1]];
	})();

	const accent = (() => {
		if (gene.accent.every(x => x === "?")) return "?";
		if (gene.accent[0] === "?") return accents[gene.accent[1] as "L"][gene.accent[1] as "L"];
		else if (gene.accent[1] === "?") return accents[gene.accent[0] as "L"][gene.accent[0] as "L"];
		return accents[gene.accent[0]][gene.accent[1]];
	})();

	const whiteType = gene.whiteType === "?" ? "?" : whiteTypes[gene.whiteType];
	const whiteNumber = gene.white.some(x => x === "Y") ? gene.whiteNumber : 0;
	const growthType = gene.growth.includes("?") ? "?" : growthTypes[gene.growth[0] as "A" | "B" | "C"][gene.growth[1] as "A" | "B" | "C"];

	return { wind, fur, mainColor, tradeColor, pattern, accent, whiteType, whiteNumber, species, growthType };
};

export const getCatTextures = (p: GenePhenotype) => ({
	color: p.whiteNumber !== 10 && p.whiteNumber !== "?" ? `images/cats/${p.species}/${p.mainColor}_main_${p.pattern}.png` : null,
	tradeColor: p.tradeColor !== null ? `images/cats/${p.species}/${p.tradeColor}_trade_${p.pattern}.png` : null,
	white: p.whiteNumber !== 0 ? `images/cats/${p.species}/white_${p.whiteType}_${p.whiteNumber === "?" ? 10 : p.whiteNumber}.png` : null,
	accent: p.species === "m" ? `images/cats/${p.species}/${p.accent}_accent_${p.pattern}.png` : null,
});

export const getCatTextureProperties = (p: GenePhenotype) =>
	[
		p.whiteNumber !== 10 && p.whiteNumber !== "?"
			? { species: p.species, color: p.mainColor!, pattern: p.pattern!, shown: true }
			: { species: p.species, color: "-", pattern: "-", shown: false },
		p.tradeColor !== null ? { species: p.species, color: p.tradeColor!, pattern: p.pattern!, shown: true } : { species: p.species, color: "-", pattern: "-", shown: false },
		p.whiteNumber !== 0
			? {
					species: p.species,
					whiteType: p.whiteType,
					whiteNumber: p.whiteNumber === "?" ? 10 : p.whiteNumber,
					shown: true,
			  }
			: ({ species: p.species, whiteType: "-", whiteNumber: "-", shown: false } as const),
		p.species === "m"
			? { species: p.species, accent: p.accent, pattern: p.pattern!, shown: true }
			: { species: p.species as "c" | "m", accent: "-", pattern: "-", shown: false },
		{ eyes: "neutral", albinoType: p.whiteNumber === 10 ? p.whiteType : "-", shown: true },
	] as const;

export const catEyes = [
	"squint",
	"sleepy",
	"uwu",
	"content",
	"danger",
	"sad",
	"stern",
	"right",
	"left",
	"neutral",
	"wink",
	"happy",
	"pensive",
	"ough",
	"sparkling",
	"wimdy",
	"whoa",
	"zoinks",
	"sneer",
	"cute",
] as const;
export type CatEyes = (typeof catEyes)[number];
export const catEyesNames = {
	squint: "Squint",
	sleepy: "Sleepy",
	uwu: "UwU",
	content: "Content",
	danger: "Danger",
	sad: "Sad",
	stern: "Stern",
	right: "Right",
	left: "Left",
	neutral: "Neutral",
	wink: "Wink",
	happy: "Happy",
	pensive: "Pensive",
	ough: "Ough",
	sparkling: "Sparkling",
	wimdy: "Wimdy",
	whoa: "Whoa",
	zoinks: "Zoinks",
	sneer: "Sneer",
	cute: "Cute",
};

export const textureFromGene = (age: "adult" | "kitten" | "bean", pose: "upsidedown" | "playing" | "sleeping" | "standing" | "sitting", eyes: CatEyes, gene: PartialCatGene) => {
	const p = getGenePhenotype(gene);

	const t = getCatTextures(p);
	const images: (string | null)[] = [];
	images.push(t.color);
	images.push(t.tradeColor);
	images.push(t.white);
	images.push(t.accent);
	images.push(`images/cats/eyes_${eyes}${p.whiteNumber === 10 ? `_a_${p.whiteType}` : ""}.png`);

	return { images: images.map(x => (x ? pceLink(x) : x)), offset: offsets[p.species][age][p.fur][pose] };
};

export const serializeCatGene = (gene: PartialCatGene, formatted: boolean = false) => {
	const components = [
		gene.species,
		gene.unknownOrder?.wind ? `{${gene.wind.join("")}}` : gene.wind,
		gene.unknownOrder?.fur ? `{${gene.fur.join("")}}` : gene.fur,
		[...(gene.unknownOrder?.color ? `{${gene.color.join("")}}` : gene.color), ...(gene.unknownOrder?.dilution ? `{${gene.dilution.join("")}}` : gene.dilution), gene.density],
		gene.unknownOrder?.pattern && gene.unknownOrder?.spotting
			? `{${gene.pattern.join("")}${gene.spotting.join("")}}`
			: [...(gene.unknownOrder?.pattern ? `{${gene.pattern.join("")}}` : gene.pattern), ...(gene.unknownOrder?.spotting ? `{${gene.spotting.join("")}}` : gene.spotting)],
		[...(gene.unknownOrder?.white ? `{${gene.white.join("")}}` : gene.white), gene.whiteNumber, gene.whiteType],
		gene.unknownOrder?.growth ? `{${gene.growth.join("")}}` : gene.growth,
		gene.unknownOrder?.accent ? `{${gene.accent.join("")}}` : gene.accent,
	].map(x => (x instanceof Array ? x.join("") : x));

	if (formatted) return components.map(x => (x.startsWith("{") && x.endsWith("}") ? x : `[${x}]`)).join(" ");
	return components.join("");
};

const geneRegex = regex`
	\[?\s*(?<species>[CM])\s*\]?\s*
	(?<windBracket>\[|\{)?\s*(?<wind>[NSO?]{2})\s*(\]|\})?\s*
	(?<furBracket>\[|\{)?\s*(?<fur>[SL?]{2})\s*(\]|\})?\s*
	\[?\s*(?<colorBracket>\{)?\s*(?<color>[BO?]{2})\s*\}?\s*(?<dilutionBracket>\{)?\s*(?<dilution>[FD?]{2})\s*\}?\s*(?<density>[1234?])\s*\]?\s*
	(?<patternSectionBracket>\[|\{)?\s*(?<patternBracket>\{)?\s*(?<pattern>[YN?]{2})\s*(?<patternEndBracket>\})?\s*(?<spottingBracket>\{)?\s*(?<spotting>[TMSPA]{2})\s*\}?\s*(\]|\})?\s*
	\[?\s*(?<whiteBracket>\{)?\s*(?<white>[YN?]{2})\s*\}?\s*(?<whiteNumber>[0123456789?]|10)(?<whitePattern>[CPLRIT])\s*\]?\s*
	(?<growthBracket>\[|\{)?\s*(?<growth>[ABC?]{2})\s*(\]|\})?\s*
	(?<accentBracket>\[|\{)?\s*(?<accent>[BLRY?]{2})\s*(\]|\})?
`;

export const deserializeCatGene = (text: string) => {
	const parsed = text.match(geneRegex);
	if (!parsed?.groups) return failure(`Invalid gene "${text}"`);
	const g = parsed.groups;
	const data = partialCatGeneSchema.safeParse({
		species: g.species,
		wind: g.wind.split(""),
		fur: g.fur.split(""),
		color: g.color.split(""),
		dilution: g.dilution.split(""),
		density: isNaN(+g.density) ? g.density : +g.density,
		pattern: g.pattern.split(""),
		spotting: g.spotting.split(""),
		white: g.white.split(""),
		whiteNumber: isNaN(+g.whiteNumber) ? g.whiteNumber : +g.whiteNumber,
		whiteType: g.whitePattern,
		accent: g.accent.split(""),
		growth: g.growth.split(""),
		unknownOrder: {
			wind: g.windBracket === "{",
			fur: g.furBracket === "{",
			color: g.colorBracket === "{",
			dilution: g.dilutionBracket === "{",
			pattern: g.patternBracket === "{" || g.patternSectionBracket === "{",
			spotting: g.spottingBracket === "{" || (g.patternSectionBracket === "{" && g.patternEndBracket !== "}"),
			white: g.whiteBracket === "{",
			growth: g.growthBracket === "{",
			accent: g.accentBracket === "{",
		},
	});
	if (data.error) return failure(data.error.message);
	return success(data.data);
};
const eyeColorToType: Record<string, CatWhiteType> = {
	"Pale Red": "classic",
	"Pale Violet": "piebald",
	"Pale Blue": "left",
	"Pale Green": "right",
	"Pale Gold": "inverse",
};

export const parseCatBio = (bio: { species: string; color: string; pattern: string; white: string; accent?: string; eyes: string }): ReturnType<typeof getCatTextureProperties> => {
	const species = bio.species === "Not-cat" ? "c" : "m";
	const whiteData = bio.white.match(/\/ ([a-zA-Z]+)(\d+)/)!;
	const whiteType = whiteData ? whiteTypes[whiteData[1] as keyof typeof whiteTypes] : null;
	const whiteNumber = whiteData ? (+whiteData[2] as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10) : 0;
	const colorData =
		bio.color === "-hidden-" ? null : bio.color.includes("Standard") ? bio.color.match(/(\w+) Standard/)?.[1] ?? null : bio.color.match(/(\w+)-(\w+) \w+/)?.slice(1);
	const mainColorText = colorData ? (colorData instanceof Array ? colorData[0] : colorData) : null;
	const mainColor = mainColorText ? Object.entries(colorNames).find(x => x[1] === mainColorText)?.[0] : null;
	const tradeColor = colorData instanceof Array ? Object.entries(colorNames).find(x => x[1] === colorData[1])?.[0] : null;
	const pattern = Object.entries(patternNames).find(x => x[1] === bio.pattern)?.[0] as CatPattern;
	const accent = bio.accent ? (Object.entries(accentNames).find(x => x[1] === bio.accent)?.[0] as CatAccent) : null;
	return [
		whiteNumber !== 10 && mainColor && pattern ? { species, color: mainColor, pattern, shown: true } : { species, color: "-", pattern: "-", shown: false },
		tradeColor && pattern ? { species: species, color: tradeColor, pattern: pattern, shown: true } : { species: species, color: "-", pattern: "-", shown: false },
		whiteNumber !== 0 && whiteType ? { species, whiteType, whiteNumber, shown: true } : ({ species, whiteType: "-", whiteNumber: "-", shown: false } as const),
		species === "m" && accent && pattern ? { species, accent, pattern, shown: true } : { species, accent: "-", pattern: "-", shown: false },
		{ eyes: bio.eyes as "neutral", albinoType: whiteNumber === 10 && whiteType ? whiteType : "-", shown: true },
	] as const;
};
export const parseCatBioObj = (...args: Parameters<typeof parseCatBio>) => {
	const [mainColor, tradeColor, white, accent] = parseCatBio(...args);
	return { mainColor, tradeColor, white, accent };
};

export const geneFromColor = (color: string): "B" | "O" | "?" =>
	color === "snow" ? "?" : (Object.entries(catColors).find(x => Object.values(x[1]).some(y => Object.values(y).some(z => z === color)))?.[0] as "B") ?? "?";
export const dilutionFromColor = (color: string) => {
	if (color === "snow") return "?";
	for (const list of Object.values(catColors)) {
		if (Object.values(list.D).includes(color as "buff")) return "D";
		if (Object.values(list.F).includes(color as "black")) return "F";
	}
	return "?";
};

export const densityFromColor = (color: string): 1 | 2 | 3 | 4 | "?" => {
	if (color === "snow") return "?";
	for (const list of Object.values(catColors)) {
		for (const obj of Object.values(list)) {
			if (Object.values(obj).includes(color)) {
				const n = Object.entries(obj).find(x => x[1] === color)?.[0];
				if (n === undefined) return "?";
				return +n as 1 | 2 | 3 | 4;
			}
		}
	}
	return "?";
};
export const geneFromPattern = (pattern: string): ["T" | "M" | "S" | "P" | "?", "T" | "M" | "S" | "P" | "?"] => {
	for (const [k, v] of Object.entries(catPatterns)) {
		for (const [k2, p] of Object.entries(v)) if (p === pattern) return [k as "T", k2 as "T"];
	}
	return ["?", "?"];
};
export const geneFromWhiteType = (type: string): "C" | "P" | "L" | "R" | "I" | "?" => {
	for (const [k, v] of Object.entries(whiteTypes)) {
		if (type === v) return k as "C";
	}
	return "?";
};
export const geneFromAccentColor = (accentColor: string): ["L" | "R" | "B" | "Y" | "?", "L" | "R" | "B" | "Y" | "?"] => {
	const accent = Object.entries(accentNames).find(x => x[1] === accentColor)?.[0];
	if (!accent) return ["?", "?"];
	for (const [k, v] of Object.entries(accents)) {
		for (const [k2, p] of Object.entries(v)) if (p === accent) return [k, k2] as ["L", "L"];
	}
	return ["?", "?"];
};

export interface CatAppearance {
	species: CatSpecies;
	mainColor: CatColor | null;
	pattern: CatPattern | null;
	tradeColor: CatColor | null;
	accent: CatAccent;
	whiteNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | null;
	whiteType: CatWhiteType | null;
	pose: string;
}

export const geneFromImported = (data: Omit<Cat, "trinketId" | "clothing">): PartialCatGene => {
	if (data.genetic) return deserializeCatGene(data.genetic).data!;
	const parsed = parseCatBioObj({
		color: data.color,
		eyes: data.eyeColor,
		pattern: data.pattern,
		species: data.species,
		white: data.whiteMarks,
		accent: data.accentColor ?? "-hidden-",
	});
	const dilution = parsed.mainColor.shown ? dilutionFromColor(parsed.mainColor.color!) : "?";
	const spotting = parsed.mainColor.shown ? geneFromPattern(parsed.mainColor.pattern!) : (["?", "?"] as const);
	const accent = parsed.accent.shown ? geneFromAccentColor(parsed.accent.accent) : (["?", "?"] as const);
	return {
		species: ({ c: "C", m: "M" } as const)[parsed.mainColor.shown ? parsed.mainColor.species : parsed.white.species],
		wind: (
			{
				North: ["N", "?"],
				South: ["S", "?"],
				Trade: ["N", "S"],
				Null: ["O", "O"],
			} as const
		)[data.wind]!,
		fur: (
			{
				Longhair: ["L", "L"],
				Shorthair: ["S", "?"],
			} as const
		)[data.fur]!,
		color:
			data.wind === "Null" || !parsed.mainColor.shown
				? ["?", "?"]
				: data.wind === "North"
				? [geneFromColor(parsed.mainColor.color!), "?"]
				: data.wind === "South"
				? ["?", geneFromColor(parsed.mainColor.color!)]
				: [
						geneFromColor(parsed.mainColor.color!),
						geneFromColor(parsed.tradeColor.color) === "?" ? geneFromColor(parsed.mainColor.color!) : geneFromColor(parsed.tradeColor.color),
				  ],
		dilution: dilution === "F" ? ["F", "?"] : dilution === "D" ? ["D", "D"] : ["?", "?"],
		density: parsed.mainColor.shown ? densityFromColor(parsed.mainColor.color!) : "?",
		pattern: parsed.mainColor.shown ? (parsed.mainColor.pattern === "solid" ? ["N", "N"] : ["Y", "?"]) : ["?", "?"],
		spotting,
		white: parsed.white.shown ? ["Y", "?"] : ["?", "?"], // it could be from 0
		whiteNumber: parsed.white.shown ? parsed.white.whiteNumber : "?",
		whiteType: parsed.white.shown ? geneFromWhiteType(parsed.white.whiteType) : "?",
		accent: accent,
		growth: ["?", "?"],
		unknownOrder: {
			wind: data.wind !== "Null",
			fur: data.fur === "Shorthair",
			dilution: dilution !== "D",
			pattern: !parsed.mainColor.shown || parsed.mainColor.pattern !== "solid",
			spotting: spotting[0] !== spotting[1] || spotting.every(x => x === "?"),
			white: true,
			accent: accent[0] !== accent[1] || accent.every(x => x === "?"),
		},
	};
};
export interface PossibleGenes {
	wind: readonly ["N" | "S" | "O", "N" | "S" | "O"][];
	fur: readonly ["S" | "L", "S" | "L"][];
	color: readonly ["O" | "B", "O" | "B"][];
	dilution: readonly ["F" | "D", "F" | "D"][];
	density: readonly (1 | 2 | 3 | 4)[];
	pattern: readonly ["Y" | "N", "Y" | "N"][];
	spotting: readonly ["T" | "M" | "S" | "P", "T" | "M" | "S" | "P"][];
	white: readonly [["Y" | "N", "Y" | "N"], 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10][];
	whiteType: readonly ("C" | "P" | "L" | "R" | "I")[];
	accent: readonly ["B" | "L" | "R" | "Y", "B" | "L" | "R" | "Y"][];
}

export const possibleGenes = (gene: PartialCatGene): PossibleGenes => {
	return {
		wind: (gene.wind.includes("?")
			? [gene.wind.map(x => (x === "?" ? "O" : x)), gene.wind.map(x => (x === "?" ? gene.wind.find(x => x !== "?")! : x))]
			: [gene.wind]) as unknown as readonly ["N" | "S" | "O", "N" | "S" | "O"][],
		fur: gene.fur.includes("?") ? [gene.fur.map(x => (x === "?" ? "S" : x)), gene.fur.map(x => (x === "?" ? "L" : x))] : [gene.fur],
		color: gene.color.every(x => x === "?")
			? [
					["B", "B"],
					["B", "O"],
					["O", "O"],
			  ]
			: gene.color.includes("?")
			? [gene.color.map(x => (x === "?" ? "O" : x)), gene.color.map(x => (x === "?" ? "B" : x))]
			: [gene.color],
		dilution: gene.dilution.every(x => x === "?")
			? [
					["F", "F"],
					["F", "D"],
					["D", "D"],
			  ]
			: gene.dilution.includes("?")
			? [gene.dilution.map(x => (x === "?" ? "F" : x)), gene.dilution.map(x => (x === "?" ? "D" : x))]
			: [gene.dilution],
		density: gene.density === "?" ? [1, 2, 3, 4] : [gene.density],
		pattern: gene.pattern.every(x => x === "?")
			? [
					["Y", "N"],
					["Y", "Y"],
					["N", "N"],
			  ]
			: gene.pattern.includes("?")
			? [gene.pattern.map(x => (x === "?" ? "Y" : x)), gene.pattern.map(x => (x === "?" ? "N" : x))]
			: [gene.pattern],
		spotting: gene.spotting.every(x => x === "?")
			? [
					["T", "T"],
					["T", "M"],
					["T", "S"],
					["T", "P"],
					["M", "M"],
					["M", "S"],
					["M", "P"],
					["S", "S"],
					["S", "P"],
					["P", "P"],
			  ]
			: [gene.spotting],
		white: gene.white.every(x => x === "?")
			? [
					["Y", "N"],
					["Y", "Y"],
			  ]
					.map(x => [x, 0])
					.concat([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(x => [["N", "N"], x]))
			: gene.white.includes("?")
			? [gene.white.map(x => (x === "?" ? "Y" : x)), gene.white.map(x => (x === "?" ? "N" : x))].map(x => [x, gene.whiteNumber])
			: [[gene.white, gene.whiteNumber]],
		whiteNumber: gene.whiteNumber === "?" ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : [gene.whiteNumber],
		whiteType: gene.whiteType === "?" ? ["C", "P", "L", "R", "I"] : [gene.whiteType],
		accent: gene.accent.every(x => x === "?")
			? [
					["B", "B"],
					["B", "L"],
					["B", "R"],
					["B", "Y"],
					["L", "L"],
					["L", "R"],
					["L", "Y"],
					["R", "R"],
					["R", "Y"],
					["Y", "Y"],
			  ]
			: [gene.accent],
	} as unknown as PossibleGenes;
};
