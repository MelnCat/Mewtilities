"use client";
import { Cat } from "@prisma/client";
import "chart.js/auto";
import "chartjs-adapter-luxon";
import { Line } from "react-chartjs-2";
import { groupBy } from "remeda";
import styles from "./page.module.scss";
import { useState } from "react";

const OccurrenceGraph = ({ data, name }: { data: (number | null)[]; name: string }) => {
	const grouped = Object.entries(
		groupBy(
			data.filter(x => x !== null),
			x => x
		)
	);
	const min = Math.min(...grouped.map(x => +x[0]));
	const max = Math.max(...grouped.map(x => +x[0]));
	const values = data.length ? [...Array(max - min + 1)].map((x, i) => i + min).map(x => [x, grouped.find(y => +y[0] === x)?.[1]?.length ?? 0]) : [];
	console.log(values);
	return (
		<div className={styles.chartContainer}>
			<Line
				data={{
					datasets: [{ data: values.map(x => x[1]), label: "Count", fill: true }],
					labels: values.map(x => x[0]),
				}}
				options={{
					scales: {
						y: {
							min: 0,
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
	const [origin, setOrigin] = useState("Any");
	const origins = ["Any", ...new Set(data.map(x => x.origin))];
	const [age, setAge] = useState("Any");
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
				</div>
			</section>
			<section className={styles.graphRow}>
				<OccurrenceGraph data={filteredData.map(x => x.strength)} name="Strength" />
				<OccurrenceGraph data={filteredData.map(x => x.agility)} name="Agility" />
				<OccurrenceGraph data={filteredData.map(x => x.health)} name="Health" />
				<OccurrenceGraph data={filteredData.map(x => x.finesse)} name="Finesse" />
				<OccurrenceGraph data={filteredData.map(x => x.perception)} name="Perception" />
				<OccurrenceGraph data={filteredData.map(x => x.cleverness)} name="Cleverness" />
				<OccurrenceGraph data={filteredData.map(x => x.luck)} name="Luck" />
			</section>
		</>
	);
};
