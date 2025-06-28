"use client";
import { parseCatPage, RawCat } from "@/parser/catParser";
import styles from "./page.module.scss";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { useEventListener } from "usehooks-ts";
import { CatAppearance, catSpeciesList, deserializeCatGene, geneFromImported, PartialCatGene, serializeCatGene } from "@/util/cat";
import { CatGeneDisplay } from "../components/CatGeneDisplay";
import { calculateUnknownGenes, combineResults } from "@/util/gene";
import { parseBeanSandboxPage } from "@/parser/beanSandboxParser";
import { smallNumberFormat } from "@/util/util";
import SignIn from "../components/SignIn";
import { parsePeaPlantEventPage, RawPeaPlantEntry } from "@/parser/peaPlantEventParser";
import { calculatePeaGenes } from "@/util/peaplant";

const usePaste = (cb: (html: string) => void | Promise<void>) => {
	useEventListener("paste", event => {
		try {
			cb(event.clipboardData!.getData("text/html"));
		} catch {}
	});
	useEventListener("focus", async event => {
		try {
			cb(await (await (await navigator.clipboard.read())[0].getType("text/html")).text());
		} catch {}
	});
};

const Title = ({ onPaste }: { onPaste: (data: RawPeaPlantEntry, text: string) => void }) => {
	const [error, setError] = useState("");
	usePaste(str => {
		if (!str) return;
		const parsedPeaPage = parsePeaPlantEventPage(str);
		if (parsedPeaPage.message !== undefined) setError(parsedPeaPage.message);
		else onPaste(parsedPeaPage.data, str);
	});
	return (
		<>
			<h1 className={styles.title}>[PURR]</h1>
			<p className={styles.lowertitle}>Pea Unknown Reproduction Resolver</p>
			<p>Paste a pea to begin. (Test with A)</p>
			<input value="" onChange={() => {}} />
			<p className={styles.error}>{error}</p>
		</>
	);
};

const certain = <T,>(value: T) => [{ result: value, probability: 1 }];
const sortMap = <T,>(map: Map<T, number>) => [...map.entries()].sort((a, b) => b[1] - a[1]).map(x => ({ result: x[0], probability: x[1] }));

const GeneDashboard = ({ tests, setTests, paste }: { tests: RawPeaPlantEntry[]; setTests: Dispatch<SetStateAction<RawPeaPlantEntry[]>>; paste: string }) => {
	const copy = async () => {
		await navigator.clipboard.writeText("");
	};
	const [seen, setSeen] = useState<string[]>(() => [paste]);
	usePaste(data => {
		if (!data) return;
		if (seen.includes(data)) return;
		const pea = parsePeaPlantEventPage(data);
		if (!pea.ok) return;
		if (!pea.data.parents) return;
		setSeen(seen.concat(data));
		setTests(tests.concat(pea.data));
	});
	const onLetterClick = async (letter: string) => {
		const items = await (await navigator.clipboard.read())[0].getType("text/html");
		const data = await items.text();
		if (seen.includes(data)) return;
		const pea = parsePeaPlantEventPage(data);
		if (!pea.ok) return;
		if (!pea.data.parents) pea.data.parents = ["mystery", letter as "a"];
		setSeen(seen.concat(data));
		setTests(tests.concat(pea.data));
	};
	const probableGeneRaw = useMemo(
		() =>
			calculatePeaGenes(
				tests[0].testee?.phenotype ?? null,
				tests.flatMap(x => x.descendants.map(y => ({ result: y.phenotype, tester: x.testers.find(z => z.letter === x.parents!.find(w => w !== "mystery"))!.phenotype })))
			),
		[tests]
	);
	const probableGene = useMemo(
		() =>
			new Map([
				["size", probableGeneRaw.get("size")!],
				["stem", probableGeneRaw.get("stem")!],
				["stemColor", probableGeneRaw.get("stemColor")!],
				["pod", probableGeneRaw.get("pod")!],
				["podColor", probableGeneRaw.get("podColor")!],
				[
					"variegation",
					combineResults(probableGeneRaw.get("variegation")!.map(x => ({ result: x.result.slice(0, 2), probability: x.probability }))).sort(
						(a, b) => b.probability - a.probability
					),
				],
				["variegationColor", probableGeneRaw.get("variegationColor")!],
				[
					"variegationN",
					combineResults(probableGeneRaw.get("variegation")!.map(x => ({ result: x.result.slice(2), probability: x.probability }))).sort(
						(a, b) => b.probability - a.probability
					),
				],
				["flower", probableGeneRaw.get("flower")!],
				["flowerColor", probableGeneRaw.get("flowerColor")!],
			]),
		[probableGeneRaw]
	);
	const options = [
		["NN", "NM", "MM"],
		["SS", "SC", "CC"],
		["DD", "DL", "LL"],
		["SS", "SW", "WW"],
		["GG", "GY", "YY"],
		["YY", "YN", "NN"],
		["WW", "WY", "YY"],
		["0", "1", "2", "3", "4", "5"],
		["AA", "AB", "AC", "BB", "BC", "CC"],
		["BB", "BO", "PP", "PO", "BP", "OO"],
	];

	return (
		<>
			<section className={styles.certaintyList}>
				{[...probableGene.entries()].map(([k, v]) => (
					<div
						className={styles.geneCertainty}
						key={k}
						style={{
							backgroundColor:
								v[0].probability < 0.6
									? "#f8131344"
									: v[0].probability < 0.9
									? "#ffff0033"
									: v[0].probability < 0.95
									? "#1bc91b55"
									: v[0].probability === 1
									? "#36f1369d"
									: "#0cdd0c88",
						}}
					>
						<div className={styles.geneValue}>{v[0].result}</div>
						<div className={styles.certainty}>{smallNumberFormat.format(100 * v[0].probability)}%</div>
					</div>
				))}
			</section>
			<article>
				<p>Paste a pea trial to gene.</p>
				<input value="" readOnly />
				<div>{
					[...probableGene.values()].map((x,  i) => options[i].findIndex(y => y === x[0].result || x[0].result.split("").reverse().join("") === y) + 1).join(" ")}</div>

				<div>
					{(["a", "b", "c", "d", "e"] as const).map(x => (
						<button style={{ fontSize: "2em", margin: "0 0.1em" }} key={x} onClick={() => onLetterClick(x)}>
							{x.toUpperCase()}
						</button>
					))}
				</div>
			</article>
		</>
	);
};

export default function GeneTestPage() {
	const [tests, setTests] = useState<RawPeaPlantEntry[]>([]);
	const [paste, setPaste] = useState<string>("");
	return (
		<main className={styles.main}>
			{tests.length ? (
				<GeneDashboard tests={tests} setTests={setTests} paste={paste} />
			) : (
				<Title
					onPaste={(x, s) => {
						if (!x.parents) {
							x.parents = ["mystery", "a"];
						}
						setTests([x]);
						setPaste(s);
					}}
				/>
			)}
		</main>
	);
}
