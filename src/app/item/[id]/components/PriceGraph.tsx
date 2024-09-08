"use client";
import styles from "../item.module.scss";
import { Chart } from "@/util/chartjs";
import dayjs from "dayjs";

export const PriceGraph = ({ data }: { data: [Date, number[], string, string][] }) => {
	return (
		<div className={styles.chartContainer}>
			<Chart
				type="boxplot"
				data={{
					datasets: [
						{ data: data.map(x => x[1]), label: "Price", backgroundColor: data.map(x => x[2]), borderColor: data.map(x => x[3]), outlierBorderColor: "#555555" },
					],
					labels: data.map(x => x[0]).map(x => dayjs(x).format("MMM-DD")),
				}}
				options={{
					scales: {
						y: {
							min: 0,
						},
					},
					elements: {
						boxandwhiskers: {
							itemRadius: 2,
							itemHitRadius: 4,
						},
					},
				}}
			/>
		</div>
	);
};
