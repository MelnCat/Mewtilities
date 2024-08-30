"use client";
import { Cat } from "@prisma/client";
import "chart.js/auto";
import "chartjs-adapter-luxon";
import { Line, Bar } from "react-chartjs-2";
import { groupBy } from "remeda";
import styles from "./page.module.scss";
import { useState } from "react";

const OccurrenceGraph = ({ data, name, percentage }: { data: (string | number | null)[]; name: string; percentage: boolean }) => {
	const grouped = Object.entries(
		groupBy(
			data.filter(x => x !== null),
			x => x
		)
	).sort((a, b) => a[0].localeCompare(b[0]));
	const Graph = !grouped.every(x => !isNaN(+x[0])) ? Bar : Line;
	const values = data.length
		? (() => {
				if (grouped.every(x => !isNaN(+x[0]))) {
					const min = Math.min(...grouped.map(x => +x[0]));
					const max = Math.max(...grouped.map(x => +x[0]));
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
					datasets: [{ data: values.map(x => x[1]).map(x => percentage ? +x / values.reduce((l, c) => l + +c[1], 0) : x), label: "Count", fill: true }],
					labels: values.map(x => x[0]),
				}}
				options={{
					scales: {
						y: {
							min: 0,
							ticks: {
								format: {
									style: percentage ? "percent" : "decimal",
									maximumFractionDigits: 10
								},
							},
						},
					},
					plugins: {
						title: {
							display: true,
							text: name,
						},
					},
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
	const ages = ["Any", ...new Set(data.map(x => x.ageType))];
	const filteredData = data.filter(x => origin === "Any" || x.origin === origin).filter(x => age === "Any" || x.ageType === age);
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
				</div><div>
					Percentages <input type="checkbox" checked={percentage} onChange={e => setPercentage(!percentage)} />
				</div>
			</section>
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
				<OccurrenceGraph percentage={percentage} data={filteredData.map(x => x.whiteMarks.match(/ [a-zA-Z](\d+)/)?.[1] ?? 0)} name="White Number" />
				<OccurrenceGraph percentage={percentage} data={filteredData.map(x => x.wind)} name="Wind" />
			</section>
		</>
	);
};
