"use client";
import { useState, useMemo, useRef } from "react";
import styles from "./page.module.scss";
import { CatGeneDisplay } from "../components/CatGeneDisplay";
import { CatImage } from "../components/CatImage";
import { catEyes, CatEyes, deserializeCatGene, randomCatGene, serializeCatGene } from "@/util/cat";

export default function GenePage() {
	const [geneInput, setGeneInput] = useState("");
	const [eyes, setEyes] = useState<CatEyes>("neutral");
	const gene = useMemo(() => deserializeCatGene(geneInput), [geneInput]);
	const downloadRef = useRef<() => unknown>(() => {})
	return (
		<main className={styles.main}>
			<h1>Cat Gene Viewer</h1>
			<button onClick={() => setGeneInput(serializeCatGene(randomCatGene(), true))}>Randomize</button>
			<div>
				Eyes <select value={eyes} onChange={x => setEyes(x.target.value as CatEyes)}>
					{catEyes.map(x => <option key={x} value={x}>{`${x[0].toUpperCase()}${x.slice(1)}`}</option>)}
				</select>
			</div>
			<input className={styles.geneInput} value={geneInput} onChange={x => setGeneInput(x.target.value)} />
			<section className={styles.output}>
				{gene.ok ? (
					<>
						<CatImage gene={gene.data} sheet eyes={eyes} downloadRef={downloadRef} />
						<CatGeneDisplay gene={gene.data} />
						<button onClick={() => downloadRef.current()}>Download</button>
					</>
				) : (
					<p>{geneInput ? "Invalid Gene" : ""}</p>
				)}
			</section>
		</main>
	);
}
