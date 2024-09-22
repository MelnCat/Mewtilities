import { groupBy } from "remeda";
import { accents, CatAppearance, catPatterns, densityFromColor, dilutionFromColor, geneFromColor, getGenePhenotype, PartialCatGene, possibleGenes, whiteTypes } from "./cat";

export interface ResultProbability<T extends string> {
	result: T;
	probability: number;
}

export const combineResults = <T extends string>(results: readonly ResultProbability<T>[]) => {
	const total = results.map(x => x.probability).reduce((l, c) => l + c, 0);
	return (Object.values(groupBy(results, x => x.result)) as ResultProbability<T>[][]).map(x =>
		x.length === 1 ? { result: x[0].result, probability: x[0].probability / total } : { result: x[0].result, probability: x.reduce((l, c) => l + c.probability, 0) / total }
	);
};
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
export const composite = <T extends string>(...resultLists: readonly ResultProbability<T>[][]) =>
	resultLists.reduce((l, c) => l.flatMap(x => c.map(y => ({ result: `${x.result}${y.result}`, probability: x.probability * y.probability }))), [{ result: "", probability: 1 }]);

export const matchProbabilities = <T extends string, K>(outputs: readonly T[], probabilities: Map<K, readonly ResultProbability<T>[]>[]) => {
	const firstKeys = [...probabilities[0].keys()];
	const total = firstKeys.map(x => probabilities.reduce((l, c, i) => l * (c.get(x)?.find(y => y.result === outputs[i])?.probability ?? 0), 1)).reduce((l, c) => l + c, 0);
	const results: Map<K, number> = new Map();
	for (const [i, output] of outputs.entries()) {
		for (const [k, v] of probabilities[i].entries()) {
			const probability = v.find(x => x.result === output)?.probability ?? 0;
			if (i === 0) results.set(k, probability);
			else if (results.has(k)) results.set(k, results.get(k)! * probability);
		}
		for (const k of [...results.keys()].filter(x => !probabilities[i].has(x))) results.delete(k);
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
	const nonAlbino = results.filter(x => x.result.whiteNumber !== 10 && x.result.mainColor && x.result.mainColor !== "snow");
	const matchGene = <T extends string>(
		key: keyof ReturnType<typeof possibleGenes>,
		appearanceMapper: (appearance: CatAppearance) => T,
		resultMapper: (gene: string) => T,
		source = nonAlbino
	) => {
		const value = possible[key];
		if (!(value instanceof Array)) return null;
		if (source.length === 0) return new Map(value.map(x => [x, 1 / value.length]));
		return matchProbabilities(
			source.map(x => appearanceMapper(x.result)),
			source.map(
				x =>
					new Map(
						value.map(y => [
							y,
							combineResults(
								calculateMendelian(
									y as string[],
									x.tester[key] as readonly string[],
									determinePushy(key === "wind" ? (y as readonly ["O", "O"]) : initialGuess.wind, x.tester.wind)
								).map(z => ({
									result: resultMapper(z.result),
									probability: z.probability,
								}))
							),
						])
					) as Map<unknown, readonly ResultProbability<T>[]>
			)
		);
	};
	const matchedWind = initialGuess.wind.includes("?")
		? matchGene(
				"wind",
				x => (x.tradeColor ? "Trade" : x.mainColor === "snow" ? "Null" : "NorthSouth"),
				z => (z === "NS" || z === "SN" ? "Trade" : z === "OO" ? "Null" : "NorthSouth")
		  )
		: null;
	const matchedFur = initialGuess.fur.includes("?")
		? matchGene(
				"fur",
				x => (x.pose.includes("shorthair") ? "Shorthair" : "Longhair"),
				x => (x === "LL" ? "Longhair" : "Shorthair"),
				results
		  )
		: null;
	const getColor = (appearance: CatAppearance) => {
		if (appearance.tradeColor) {
			if (appearance.tradeColor === "snow") return geneFromColor(appearance.mainColor!).repeat(2);
			return `${geneFromColor(appearance.mainColor!)}${geneFromColor(appearance.tradeColor)}`;
		}
		return geneFromColor(appearance.mainColor!);
	};
	const matchedColor = initialGuess.color.includes("?")
		? nonAlbino.length === 0
			? new Map(combineResults(possible.color.map(x => ({ result: x.join(""), probability: 1 }))).map(x => [x.result.split(""), x.probability]))
			: matchProbabilities(
					nonAlbino.map(x => getColor(x.result)),
					nonAlbino.map(
						x =>
							new Map(
								possible.color.map(y => [
									y,
									combineResults(
										(matchedWind ? [...matchedWind.entries()] : [[initialGuess.wind, 1]])
											.map(([k, v]) =>
												calculateMendelian(k as ["O", "O"], x.tester.wind, determinePushy(k as ["O", "O"], x.tester.wind)).map(x => ({
													...x,
													probability: x.probability * (v as number),
												}))
											)
											.flatMap(q =>
												q.flatMap(z =>
													calculateMendelian(y, x.tester.color, determinePushy(z.result.split("") as ["O", "O"], x.tester.wind))
														.map(p => {
															const wind = getWind(z.result.split("") as ["O", "O"]);
															return {
																result: wind === "North" ? p.result[0] : wind === "South" ? p.result[1] : wind === "Trade" ? p.result : "what",
																probability: p.probability * z.probability,
															};
														})
														.concat(
															calculateMendelian(x.tester.color, y, determinePushy(z.result.split("") as ["O", "O"], x.tester.wind)).map(p => {
																const wind = getWind(z.result.split("") as ["O", "O"]);
																return {
																	result: wind === "North" ? p.result[0] : wind === "South" ? p.result[1] : wind === "Trade" ? p.result : "what",
																	probability: p.probability * z.probability,
																};
															})
														)
												)
											)
									),
								])
							)
					)
			  )
		: null;
	const matchedDilution = initialGuess.dilution.includes("?")
		? matchGene(
				"dilution",
				x => dilutionFromColor(x.mainColor!),
				x => (x === "DD" ? "D" : "F")
		  )
		: null;
	const matchedDensity =
		initialGuess.density === "?"
			? nonAlbino.length === 0
				? new Map(combineResults(possible.density.map(x => ({ result: x.toString(), probability: 1 }))).map(x => [+x.result, x.probability]))
				: matchProbabilities(
						nonAlbino.map(x => densityFromColor(x.result.mainColor!).toString()),
						nonAlbino.map(
							x =>
								new Map(
									possible.density.map(y => {
										const testDensity = x.tester.density as number;
										return [
											y,
											combineResults(
												[...Array(Math.abs(y - testDensity) + 1)]
													.map((_, i) => i + Math.min(y, testDensity))
													.map(t => ({ result: t.toString(), probability: 1 }))
											),
										];
									})
								)
						)
				  )
			: null;
	const matchedPattern = initialGuess.pattern.includes("?")
		? matchGene(
				"pattern",
				x => (x.pattern === "solid" ? "N" : "Y"),
				x => (x.includes("Y") ? "Y" : "N")
		  )
		: null;
	const matchedSpotting = initialGuess.spotting.includes("?")
		? matchGene(
				"spotting",
				x => x.pattern!,
				x => catPatterns[x[0] as keyof typeof catPatterns][x[1] as keyof typeof catPatterns],
				nonAlbino.filter(x => x.result.pattern && x.result.pattern !== "solid")
		  )
		: null;
	const matchedWhite = initialGuess.white.includes("?")
		? results.length === 0
			? new Map(combineResults(possible.white.map(x => ({ result: JSON.stringify(x), probability: 1 }))).map(x => [JSON.parse(x.result), x.probability]))
			: matchProbabilities(
					results.map(x => (x.result.whiteNumber ?? 0).toString()),
					results.map(
						x =>
							new Map(
								possible.white.map(y => {
									return [
										y,
										combineResults(
											calculateMendelian(y[0], x.tester.white, determinePushy(initialGuess.wind, x.tester.wind)).flatMap(p =>
												combineResults(
													[...Array(Math.abs(+x.tester.whiteNumber - y[1]) + 1)]
														.map((_, i) => i + Math.min(+x.tester.whiteNumber, y[1]))
														.map(n => ({ probability: p.probability * 1, result: p.result.includes("Y") ? n.toString() : "0" }))
												)
											)
										),
									];
								})
							)
					)
			  )
		: null;
	const matchedWhiteType =
		initialGuess.whiteType === "?"
			? results.filter(x => x.result.whiteNumber !== null).length === 0
				? new Map(combineResults(possible.whiteType.map(x => ({ result: x, probability: 1 }))).map(x => [x.result, x.probability]))
				: matchProbabilities(
						results.filter(x => x.result.whiteNumber !== null).map(x => x.result.whiteType!),
						results
							.filter(x => x.result.whiteNumber !== null)
							.map(
								x =>
									new Map(
										possible.whiteType.map(y => [
											y,
											combineResults([
												{ probability: 0.5, result: whiteTypes[y] },
												{ probability: 0.5, result: x.tester.whiteType === "?" ? "?" : whiteTypes[x.tester.whiteType!] },
											]),
										])
									)
							)
				  )
			: null;
	const matchedAccent = initialGuess.accent.includes("?")
		? matchGene(
				"accent",
				x => x.accent,
				x => accents[x[0] as keyof typeof accents][x[1] as keyof typeof accents],
				results.filter(x => x.result.accent)
		  )
		: null;
	return {
		wind: matchedWind,
		fur: matchedFur,
		color: matchedColor,
		dilution: matchedDilution,
		density: matchedDensity,
		pattern: matchedPattern,
		spotting: matchedSpotting,
		white: matchedWhite,
		whiteType: matchedWhiteType,
		accent: matchedAccent,
	};
};
