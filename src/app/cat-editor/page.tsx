"use client";
import { useState, useMemo, useRef, Dispatch, SetStateAction, useEffect, useId } from "react";
import styles from "./page.module.scss";
import { CatGeneDisplay } from "../components/CatGeneDisplay";
import { CatImage, CatSheet } from "../components/CatImage";
import {
	accentTypeList,
	CatColor,
	catColorList,
	catEyes,
	CatEyes,
	catEyesNames,
	CatPattern,
	catPatternList,
	catSpeciesList,
	catSpeciesNames,
	deserializeCatGene,
	getCatTextureProperties,
	getGenePhenotype,
	PartialCatGene,
	randomCatGene,
	serializeCatGene,
	textureFromGene,
	whiteTypeList,
} from "@/util/cat";
import Select, { createFilter } from "react-windowed-select";
import { randomInteger, sample } from "remeda";
import { pceLink, sampleRandom } from "@/util/util";
import { accentNames, colorNames, patternNames, whiteTypeKeys } from "@/util/catData";
import { ProcessedClothing } from "@/db/db";
import { Reorder } from "framer-motion";
import useSWR from "swr";

const EditorLayer = <T extends { shown: boolean }>({
	layer,
	setLayer,
	title,
	values,
}: {
	layer: T;
	setLayer: Dispatch<SetStateAction<T>>;
	title: string;
	values: Record<Exclude<keyof T, "shown">, { name: string; values: { key: string | number; name: string | number }[] }>;
}) => {
	return (
		<div className={styles.editorLayer}>
			<h1>{title}</h1>
			<div className={styles.editorLayerOptions}>
				<div className={styles.editorLayerOption}>
					<p>Visible</p>
					<input type="checkbox" checked={layer.shown} onChange={() => setLayer(x => ({ ...x, shown: !x.shown }))} />
				</div>
				{(Object.entries(values) as [keyof T & string, (typeof values)[keyof typeof values]][]).map(([k, v]) => (
					<div className={styles.editorLayerOption} key={k}>
						<p>{v.name}</p>
						<select value={layer[k] as string} onChange={e => setLayer(x => ({ ...x, [k]: e.target.value }))}>
							{k === "species" ? null : <option value="-">-</option>}
							{v.values.map(x => (
								<option key={x.key} value={x.key}>
									{x.name}
								</option>
							))}
						</select>
					</div>
				))}
			</div>
		</div>
	);
};

export default function CatEditorPage() {
	const { data: clothingIndex } = useSWR<ProcessedClothing[]>(
		"/api/clothing",
		async () => await (await fetch("/api/clothing", { cache: "force-cache", next: { revalidate: 300 } })).json()
	);
	const [geneInput, setGeneInput] = useState("");
	const [species, setSpecies] = useState("Any");
	const [colorLayer, setColorLayer] = useState({ species: "c", color: sampleRandom(catColorList) as string, pattern: sampleRandom(catPatternList) as string, shown: false });
	const [tradeColorLayer, setTradeColorLayer] = useState({ species: "c", color: "-", pattern: "-", shown: false });
	const [whiteLayer, setWhiteLayer] = useState({
		species: "c",
		whiteType: sampleRandom(whiteTypeList) as string,
		whiteNumber: randomInteger(0, 10) as number | "-",
		shown: false,
	});
	const [accentLayer, setAccentLayer] = useState({ species: "c", accent: "-", pattern: "-", shown: false });
	const [eyesLayer, setEyesLayer] = useState({ eyes: "neutral", albinoType: "-", shown: false });
	const [clothing, setClothing] = useState<(ProcessedClothing & { keyId: number })[]>([]);
	const [selected, setSelected] = useState<{ value: number } | null>(null);
	const layers = useMemo(
		() =>
			[
				colorLayer.shown && Object.values(colorLayer).every(x => x !== "-") ? `images/cats/${colorLayer.species}/${colorLayer.color}_main_${colorLayer.pattern}.png` : null,
				tradeColorLayer.shown && Object.values(tradeColorLayer).every(x => x !== "-")
					? `images/cats/${tradeColorLayer.species}/${tradeColorLayer.color}_trade_${tradeColorLayer.pattern}.png`
					: null,
				whiteLayer.shown && Object.values(whiteLayer).every(x => x !== "-") && whiteLayer.whiteNumber !== 0
					? `images/cats/${whiteLayer.species}/white_${whiteLayer.whiteType}_${whiteLayer.whiteNumber}.png`
					: null,
				accentLayer.shown && Object.values(accentLayer).every(x => x !== "-") && accentLayer.species !== "c"
					? `images/cats/${accentLayer.species}/${accentLayer.accent}_accent_${accentLayer.pattern}.png`
					: null,
				eyesLayer.shown && eyesLayer.eyes !== "-" ? `images/cats/eyes_${eyesLayer.eyes}${eyesLayer.albinoType === "-" ? "" : `_a_${eyesLayer.albinoType}`}.png` : null,
			]
				.map(x => (x ? pceLink(x) : x))
				.concat(clothing.map(x => (x.custom ? x.image : pceLink(`images/clothing/${colorLayer.species}/${x.key}.png`)))),
		[colorLayer, tradeColorLayer, whiteLayer, accentLayer, eyesLayer, clothing]
	);
	useEffect(() => {
		loadFromGene(randomCatGene(species === "Any" ? undefined : species === "Not-Cat" ? "C" : "M"));
	}, []);
	const loadFromGene = (gene: PartialCatGene) => {
		const props = getCatTextureProperties(getGenePhenotype(gene));
		setColorLayer(props[0]);
		setTradeColorLayer(props[1]);
		setWhiteLayer(props[2]);
		setAccentLayer(props[3]);
		setEyesLayer(props[4]);
	};

	return (
		<main className={styles.main}>
			<h1>Cat Editor</h1>
			<button
				onClick={() => {
					loadFromGene(randomCatGene(species === "Any" ? undefined : species === "Not-Cat" ? "C" : "M"));
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
						loadFromGene(deserialize.data);
						setGeneInput("");
					}
				}}
			>
				Import Gene
			</button>
			<article className={styles.mainView}>
				<section className={styles.output}>{layers.length ? <CatSheet gene={layers} /> : null}</section>
				<section className={styles.editor}>
					<EditorLayer
						title="Eyes"
						layer={eyesLayer}
						setLayer={setEyesLayer}
						values={{
							eyes: { name: "Eyes", values: catEyes.map(x => ({ name: catEyesNames[x], key: x })) },
							albinoType: { name: "Albino Type", values: whiteTypeList.map(x => ({ name: whiteTypeKeys[x], key: x })) },
						}}
					/>
					<EditorLayer
						title="Accent"
						layer={accentLayer}
						setLayer={setAccentLayer}
						values={{
							species: { name: "Species", values: catSpeciesList.map(x => ({ name: catSpeciesNames[x], key: x })) },
							accent: { name: "Accent", values: accentTypeList.map(x => ({ name: accentNames[x], key: x })) },
							pattern: { name: "Pattern", values: catPatternList.map(x => ({ name: patternNames[x], key: x })) },
						}}
					/>
					<EditorLayer
						title="White"
						layer={whiteLayer}
						setLayer={setWhiteLayer}
						values={{
							species: { name: "Species", values: catSpeciesList.map(x => ({ name: catSpeciesNames[x], key: x })) },
							whiteNumber: { name: "White #", values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(x => ({ name: x, key: x })) },
							whiteType: { name: "White Type", values: whiteTypeList.map(x => ({ name: whiteTypeKeys[x], key: x })) },
						}}
					/>
					<EditorLayer
						title="Tortoise/Watercolor Pattern"
						layer={tradeColorLayer}
						setLayer={setTradeColorLayer}
						values={{
							species: { name: "Species", values: catSpeciesList.map(x => ({ name: catSpeciesNames[x], key: x })) },
							color: { name: "Color", values: catColorList.map(x => ({ name: colorNames[x], key: x })) },
							pattern: { name: "Pattern", values: catPatternList.map(x => ({ name: patternNames[x], key: x })) },
						}}
					/>
					<EditorLayer
						title="Color"
						layer={colorLayer}
						setLayer={setColorLayer}
						values={{
							species: { name: "Species", values: catSpeciesList.map(x => ({ name: catSpeciesNames[x], key: x })) },
							color: { name: "Color", values: catColorList.map(x => ({ name: colorNames[x], key: x })) },
							pattern: { name: "Pattern", values: catPatternList.map(x => ({ name: patternNames[x], key: x })) },
						}}
					/>
				</section>
				<section className={styles.clothingSelect}>
					<h1>Clothing</h1>
					<div className={styles.selectRow}>
						<Select
							className={styles.select}
							windowThreshold={50}
							filterOption={createFilter({ ignoreAccents: false })}
							options={(clothingIndex ?? []).map(x => ({ label: `(${x.id}) ${x.name}`, value: x.id }))}
							instanceId={useId()}
							onChange={x => setSelected((x as { value: number }) ?? null)}
							value={selected}
						/>
						<button
							onClick={() => {
								if (!selected) return;
								setClothing(x => x.concat({ ...clothingIndex!.find(x => x.id === selected.value)!, keyId: Math.random() }));
								setSelected(null);
							}}
						>
							Add
						</button>
					</div>
					<Reorder.Group axis="y" values={clothing} onReorder={setClothing} className={styles.clothingList}>
						{clothing.map(item => (
							<Reorder.Item key={item.keyId} value={item} className={styles.clothingItem}>
								{item.name} <button onClick={() => setClothing(x => x.filter(y => y.keyId !== item.keyId))}>X</button>
							</Reorder.Item>
						))}
					</Reorder.Group>
				</section>
			</article>
		</main>
	);
}
