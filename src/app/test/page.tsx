"use client";
import { ClipboardEventHandler, useMemo, useState } from "react";
import styles from "./page.module.scss";
import { parseCatPage, RawCat } from "@/parser/catParser";
import { CatAppearance, geneFromImported, PartialCatGene } from "@/util/cat";
import { CatGeneDisplay } from "../components/CatGeneDisplay";
import { parseBeanSandboxPage, RawBeanSandboxEntry } from "@/parser/beanSandboxParser";
import { calculateUnknownGenes } from "@/util/gene";
import { parsePeaPlantEventPage } from "@/parser/peaPlantEventParser";

export default function GeneTestPage() {
	const [pasted, setPasted] = useState("");
	const onPaste: ClipboardEventHandler<HTMLInputElement> = e => {
		setPasted(e.clipboardData.getData("text/html"));
	};
	const cat = useMemo(() => (pasted ? parseCatPage(pasted) : null), [pasted]);
	const gene = useMemo(() => (cat?.data ? geneFromImported(cat.data) : null), [cat]);
	const appearances = useMemo(() => (pasted ? parseBeanSandboxPage(pasted) : null), [pasted]);
	const pea = useMemo(() => (pasted ? parsePeaPlantEventPage(pasted) : null), [pasted]);
	const [savedAppearances, setSavedAppearances] = useState<RawBeanSandboxEntry[]>([]);
	const [savedCat, setSavedCat] = useState<RawCat | null>(null);
	const [catRegistry, setCatRegistry] = useState<Record<number, PartialCatGene>>({});
	return (
		<main className={styles.main}>
			<h1>Tersting</h1>
			<input placeholder="paste here" onPaste={onPaste} />
			{cat?.data && <button onClick={() => setSavedCat(cat?.data)}>Save Main Cat</button>}
			{cat?.data && <button onClick={() => setCatRegistry({ ...catRegistry, [cat.data.id]: gene! })}>Save Tester Cat</button>}
			{appearances?.data && <button onClick={() => setSavedAppearances(savedAppearances.concat(appearances.data))}>Save Beans</button>}
			<button
				onClick={() => {
					console.log(
						calculateUnknownGenes(
							geneFromImported(savedCat!),
							savedAppearances
								.flatMap(x => x.results.map(y => ({ parents: x.parents, result: y })))
								.map(x => ({ result: x.result, tester: catRegistry[x.parents.find(y => y !== savedCat!.id)!] }))
						)
					);
				}}
			>
				Do it
			</button>
			{gene && <CatGeneDisplay gene={gene} />}
			<pre>
				<code>{cat?.ok ? JSON.stringify(cat.data, null, "\t") : cat?.message}</code>
			</pre>
			<pre>
				<code>{appearances?.ok ? JSON.stringify(appearances.data, null, "\t") : appearances?.message}</code>
			</pre>
			<pre>
				<code>{pea?.ok ? JSON.stringify(pea.data, null, "\t") : pea?.message}</code>
			</pre>
			<pre>
				<code>{pasted}</code>
			</pre>
		</main>
	);
}
