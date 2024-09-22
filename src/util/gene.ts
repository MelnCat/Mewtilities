import { groupBy } from "remeda";
import { CatAppearance, deserializeCatGene, PartialCatGene, possibleGenes } from "./cat";

export interface ResultProbability<T = string> {
	result: T;
	probability: number;
}

export const combineResults = (results: readonly ResultProbability[]) =>
	Object.values(groupBy(results, x => x.result)).map(x => (x.length === 1 ? x[0] : { result: x[0].result, probability: x.reduce((l, c) => l + c.probability, 0) }));

export const calculateMendelian = (first: readonly string[], second: readonly string[], pushyNorth: 0 | 1 | null) => {
	const values = first.flatMap(x => second.map(y => `${x}${y}`));
	const results = combineResults(values.map(x => ({ result: x, probability: 1 / values.length })));
	// Assumes 1% pushy north
	return pushyNorth === null
		? results
		: combineResults(
				results
					.map(x => ({ ...x, probability: (x.probability - 0.01) / results.length }))
					.concat({ result: pushyNorth === 0 ? first[0].repeat(2) : second[0].repeat(2), probability: 0.01 / 2 })
					.concat({ result: pushyNorth === 0 ? first[1].repeat(2) : second[1].repeat(2), probability: 0.01 / 2 })
		  );
};
export const composite = (...resultLists: readonly ResultProbability[][]) =>
	resultLists.reduce((l, c) => l.flatMap(x => c.map(y => ({ result: `${x.result}${y.result}`, probability: x.probability * y.probability }))), [{ result: "", probability: 1 }]);

export const matchProbabilities = <T, K>(outputs: readonly T[], probabilities: Map<K, readonly ResultProbability<T>[]>[]) => {
	const firstKeys = probabilities[0].keys();
	const total = firstKeys.map(x => probabilities.reduce((l, c, i) => l * (c.get(x)?.find(y => y.result === outputs[i])?.probability ?? 0), 1)).reduce((l, c) => l + c, 0);
	const results: Map<K, number> = new Map();
	for (const [i, output] of outputs.entries()) {
		for (const [k, v] of probabilities[i].entries()) {
			const probability = v.find(x => x.result === output)?.probability ?? 0;
			if (i === 0) results.set(k, probability);
			else if (results.has(k)) results.set(k, results.get(k)! * probability);
		}
		for (const k of results.keys().filter(x => !probabilities[i].has(x))) results.delete(k);
	}
	return new Map([...results.entries()].filter(x => x[1] !== 0).map(x => [x[0], (x[1] as number) / total]));
};

export type GeneType = "SPECIES" | "WIND" | "FUR" | "COLOR" | "DILUTION" | "DENSITY" | "PATTERN" | "SPOTTING" | "WHITE" | "WHITE_NUMBER" | "WHITE_TYPE" | "GROWTH" | "ACCENT";

export const geneToPhenotype = (gene: string, geneType: GeneType) => {
	switch (geneType) {
		case "SPECIES":
			return { C: "Not-Cat", M: "Mercat" }[gene];
		case "WIND":
			return { NN: "North", NO: "North", SS: "South", SO: "South", NS: "Trade", SN: "Trade", OO: "Null" }[gene];
		case "FUR":
			return { SS: "Shorthair", SL: "Shorthair", LS: "Shorthair", LL: "Shorthair" };
		case "COLOR":
			return "Error";
	}
};

export const getPossibleDescendants = () => {
	// input + input -> output
	// maybe by gene?? and input already existing stuff or something like that? needs: WIND + spceies ?
};

const getWind = (windGenes: PartialCatGene["wind"]) => {
	if (windGenes.includes("?")) {
		const known = windGenes.find(x => x !== "?");
		return known === "S" ? "South" : "North";
	}
	if (windGenes.includes("N") && windGenes.includes("S")) return "Trade";
	if (windGenes.every(x => x === "O")) return "Null";
	if (windGenes.includes("N")) return "North";
	else return "South";
};

const determinePushy = (first: PartialCatGene["wind"], second: PartialCatGene["wind"]) => {
	const firstWind = getWind(first);
	const secondWind = getWind(second);
	if (firstWind === "North" && secondWind === "South") return 0;
	if (firstWind === "South" && secondWind === "North") return 1;
	return null;
};

export const calculateUnknownGenes = (initialGuess: PartialCatGene, results: { result: CatAppearance; tester: PartialCatGene }[]) => {
	const possible = possibleGenes(initialGuess);
	const nonAlbino = results.filter(x => x.result.whiteNumber !== 10);
	const matchedWind = initialGuess.wind.includes("?")
		? matchProbabilities(
				nonAlbino.map(x => (x.result.tradeColor ? "Trade" : x.result.mainColor === "snow" ? "Null" : "NorthSouth")),
				nonAlbino.map(
					x =>
						new Map(
							possible.wind.map(y => [
								y,
								combineResults(
									calculateMendelian(y, x.tester.wind, determinePushy(y, x.tester.wind)).map(z => ({
										result: z.result === "NS" || z.result === "SN" ? "Trade" : z.result === "OO" ? "Null" : "NorthSouth",
										probability: z.probability,
									}))
								),
							])
						)
				)
		  )
		: initialGuess.wind;

	
	return matchedWind;
};

console.log(calculateUnknownGenes(deserializeCatGene("[C] {S?} {S?} [{BO}{F?}4] {Y?TP} [{Y?}2C] [??] [??]").data!, [{ result: { mainColor: "a" }, tester: { wind: ["N", "N"] } }]));
