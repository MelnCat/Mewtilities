import { groupBy } from "remeda";

export interface ResultProbability<T = string> {
	result: T;
	probability: number;
}

export const combineResults = (results: ResultProbability[]) =>
	Object.values(groupBy(results, x => x.result)).map(x => (x.length === 1 ? x[0] : { result: x[0].result, probability: x.reduce((l, c) => l + c.probability, 0) }));

export const calculateMendelian = (first: string[], second: string[], pushyNorth: 0 | 1 | null) => {
	const values = first.flatMap(x => second.map(y => `${x}${y}`));
	const results = combineResults(values.map(x => ({ result: x, probability: 1 / values.length })));
	// Assumes 1% pushy north
	return pushyNorth === null
		? results
		: combineResults(
				results
					.map(x => ({ ...x, probability: x.probability - 0.01 / results.length }))
					.concat({ result: pushyNorth === 0 ? first[0].repeat(2) : second[0].repeat(2), probability: 0.01 / 2 })
					.concat({ result: pushyNorth === 0 ? first[1].repeat(2) : second[1].repeat(2), probability: 0.01 / 2 })
		  );
};
export const composite = (...resultLists: ResultProbability[][]) =>
	resultLists.reduce((l, c) => l.flatMap(x => c.map(y => ({ result: `${x.result}${y.result}`, probability: x.probability * y.probability }))), [{ result: "", probability: 1 }]);

export const matchProbabilities = <T, K extends string>(outputs: T[], probabilities: Record<K, ResultProbability<T>[]>[]) => {
	const firstKeys = Object.keys(probabilities[0]);
	const total = firstKeys.map(x => probabilities.reduce((l, c, i) => l * (c[x as K]?.find(y => y.result === outputs[i])?.probability ?? 0), 1)).reduce((l, c) => l + c, 0);
	const results: Partial<Record<K, number>> = {};
	for (const [i, output] of outputs.entries()) {
		for (const [k, v] of Object.entries(probabilities[i]) as [K, ResultProbability<T>[]][]) {
			const probability = v.find(x => x.result === output)?.probability ?? 0;
			if (i === 0) results[k] = probability;
			else if (k in results) results[k]! *= probability;
		}
		for (const k of Object.keys(results).filter(x => !(x in probabilities[i]))) delete results[k as K];
	}
	return Object.fromEntries(
		Object.entries(results)
			.filter(x => x[1] !== 0)
			.map(x => [x[0], (x[1] as number) / total])
	);
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
}