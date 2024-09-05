"use client";
import { useMemo, useState } from "react";
import styles from "./page.module.scss";
import { deserializeCatGene, getGenePhenotype, PartialCatGene } from "@/util/cat";
import { numberFormat, smallNumberFormat } from "@/util/util";
import { groupBy, range } from "remeda";
import Fraction from "fraction.js";

interface ResultProbability {
	result: string;
	probability: number;
}

const GeneTestProbability = ({ result, probability, fractions }: { result: string; probability: number; fractions: boolean }) => {
	return (
		<div className={styles.geneTestProbability}>
			<b>{result}</b>: {fractions ? new Fraction(probability).toFraction() : `${numberFormat.format(probability * 100)}%`}
		</div>
	);
};

const combineResults = (results: ResultProbability[]) =>
	Object.values(groupBy(results, x => x.result)).map(x => (x.length === 1 ? x[0] : { result: x[0].result, probability: x.reduce((l, c) => l + c.probability, 0) }));

const calculateMendelian = (first: string[], second: string[], pushyNorth: 0 | 1 | null) => {
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
const composite = (...resultLists: ResultProbability[][]) =>
	resultLists.reduce((l, c) => l.flatMap(x => c.map(y => ({ result: `${x.result}${y.result}`, probability: x.probability * y.probability }))), [{ result: "", probability: 1 }]);
const GeneTestResults = ({
	first,
	second,
	ignoreOrder,
	fractions,
	componentwise,
	pushyNorth,
}: {
	first: PartialCatGene;
	second: PartialCatGene;
	ignoreOrder: boolean;
	fractions: boolean;
	componentwise: boolean;
	pushyNorth: 0 | 1 | null;
}) => {
	const species = first.species === second.species ? [{ result: first.species, probability: 1 }] : [first.species, second.species].map(x => ({ result: x, probability: 0.5 }));
	const mendelian = ignoreOrder
		? (first: string[], second: string[], pushyNorth: 0 | 1 | null) =>
				combineResults(
					calculateMendelian(first, second, pushyNorth).map(x => ({ result: [...x.result].sort((a, b) => a.localeCompare(b)).join(""), probability: x.probability }))
				)
		: calculateMendelian;
	const wind = mendelian(first.wind, second.wind, pushyNorth);
	const furType = mendelian(first.fur, second.fur, pushyNorth);
	const color = mendelian(first.color, second.color, pushyNorth);
	const dilution = mendelian(first.dilution, second.dilution, pushyNorth);
	const densityRange =
		first.density === "?" || second.density === "?"
			? [first.density, second.density]
			: range(Math.min(first.density, second.density), Math.max(first.density, second.density) + 1);
	const density = densityRange.map(x => ({ result: x.toString(), probability: 1 / densityRange.length }));
	const colorSection = composite(color, dilution, density);
	const pattern = mendelian(first.pattern, second.pattern, pushyNorth);
	const spotting = mendelian(first.spotting, second.spotting, pushyNorth);
	const patternSection = composite(pattern, spotting);
	const white = mendelian(first.white, second.white, pushyNorth);
	const whiteType = combineResults([first.whiteType, second.whiteType].map(x => ({ result: x, probability: 0.5 })));
	const whiteRange =
		first.whiteNumber === "?" || second.whiteNumber === "?"
			? [first.whiteNumber, second.whiteNumber]
			: range(Math.min(first.whiteNumber, second.whiteNumber), Math.max(first.whiteNumber, second.whiteNumber) + 1);
	const whiteNumber = whiteRange.map(x => ({ result: x.toString(), probability: 1 / whiteRange.length }));
	const whiteSection = composite(white, whiteNumber, whiteType);
	const growth = mendelian(first.growth, second.growth, pushyNorth);
	const accent = mendelian(first.accent, second.accent, pushyNorth);
	return (
		<section className={styles.results}>
			<div className={styles.categoryResults}>
				<h2>Species</h2>
				{species.map(x => (
					<GeneTestProbability key={x.result} result={x.result} probability={x.probability} fractions={fractions} />
				))}
			</div>
			<div className={styles.categoryResults}>
				<h2>Wind</h2>
				{wind.map(x => (
					<GeneTestProbability key={x.result} result={x.result} probability={x.probability} fractions={fractions} />
				))}
			</div>
			<div className={styles.categoryResults}>
				<h2>Fur Type</h2>
				{furType.map(x => (
					<GeneTestProbability key={x.result} result={x.result} probability={x.probability} fractions={fractions} />
				))}
			</div>
			<div className={styles.categoryResults}>
				<h2>Color</h2>
				{componentwise ? (
					<>
						<h3>Type</h3>
						{color.map(x => (
							<GeneTestProbability key={x.result} result={x.result} probability={x.probability} fractions={fractions} />
						))}
						<h3>Dilution</h3>
						{dilution.map(x => (
							<GeneTestProbability key={x.result} result={x.result} probability={x.probability} fractions={fractions} />
						))}
						<h3>Density</h3>
						{density.map(x => (
							<GeneTestProbability key={x.result} result={x.result} probability={x.probability} fractions={fractions} />
						))}
					</>
				) : (
					colorSection.map(x => <GeneTestProbability key={x.result} result={x.result} probability={x.probability} fractions={fractions} />)
				)}
			</div>
			<div className={styles.categoryResults}>
				<h2>Pattern</h2>
				{componentwise ? (
					<>
						<h3>Present</h3>
						{pattern.map(x => (
							<GeneTestProbability key={x.result} result={x.result} probability={x.probability} fractions={fractions} />
						))}
						<h3>Type</h3>
						{spotting.map(x => (
							<GeneTestProbability key={x.result} result={x.result} probability={x.probability} fractions={fractions} />
						))}
					</>
				) : (
					patternSection.map(x => <GeneTestProbability key={x.result} result={x.result} probability={x.probability} fractions={fractions} />)
				)}
			</div>
			<div className={styles.categoryResults}>
				<h2>White</h2>
				{componentwise ? (
					<>
						<h3>Present</h3>
						{white.map(x => (
							<GeneTestProbability key={x.result} result={x.result} probability={x.probability} fractions={fractions} />
						))}
						<h3>Number</h3>
						{whiteNumber.map(x => (
							<GeneTestProbability key={x.result} result={x.result} probability={x.probability} fractions={fractions} />
						))}
						<h3>Type</h3>
						{whiteType.map(x => (
							<GeneTestProbability key={x.result} result={x.result} probability={x.probability} fractions={fractions} />
						))}
					</>
				) : (
					whiteSection.map(x => <GeneTestProbability key={x.result} result={x.result} probability={x.probability} fractions={fractions} />)
				)}
			</div>
			<div className={styles.categoryResults}>
				<h2>Growth</h2>
				{growth.map(x => (
					<GeneTestProbability key={x.result} result={x.result} probability={x.probability} fractions={fractions} />
				))}
			</div>
			<div className={styles.categoryResults}>
				<h2>Accent</h2>
				{accent.map(x => (
					<GeneTestProbability key={x.result} result={x.result} probability={x.probability} fractions={fractions} />
				))}
			</div>
		</section>
	);
};

export default function GeneTestPage() {
	const [first, setFirst] = useState("");
	const [second, setSecond] = useState("");
	const [ignoreOrder, setIgnoreOrder] = useState(false);
	const [fractions, setFractions] = useState(false);
	const [componentwise, setComponentwise] = useState(false);
	const [ignorePush, setIgnorePush] = useState(false);
	const firstGene = useMemo(() => deserializeCatGene(first)?.data, [first]);
	const secondGene = useMemo(() => deserializeCatGene(second)?.data, [second]);
	const firstPhenotype = useMemo(() => firstGene && getGenePhenotype(firstGene), [firstGene]);
	const secondPhenotype = useMemo(() => secondGene && getGenePhenotype(secondGene), [secondGene]);
	const firstWind = firstPhenotype?.wind;
	const secondWind = secondPhenotype?.wind;
	const compatible =
		firstWind !== "Null" &&
		secondWind !== "Null" &&
		(firstWind === "Trade" || secondWind === "Trade" || (firstWind === "North" && secondWind === "South") || (firstWind === "South" && secondWind === "North"));
	const pushyNorth = firstWind === "North" && secondWind === "South" ? 0 : firstWind === "South" && secondWind === "North" ? 1 : null;
	return (
		<main className={styles.main}>
			<h1>Not-Cat Offspring Calculator</h1>
			<section className={styles.input}>
				<div>
					First Cat <input value={first} onChange={e => setFirst(e.target.value)} placeholder="[C] [NS] [LL] [BBFD2] [YYTT] [NY1P] [CB] [BR]" />
				</div>
				<div>
					Second Cat <input value={second} onChange={e => setSecond(e.target.value)} placeholder="[C] [NS] [LL] [BBFD2] [YYTT] [NY1P] [CB] [BR]" />
				</div>
				<div>
					Ignore Order
					<input type="checkbox" checked={ignoreOrder} onChange={e => setIgnoreOrder(e.target.checked)} />
				</div>
				<div>
					Fractions
					<input type="checkbox" checked={fractions} onChange={e => setFractions(e.target.checked)} />
				</div>
				<div>
					Componentwise
					<input type="checkbox" checked={componentwise} onChange={e => setComponentwise(e.target.checked)} />
				</div>
				<div>
					Ignore Pushing
					<input type="checkbox" checked={ignorePush} onChange={e => setIgnorePush(e.target.checked)} />
				</div>
			</section>
			{compatible && firstGene && secondGene ? (
				<GeneTestResults
					first={firstGene}
					second={secondGene}
					ignoreOrder={ignoreOrder}
					fractions={fractions}
					componentwise={componentwise}
					pushyNorth={ignorePush ? null : pushyNorth}
				/>
			) : null}
			{first && second && !compatible ? <p>Incompatible Cats!</p> : null}
		</main>
	);
}
