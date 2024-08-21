"use client";
import styles from "../item.module.scss";
import "chart.js/auto";
import "chartjs-adapter-luxon";
import { Line } from "react-chartjs-2";

export const PriceGraph = ({ data }: { data: [Date, number][][] }) => (
	<div className={styles.chartContainer}>
		<Line
			data={{
				datasets: [{ data: data[0].map(x => x[1]), label: "Lowest Price" }, { data: data[1].map(x => x[1]), label: "Listing Price" }],
				labels: data.map(x => x[0]),
			}}
			options={{
				scales: {
					y: {
						min: 0,
					},
					x: {
						type: "time",
						time: {
							tooltipFormat: "DD T",
						},
						title: {
							display: true,
							text: "Date",
						},
					},
				},
			}}
		/>
	</div>
);
