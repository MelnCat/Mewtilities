import { groupBy } from "remeda";
import {
	accents,
	CatAppearance,
	catPatterns,
	densityFromColor,
	dilutionFromColor,
	geneFromColor,
	GenePhenotype,
	getGenePhenotype,
	PartialCatGene,
	possibleGenes,
	whiteTypes,
} from "./cat";
import { combineResults } from "./gene";

export interface ResultProbability<T extends string> {
	result: T;
	probability: number;
}

interface PeaGene {
	size: ["N" | "M", "N" | "M"];
	stem: ["S" | "C", "S" | "C"];
	stemColor: ["D" | "L", "D" | "L"];
	pod: ["S" | "W", "S" | "W"];
	podColor: ["G" | "Y", "G" | "Y"];
	variegationCount: ["Y" | "N", "Y" | "N", 0 | 1 | 2 | 3 | 4 | 5];
	variegationColor: ["W" | "Y", "W" | "Y"];
	flower: ["A" | "B" | "C", "A" | "B" | "C"];
	flowerColor: ["P" | "B" | "O"];
}
export interface PeaPhenotype {
	size: "Normal" | "Miniature";
	stem: "Straight" | "Curly";
	stemColor: "Dark" | "Light" | "?";
	pod: "Smooth" | "Wrinkly";
	podColor: "Green" | "Gold";
	variegation: "Yes" | "No";
	variegationColor: "White" | "Gold" | "?";
	variegationCount: 0 | 1 | 2 | 3 | 4 | 5 | "?";
	flower: "Moose" | "Squid" | "Eyes" | "Ghosts" | "Candles" | "Buttons";
	flowerColor: "Blue" | "Purple" | "Indigo" | "White";
}

const flowerTypeMap = {
	AA: "Moose",
	AB: "Squid",
	AC: "Eyes",
	BB: "Ghosts",
	BC: "Candles",
	CC: "Buttons",
};

const flowerColorMap = {
	BB: "Blue",
	BO: "Blue",
	PP: "Purple",
	OP: "Purple",
	BP: "Indigo",
	OO: "White",
};

export const getPeaPhenotype = (gene: PeaGene) => {
	const varie = gene.variegationCount.includes("Y") && gene.variegationCount[2] !== 0;
	return {
		size: gene.size.includes("N") ? "Normal" : "Miniature",
		stem: gene.stem.includes("S") ? "Straight" : "Curly",
		stemColor: gene.stemColor.includes("D") ? "Dark" : "Light",
		pod: gene.pod.includes("S") ? "Smooth" : "Wrinkly",
		podColor: gene.podColor.includes("G") ? "Green" : "Gold",
		variegation: varie ? "Yes" : "No",
		variegationColor: varie ? (gene.variegationColor.includes("W") ? "White" : "Gold") : "?",
		variegationCount: varie ? gene.variegationCount[2] : "?",
		flower: flowerTypeMap[gene.flower.toSorted().join("") as "AA"],
		flowerColor: flowerColorMap[gene.flowerColor.toSorted().join("") as "OO"],
	};
};

export const getPossiblePeaGenes = (phenotype: PeaPhenotype | null) => {
	const mendelian = <T, U>(carry: boolean, dominant: T, recessive: U) =>
		carry
			? ([
					[dominant, recessive],
					[dominant, dominant],
			  ] as const)
			: ([[recessive, recessive]] as const);
	return {
		size: !phenotype
			? [
					["N", "M"],
					["N", "N"],
					["M", "M"],
			  ]
			: mendelian(phenotype.size === "Normal", "N", "M"),
		stem: !phenotype
			? [
					["C", "C"],
					["C", "S"],
					["S", "S"],
			  ]
			: mendelian(phenotype.stem === "Straight", "S", "C"),
		stemColor: !phenotype || phenotype.stemColor === "?"
			? [
					["L", "L"],
					["D", "D"],
					["D", "L"],
			  ]
			: mendelian(phenotype.stemColor === "Dark", "D", "L"),
		pod: !phenotype
			? [
					["S", "W"],
					["S", "S"],
					["W", "W"],
			  ]
			: mendelian(phenotype.pod === "Smooth", "S", "W"),
		podColor: !phenotype
			? [
					["G", "G"],
					["G", "Y"],
					["Y", "Y"],
			  ]
			: mendelian(phenotype.podColor === "Green", "G", "Y"),
		variegation: !phenotype
			? [
					["Y", "Y"],
					["Y", "N"],
					["N", "N"],
			  ].flatMap(x => [0, 1, 2, 3, 4, 5].map(y => (x as (string | number)[]).concat(y)))
			: phenotype.variegation === "Yes" && phenotype.variegationCount !== 0
			? [
					["Y", "Y", phenotype.variegationCount],
					["Y", "N", phenotype.variegationCount],
			  ]
			: [0, 1, 2, 3, 4, 5]
					.map(x => ["N", "N", x])
					.concat([
						["Y", "Y", 0],
						["Y", "N", 0],
					]),
		variegationColor:
			phenotype?.variegation === "Yes" && phenotype.variegationCount !== 0
				? mendelian(phenotype.variegationColor === "White", "W", "Y")
				: [
						["Y", "W"],
						["Y", "Y"],
						["W", "W"],
				  ],
		flower: !phenotype
			? ["AA", "AB", "AC", "BB", "BC", "CC"].map(x => x.split(""))
			: [
					{
						Moose: "AA",
						Squid: "AB",
						Eyes: "AC",
						Ghosts: "BB",
						Candles: "BC",
						Buttons: "CC",
					}[phenotype.flower].split(""),
			  ],
		flowerColor: !phenotype
			? ["BO", "BB", "PO", "PP", "BP", "OO"].map(x => x.split(""))
			: {
					Blue: [
						["B", "B"],
						["B", "O"],
					],
					Purple: [
						["P", "P"],
						["P", "O"],
					],
					Indigo: [["B", "P"]],
					White: [["O", "O"]],
			  }[phenotype.flowerColor],
	};
};

const certain = <T>(x: readonly T[]) => [{ result: x.join(""), probability: 1 }];
const mendelian = (first: readonly [string, string], second: readonly [string, string], dominant: string, dominantPhenotype: string, recessivePhenotype: string) => {
	return combineResults(
		first.flatMap(a => second.map(b => (a === dominant || b === dominant ? { result: dominantPhenotype, probability: 1 } : { result: recessivePhenotype, probability: 1 })))
	);
};

export const calculatePeaGenes = (initial: PeaPhenotype | null, results: { result: PeaPhenotype; tester: PeaPhenotype }[]) => {
	const possible = getPossiblePeaGenes(initial);
	const checkProperty = <T extends keyof typeof possible, U extends keyof PeaPhenotype>(
		property: T,
		phenotype: U,
		combine: (first: (typeof possible)[T][number], second: (typeof possible)[T][number]) => ResultProbability<string>[] | ResultProbability<string>[]
	) => {
		if (possible[property].length === 1) return certain(possible[property][0]);
		const out: { result: string; probability: number }[] = [];
		for (const possibility of possible[property]) {
			let probability = 1;
			for (const test of results) {
				if (test.result[phenotype] === "?") continue;
				const tester = getPossiblePeaGenes(test.tester);
				const results = combineResults(tester[property].flatMap(x => combine(possibility, x)));
				if (property === "variegationColor") console.log(possibility, results, test.result[phenotype]);
				probability *= results.find(x => x.result === test.result[phenotype])?.probability ?? 0;
				if (!probability) break;
			}
			out.push({ result: possibility.join(""), probability });
		}
		return combineResults(out);
	};
	const checkMendelian = <T extends keyof PeaPhenotype & keyof typeof possible>(
		property: T,
		dominant: string,
		dominantPhenotype: string,
		recessivePhenotype: string
	) =>
		checkProperty(property, property, (a, b) =>
			mendelian(a as readonly [string, string], b as readonly [string, string], dominant, dominantPhenotype, recessivePhenotype)
		);

	const size = checkMendelian("size", "N", "Normal", "Miniature");
	const stem = checkMendelian("stem", "S", "Straight", "Curly");
	const stemColor = checkMendelian("stemColor", "D", "Dark", "Light");
	const pod = checkMendelian("pod", "S", "Smooth", "Wrinkly");
	const podColor = checkMendelian("podColor", "G", "Green", "Gold");
	const variegation = (() => {
		const out: { result: string; probability: number }[] = [];
		for (const possibility of possible.variegation) {
			let probability = 1;
			for (const test of results) {
				const tester = getPossiblePeaGenes(test.tester);
				const results = combineResults(
					tester.variegation.flatMap(x => {
						const output: ResultProbability<string>[] = [];
						for (const first of possibility.slice(0, 2) as [string, string]) {
							for (const second of x.slice(0, 2) as [string, string]) {
								for (let i = Math.min(possibility[2] as number, x[2] as number); i <= Math.max(possibility[2] as number, x[2] as number); i++) {
									output.push({ probability: 1, result: i === 0 || (first === "N" && second === "N") ? "?" : i.toString() });
								}
							}
						}
						return combineResults(output);
					})
				);
				probability *= results.find(x => x.result === test.result.variegationCount.toString())?.probability ?? 0;
				if (!probability) break;
			}
			out.push({ result: possibility.join(""), probability });
		}
		return combineResults(out);
	})();
	const variegationColor = checkMendelian("variegationColor", "W", "White", "Gold");
	const flower = checkProperty("flower", "flower", (a, b) =>
		a.flatMap(x =>
			b.map(y => {
				const sorted = [x, y].toSorted().join("");

				return { result: flowerTypeMap[sorted as keyof typeof flowerTypeMap], probability: 1 };
			})
		)
	);
	const flowerColor = checkProperty("flowerColor", "flowerColor", (a, b) =>
		a.flatMap(x =>
			b.map(y => {
				const sorted = [x, y].toSorted().join("");
				return { result: flowerColorMap[sorted as keyof typeof flowerColorMap], probability: 1 };
			})
		)
	);
	const output = new Map<string, ResultProbability<string>[]>(Object.entries(possible).map(x => [x[0], x[1].map(v => ({ result: v.join(""), probability: 1 / x[1].length }))]));
	output.set("size", size);
	output.set("stem", stem);
	output.set("stemColor", stemColor);
	output.set("pod", pod);
	output.set("podColor", podColor);
	output.set("variegation", variegation);
	output.set("variegationColor", variegationColor);
	output.set("flower", flower);
	output.set("flowerColor", flowerColor);
	for (const value of output.values()) value.sort((a, b) => b.probability - a.probability);
	return output;
};
