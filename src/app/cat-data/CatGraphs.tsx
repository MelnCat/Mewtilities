"use client";
import { Cat } from "@prisma/client";
import "chart.js/auto";
import "chartjs-adapter-luxon";
import { Line, Bar, Pie } from "react-chartjs-2";
import { groupBy } from "remeda";
import styles from "./page.module.scss";
import { useState } from "react";
import { calculateMendelianAlleles, calculateWindAlleles } from "./util";
import { smallNumberFormat } from "@/util/util";
import { catSpeciesNames, densityFromColor, deserializeCatGene, dilutionFromColor, geneFromAccentColor, geneFromColor, geneFromPattern, parseCatBio } from "@/util/cat";
import { accentNames, colorNames, patternNames } from "@/util/catData";

const OccurrenceGraph = ({
	data,
	name,
	percentage,
	type,
	horizontal,
	order,
}: {
	data: (string | number | null)[];
	name: string;
	percentage: boolean;
	type?: "bar" | "line";
	horizontal?: boolean;
	order?: (string | number)[] | "count";
}) => {
	data ??= [];
	const grouped = Object.entries(
		groupBy(
			data.filter(x => x !== null),
			x => x
		)
	).sort((a, b) => (order === "count" ? b[1].length - a[1].length : order ? order.indexOf(a[0]) - order.indexOf(b[0]) : a[0].localeCompare(b[0])));
	const Graph = type ? { bar: Bar, line: Line }[type] : !grouped.every(x => !isNaN(+x[0])) ? Bar : Line;
	const values = data.length
		? (() => {
				if (grouped.every(x => !isNaN(+x[0]))) {
					const min = Math.min(...grouped.map(x => +x[0]));
					const max = Math.max(...grouped.map(x => +x[0]));
					if (max - min + 1 < 1) return [];
					return [...Array(max - min + 1)].map((x, i) => i + min).map(x => [x, grouped.find(y => +y[0] === x)?.[1]?.length ?? 0]);
				} else {
					return grouped.map(x => [x[0], x[1].length]);
				}
		  })()
		: [];
	return (
		<div className={styles.chartContainer}>
			<Graph
				data={{
					datasets: [{ data: values.map(x => x[1]).map(x => (percentage ? +x / values.reduce((l, c) => l + +c[1], 0) : x)), label: "Count", fill: true }],
					labels: values.map(x => x[0]),
				}}
				options={{
					indexAxis: horizontal ? "y" : "x",
					scales: {
						[horizontal ? "x" : "y"]: {
							min: 0,
							ticks: {
								format: {
									style: percentage ? "percent" : "decimal",
									maximumFractionDigits: 10,
								},
							},
						},
					},
					plugins: {
						title: {
							display: true,
							text: name,
						},
						legend: {
							labels: {
								font: {
									size: 1,
								},
							},
						},
					},
					maintainAspectRatio: false,
				}}
			/>
		</div>
	);
};

export const CatGraphs = ({ data }: { data: Cat[] }) => {
	(globalThis as any).cats = data;
	const [origin, setOrigin] = useState("Any");
	const origins = ["Any", ...new Set(data.map(x => x.origin))];
	const [age, setAge] = useState("Any");
	const [percentage, setPercentage] = useState(true);
	const [geneRevealed, setGeneRevealed] = useState("Any");
	const ages = ["Any", ...new Set(data.map(x => x.ageType))];
	const filteredData = data
		.filter(x => origin === "Any" || x.origin === origin)
		.filter(x => age === "Any" || x.ageType === age)
		.filter(x => geneRevealed === "Any" || geneRevealed === (x.genetic ? "Yes" : "No"));
	const windData = groupBy(
		filteredData.map(x => x.wind),
		x => x
	);
	const totalWindData = Object.values(windData).reduce((l, c) => l + c.length, 0);
	const windAlleles = calculateWindAlleles({
		north: windData.North.length / totalWindData,
		south: windData.South.length / totalWindData,
		trade: windData.Trade.length / totalWindData,
	});
	const furData = groupBy(
		filteredData.map(x => x.fur),
		x => x
	);
	const totalFurData = Object.values(furData).reduce((l, c) => l + c.length, 0);
	const furAlleles = calculateMendelianAlleles({
		dominant: furData.Shorthair.length / totalFurData,
		recessive: furData.Longhair.length / totalFurData,
	});
	const parsed = filteredData.map(x =>
		parseCatBio({ species: x.species, color: x.color, eyes: "neutral", pattern: x.pattern, white: x.whiteMarks, accent: x.accentColor ?? "" })
	);
	const dilutionData = Object.fromEntries(
		Object.entries(
			groupBy(
				parsed.map(x => dilutionFromColor(x[0].color)),
				x => x
			)
		).filter(x => x[0] !== "?")
	);
	const totalDilutionData = Object.values(dilutionData).reduce((l, c) => l + c.length, 0);
	const dilutionAlleles = calculateMendelianAlleles({
		dominant: dilutionData.F.length / totalDilutionData,
		recessive: dilutionData.D.length / totalDilutionData,
	});
	const densityData = Object.fromEntries(
		Object.entries(
			groupBy(
				parsed.map(x => densityFromColor(x[0].color)),
				x => x
			)
		).filter(x => x[0] !== "?")
	);
	const totalDensityData = Object.values(dilutionData).reduce((l, c) => l + c.length, 0);
	const patternData = Object.fromEntries(
		Object.entries(
			groupBy(
				parsed
					.map(x => x[0].pattern)
					.filter(x => x !== "-")
					.map(x => (x === "solid" ? "N" : "Y")),
				x => x
			)
		)
	);
	const totalPatternData = Object.values(patternData).reduce((l, c) => l + c.length, 0);
	const patternAlleles = calculateMendelianAlleles({
		dominant: patternData.Y.length / totalPatternData,
		recessive: patternData.N.length / totalPatternData,
	});
	const patternTypeData = groupBy(
		parsed.flatMap(x => geneFromPattern(x[0].pattern)),
		x => x
	);
	const totalPatternTypeData = Object.values(patternTypeData).reduce((l, c) => l + c.length, 0);
	const adjustedWhiteNumberData = groupBy(
		(filteredData.map(x => x.whiteMarks.match(/ [a-zA-Z](\d+)/)?.[1] ?? null) as (string | number | null)[])
			.flatMap(x => (x !== null && +x === 10 ? [0, 10] : x))
			.filter(x => x !== null),
		x => x
	);
	const totalWhiteNumberData = Object.values(adjustedWhiteNumberData).reduce((l, c) => l + c.length, 0);
	const whiteData = groupBy(
		filteredData.map(x => x.whiteMarks !== "None"),
		x => String(x)
	);
	const totalWhiteData = Object.values(whiteData).reduce((l, c) => l + c.length, 0);
	const whiteAlleles = calculateMendelianAlleles({
		dominant: 1 - (whiteData.false.length - adjustedWhiteNumberData[0].length) / (totalWhiteData - adjustedWhiteNumberData[0].length),
		recessive: (whiteData.false.length - adjustedWhiteNumberData[0].length) / (totalWhiteData - adjustedWhiteNumberData[0].length),
	});
	const whiteTypeData = groupBy(
		filteredData.map(x => x.whiteMarks.match(/ ([a-zA-Z])\d+/)?.[1] ?? null).filter(x => x !== null),
		x => x
	);
	const totalWhiteTypeData = Object.values(whiteTypeData).reduce((l, c) => l + c.length, 0);
	const growthData = groupBy(
		filteredData.filter(x => x.genetic !== null).flatMap(x => deserializeCatGene(x.genetic!).data?.growth),
		x => x
	);
	const totalGrowthData = Object.values(growthData).reduce((l, c) => l + c.length, 0);
	const accentData = groupBy(
		filteredData.filter(x => x.accentColor !== null).flatMap(x => geneFromAccentColor(x.accentColor!)),
		x => x
	);
	const totalAccentData = Object.values(accentData).reduce((l, c) => l + c.length, 0);
	return (
		<>
			<section>
				<div>
					Origin
					<select value={origin} onChange={e => setOrigin(e.target.value)}>
						{origins.map(x => (
							<option key={x} value={x}>
								{x}
							</option>
						))}
					</select>
				</div>
				<div>
					Age
					<select value={age} onChange={e => setAge(e.target.value)}>
						{ages.map(x => (
							<option key={x} value={x}>
								{x}
							</option>
						))}
					</select>
				</div>
				<div>
					Percentages <input type="checkbox" checked={percentage} onChange={e => setPercentage(!percentage)} />
				</div>
				<div>
					Gene Revealed
					<select value={geneRevealed} onChange={e => setGeneRevealed(e.target.value)}>
						{["Any", "Yes", "No"].map(x => (
							<option key={x} value={x}>
								{x}
							</option>
						))}
					</select>
				</div>
			</section>
			<section className={styles.allelesRow}>
				<div>
					<h2>Wind Alleles</h2>
					<p>N: {smallNumberFormat.format(windAlleles.N * 100)}%</p>
					<p>S: {smallNumberFormat.format(windAlleles.S * 100)}%</p>
					<p>O: {smallNumberFormat.format(windAlleles.O * 100)}%</p>
				</div>
				<div>
					<h2>Fur Alleles</h2>
					<p>S: {smallNumberFormat.format(furAlleles.dominant * 100)}%</p>
					<p>L: {smallNumberFormat.format(furAlleles.recessive * 100)}%</p>
				</div>
				<div>
					<h2>Dilution Alleles</h2>
					<p>F: {smallNumberFormat.format(dilutionAlleles.dominant * 100)}%</p>
					<p>D: {smallNumberFormat.format(dilutionAlleles.recessive * 100)}%</p>
				</div>
				<div>
					<h2>Density Alleles</h2>
					{Object.entries(densityData).map(x => (
						<p key={x[0]}>
							{x[0]}: {smallNumberFormat.format((x[1].length / totalDensityData) * 100)}%
						</p>
					))}
				</div>
				<div>
					<h2>Pattern Alleles</h2>
					<p>Y: {smallNumberFormat.format(patternAlleles.dominant * 100)}%</p>
					<p>N: {smallNumberFormat.format(patternAlleles.recessive * 100)}%</p>
				</div>
				<div>
					<h2>Pattern Type Alleles</h2>
					{Object.entries(patternTypeData).map(x => (
						<p key={x[0]}>
							{x[0]}: {smallNumberFormat.format((x[1].length / totalPatternTypeData) * 100)}%
						</p>
					))}
				</div>
				<div>
					<h2>White Alleles</h2>
					<p>Y: {smallNumberFormat.format(whiteAlleles.dominant * 100)}%</p>
					<p>N: {smallNumberFormat.format(whiteAlleles.recessive * 100)}%</p>
				</div>
				<div>
					<h2>White Number Alleles</h2>
					{Object.entries(adjustedWhiteNumberData).map(x => (
						<p key={x[0]}>
							{x[0]}: {smallNumberFormat.format((x[1].length / totalWhiteNumberData) * 100)}%
						</p>
					))}
				</div>
				<div>
					<h2>White Type Alleles</h2>
					{Object.entries(whiteTypeData).map(x => (
						<p key={x[0]}>
							{x[0]}: {smallNumberFormat.format((x[1].length / totalWhiteTypeData) * 100)}%
						</p>
					))}
				</div>
				<div>
					<h2>Growth Alleles</h2>
					{Object.entries(growthData).map(x => (
						<p key={x[0]}>
							{x[0]}: {smallNumberFormat.format((x[1].length / totalGrowthData) * 100)}%
						</p>
					))}
				</div>
				<div>
					<h2>Accent Alleles</h2>
					{Object.entries(accentData).map(x => (
						<p key={x[0]}>
							{x[0]}: {smallNumberFormat.format((x[1].length / totalAccentData) * 100)}%
						</p>
					))}
				</div>
			</section>
			<h1>Demographics</h1>
			<section className={styles.graphRow}>
				<OccurrenceGraph horizontal percentage={percentage} data={filteredData.map(x => x.species)} order="count" name="Species" />
			</section>
			<h1>Data</h1>
			<section className={styles.graphRow}>
				<OccurrenceGraph percentage={percentage} data={filteredData.map(x => x.strength)} name="Strength" />
				<OccurrenceGraph percentage={percentage} data={filteredData.map(x => x.agility)} name="Agility" />
				<OccurrenceGraph percentage={percentage} data={filteredData.map(x => x.health)} name="Health" />
				<OccurrenceGraph percentage={percentage} data={filteredData.map(x => x.finesse)} name="Finesse" />
				<OccurrenceGraph percentage={percentage} data={filteredData.map(x => x.perception)} name="Perception" />
				<OccurrenceGraph percentage={percentage} data={filteredData.map(x => x.cleverness)} name="Cleverness" />
				<OccurrenceGraph percentage={percentage} data={filteredData.map(x => x.luck)} name="Luck" />
				<OccurrenceGraph
					percentage={percentage}
					data={filteredData.map(x => x.strength! + x.agility! + x.health! + x.finesse! + x.perception! + x.cleverness! + x.luck!).filter(x => !isNaN(x) && x !== 0)}
					name="Stat Total"
				/>
				<OccurrenceGraph percentage={percentage} data={filteredData.map(x => x.bravery)} name="Bravery" />
				<OccurrenceGraph percentage={percentage} data={filteredData.map(x => x.benevolence)} name="Benevolence" />
				<OccurrenceGraph percentage={percentage} data={filteredData.map(x => x.energy)} name="Energy" />
				<OccurrenceGraph percentage={percentage} data={filteredData.map(x => x.extroversion)} name="Extroversion" />
				<OccurrenceGraph percentage={percentage} data={filteredData.map(x => x.dedication)} name="Dedication" />
				<OccurrenceGraph percentage={percentage} data={filteredData.map(x => x.whiteMarks.match(/ ([a-zA-Z])\d+/)?.[1] ?? null)} name="White Type" />
				<OccurrenceGraph horizontal percentage={percentage} type="bar" data={filteredData.map(x => x.whiteMarks.match(/ [a-zA-Z](\d+)/)?.[1] ?? 0)} name="White Number" />
				<OccurrenceGraph
					horizontal
					type="bar"
					percentage={percentage}
					data={(filteredData.map(x => x.whiteMarks.match(/ [a-zA-Z](\d+)/)?.[1] ?? null) as (string | number | null)[]).flatMap(x =>
						x !== null && +x === 10 ? [0, 10] : x
					)}
					name="Adjusted White Number"
				/>
				<OccurrenceGraph percentage={percentage} data={filteredData.map(x => x.wind)} order={["North", "South", "Wind", "Trade"]} name="Wind" />
				<OccurrenceGraph
					horizontal
					percentage={percentage}
					data={parsed.map(x => x[0].color).map(x => colorNames[x as "charc"] ?? "?")}
					order={Object.values(colorNames).concat("?")}
					name="Main Color"
				/>
				<OccurrenceGraph percentage={percentage} data={parsed.map(x => geneFromColor(x[0].color) ?? "?")} name="Main Color Shade" />
				<OccurrenceGraph percentage={percentage} data={parsed.map(x => dilutionFromColor(x[0].color) ?? "?")} name="Main Color Dilution" />
				<OccurrenceGraph percentage={percentage} data={parsed.map(x => densityFromColor(x[0].color) ?? "?")} name="Main Color Density" />
				<OccurrenceGraph
					horizontal
					percentage={percentage}
					data={parsed.map(x => x[0].pattern).map(x => patternNames[x as "colorpoint"] ?? "?")}
					order={Object.values(patternNames).concat("?")}
					name="Pattern"
				/>
				<OccurrenceGraph
					horizontal
					percentage={percentage}
					data={filteredData.map(x => x.accentColor)}
					order={Object.values(accentNames).concat("-hidden-")}
					name="Accent Color"
				/>
			</section>
		</>
	);
};
