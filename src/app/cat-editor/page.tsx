"use client";
import { useState, useMemo, useRef } from "react";
import styles from "./page.module.scss";
import { CatGeneDisplay } from "../components/CatGeneDisplay";
import { CatImage, CatSheet } from "../components/CatImage";
import { catEyes, CatEyes, deserializeCatGene, randomCatGene, serializeCatGene, textureFromGene } from "@/util/cat";
import { sample } from "remeda";

export default function CatEditorPage() {
	const [geneInput, setGeneInput] = useState("");
	const [species, setSpecies] = useState("Any");
	const [layers, setLayers] = useState<(string | null)[]>([]);
	
	color: p.whiteNumber !== 10 && p.whiteNumber !== "?" ? `images/cats/${p.species}/${p.mainColor}_main_${p.pattern}.png` : null,
	tradeColor: p.tradeColor !== null ? `images/cats/${p.species}/${p.tradeColor}_trade_${p.pattern}.png` : null,
	white: p.whiteNumber !== 0 ? `images/cats/${p.species}/white_${p.whiteType}_${p.whiteNumber === "?" ? 10 : p.whiteNumber}.png` : null,
	accent: p.species === "m" ? `images/cats/${p.species}/${p.accent}_accent_${p.pattern}.png` : null
	return (
		<main className={styles.main}>
			<h1>Cat Editor</h1>
			<button
				onClick={() => {
					setLayers(
						textureFromGene("adult", "standing", sample(catEyes, 1)[0], randomCatGene(species === "Any" ? undefined : species === "Not-Cat" ? "C" : "M")).images
					);
				}}
			>
				Randomize
			</button>
			<div>
				Species
				<select value={species} onChange={x => setSpecies(x.target.value)}>
					<option value="Any">Any</option>
					<option value="Not-Cat">Not-Cat</option>
					<option value="Mercat">Mercat</option>
				</select>
			</div>
			<input className={styles.geneInput} value={geneInput} onChange={x => setGeneInput(x.target.value)} />
			<button
				onClick={() => {
					const deserialize = deserializeCatGene(geneInput);
					if (deserialize.ok) {
						setLayers(textureFromGene("adult", "standing", "neutral", deserialize.data).images);
						setGeneInput("");
					}
				}}
			>
				Import Gene
			</button>
			<section className={styles.output}>{layers.length ? <CatSheet gene={layers} /> : null}</section>
		</main>
	);
}
