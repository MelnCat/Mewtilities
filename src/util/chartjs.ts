import "chart.js/auto";
import "chartjs-adapter-luxon";
import { Chart, LinearScale, CategoryScale } from "chart.js";
import { BoxPlotController, BoxAndWiskers } from "@sgratzl/chartjs-chart-boxplot";

Chart.register(BoxPlotController, BoxAndWiskers, LinearScale, CategoryScale);

export * from "react-chartjs-2";