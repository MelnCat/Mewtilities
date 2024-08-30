"use client";
import { useState, useMemo, useRef, Dispatch, SetStateAction, useEffect, useId, MouseEventHandler } from "react";
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
	parseCatBio,
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
import { blobToBase64, downloadFile } from "@/util/downloadFile";
import { ItemImage } from "../components/ItemImage";
import { showOpenFilePicker } from "file-system-access";

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
	const [importInput, setImportInput] = useState("");
	const [selected, setSelected] = useState<null | [number, number]>(null);

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
	const [clothing, setClothing] = useState<
		((ProcessedClothing & { keyId: number; shown: boolean }) | { shown: boolean; custom: true; image: string; keyId: number; data: string; name: string })[]
	>([]);
	const [selectedClothing, setSelectedClothing] = useState<{ value: number } | null>(null);
	const [downloading, setDownloading] = useState(false);
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
				.concat(
					clothing
						.toReversed()
						.filter(x => x.shown)
						.map(x => (x.custom ? x.image : pceLink(`images/clothing/${colorLayer.species}/${x.key}.png`)))
				),
		[colorLayer, tradeColorLayer, whiteLayer, accentLayer, eyesLayer, clothing]
	);
	useEffect(() => {
		loadFromGene(randomCatGene(species === "Any" ? undefined : species === "Not-Cat" ? "C" : "M"));
	}, [species]);
	const loadFromGene = (gene: PartialCatGene) => {
		const props = getCatTextureProperties(getGenePhenotype(gene));
		setColorLayer(props[0]);
		setTradeColorLayer(props[1]);
		setWhiteLayer(props[2]);
		setAccentLayer(props[3]);
		setEyesLayer(props[4]);
	};
	const download = async () => {
		setDownloading(true);
		const canvas = new OffscreenCanvas(500, 600);
		const ctx = canvas.getContext("2d")!;
		for (const layer of layers.filter(x => x)) {
			const image = new Image();
			image.src = layer!;
			image.crossOrigin = "anonymous";
			if (!image.complete) await new Promise(res => image.addEventListener("load", res));
			ctx.drawImage(image, 0, 0);
		}
		downloadFile(`cat.png`, await canvas.convertToBlob({ type: "image/png" }));
		setDownloading(false);
	};
	const downloadSelected = async () => {
		if (!selected) return;
		setDownloading(true);
		const canvas = new OffscreenCanvas(100, 100);
		const ctx = canvas.getContext("2d")!;
		for (const layer of layers.filter(x => x)) {
			const image = new Image();
			image.src = layer!;
			image.crossOrigin = "anonymous";
			if (!image.complete) await new Promise(res => image.addEventListener("load", res));
			ctx.drawImage(image, selected[0] * 100, selected[1] * 100 + 5, 100, 100, 0, 0, 100, 100);
		}
		downloadFile(`cat_selected.png`, await canvas.convertToBlob({ type: "image/png" }));
		setDownloading(false);
	};
	const canvasClick: MouseEventHandler<HTMLCanvasElement> = event => {
		const bounding = (event.target as HTMLCanvasElement).getBoundingClientRect();
		const x = event.clientX - bounding.left;
		const y = event.clientY - bounding.top;
		const col = Math.floor((x / bounding.width) * 5);
		const row = Math.floor((y / bounding.height) * 6);
		if (col < 0 || col >= 5) return;
		if (row < 0 || row >= 5) return;
		setSelected(x => (x && x[0] === col && x[1] === row ? null : [col, row]));
	};
	const tryImport = (data: string) => {
		let found = false;
		const foundClothing = data.match(/Currently Wearing: (.+)/)?.[1];
		if (foundClothing) {
			found = true;
			setClothing(
				[...foundClothing.matchAll(/#(\d+)/g)]
					.map(x => +x[1])
					.flatMap(x => {
						const item = clothingIndex?.find(y => y.id === x);
						if (!item) return [];
						return { ...item, keyId: Math.random(), shown: true };
					})
					.toReversed()
			);
		} else setClothing([]);
		const find = (header: string) => data.match(new RegExp(`${header}:\n(.+)`))?.[1];
		const species = find("Species");
		const color = find("Color");
		const pattern = find("Pattern");
		const white = find("White Marks");
		const accent = find("Accent") ?? undefined;
		const eyes = data.match(/ (\w+) eyes/)?.[1];
		if (species && color && pattern && eyes && white) {
			try {
				const parsed = parseCatBio({ species, color, pattern, white, accent, eyes });
				setColorLayer(parsed[0]);
				setTradeColorLayer(parsed[1]);
				setWhiteLayer(parsed[2]);
				setAccentLayer(parsed[3]);
				setEyesLayer(parsed[4]);
				found = true;
			} catch {}
		}
		if (found) setImportInput("");
		else setImportInput("[Invalid]");
	};
	const save = async () => {
		downloadFile(
			"export.notcat",
			new Blob([
				JSON.stringify({
					color: colorLayer,
					tradeColor: tradeColorLayer,
					white: whiteLayer,
					accent: accentLayer,
					eyes: eyesLayer,
					clothing: clothing.map(x => ("id" in x ? { id: x.id, shown: x.shown } : { data: x.data, name: x.name, shown: x.shown })),
				}),
			])
		);
	};
	const saveCat = async () => {
		downloadFile(
			"export.notcat",
			new Blob([
				JSON.stringify({
					color: colorLayer,
					tradeColor: tradeColorLayer,
					white: whiteLayer,
					accent: accentLayer,
					eyes: eyesLayer,
				}),
			])
		);
	};
	const saveClothing = async () => {
		downloadFile(
			"export.notclothing",
			new Blob([
				JSON.stringify({
					clothing: clothing.map(x => ("id" in x ? { id: x.id, shown: x.shown } : { data: x.data, name: x.name, shown: x.shown })),
				}),
			])
		);
	};
	const load = async () => {
		try {
			const file = await showOpenFilePicker({
				types: [{ description: "Saved Not-Data", accept: { "application/notdata": [".notcat", ".notclothing"] } }],
				multiple: false,
			});
			if (!file?.[0]) return;
			const data = JSON.parse(await (await file[0].getFile()).text());
			if (data.color) setColorLayer(data.color);
			if (data.tradeColor) setTradeColorLayer(data.tradeColor);
			if (data.white) setWhiteLayer(data.white);
			if (data.accent) setAccentLayer(data.accent);
			if (data.eyes) setEyesLayer(data.eyes);
			if (data.clothing)
				setClothing(
					data.clothing.map((x: { id: number; shown: boolean } | { data: string; name: string; shown: boolean }) => {
						if ("data" in x) return { custom: true, image: x.data, keyId: Math.random(), data: x.data, name: x.name, shown: x.shown };
						const item = clothingIndex?.find(y => y.id === x.id);
						if (!item) return [];
						return { ...item, keyId: Math.random(), shown: x.shown };
					})
				);
		} catch {}
	};
	const uploadAsset = async () => {
		try {
			const files = await showOpenFilePicker({
				types: [{ description: "Images", accept: { "image/png": [".png"] } }],
				multiple: true,
			});
			const cl = clothing.slice(0);
			for (const file of files) {
				const f = await file.getFile();
				const url = URL.createObjectURL(f);
				cl.push({ keyId: Math.random(), data: await blobToBase64(f), image: url, custom: true, name: f.name, shown: true });
			}
			setClothing(cl);
		} catch {}
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
			<input className={styles.geneInput} value={geneInput} onChange={x => setGeneInput(x.target.value)} placeholder="[C] [NS] [LL] [OBDD4] [NYMT] [NY7I] [CB] [RL]" />
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
			<textarea
				className={styles.geneInput}
				value={importInput}
				onChange={x => {
					setImportInput(x.target.value);
					tryImport(x.target.value);
				}}
				placeholder="Import Cat/Clothing (Copy/Paste)"
				rows={1}
			/>
			<div className={styles.saveLoad}>
				<button onClick={load}>Load</button>
				<button onClick={save}>Save All</button>
				<button onClick={saveCat}>Save Cat</button>
				<button onClick={saveClothing}>Save Clothing</button>
			</div>
			<article className={styles.mainView}>
				<section className={styles.output}>
					{layers.length ? (
						<>
							<section className={styles.canvasWrapper}>
								{selected && <div className={styles.selectedCanvas} style={{ "--row": selected[1], "--col": selected[0] }} />}
								<CatSheet onClick={canvasClick} gene={layers} />
							</section>
							<section className={styles.outputRow}>
								<button onClick={download} disabled={downloading}>
									Export
								</button>
								{selected && (
									<button onClick={downloadSelected} disabled={downloading}>
										Export Selected
									</button>
								)}
							</section>
						</>
					) : null}
				</section>
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
							onChange={x => setSelectedClothing((x as { value: number }) ?? null)}
							value={selectedClothing}
						/>
						<button
							onClick={() => {
								if (!selectedClothing) return;
								setClothing(x => [{ ...clothingIndex!.find(x => x.id === selectedClothing.value)!, keyId: Math.random(), shown: true }].concat(x as any));
								setSelectedClothing(null);
							}}
						>
							Add
						</button>
					</div>
					<Reorder.Group axis="y" values={clothing} onReorder={setClothing} className={styles.clothingList}>
						{clothing.map(item => (
							<Reorder.Item key={item.keyId} value={item} className={styles.clothingItem} {...("data" in item ? { "data-upload": true } : null)}>
								<input className={styles.showHide} type="checkbox" checked={item.shown} onClick={() => setClothing(c => c.map(y => y.keyId === item.keyId ? {...y, shown: !y.shown} : y))} />
								<section className={styles.clothingImage}>
									{"id" in item ? <ItemImage item={item} /> : <article className={styles.customUploadImage} style={{ backgroundImage: `url("${item.image}")` }} />}
								</section>
								<p>{item.name}</p>
								<button onClick={() => setClothing(x => x.filter(y => y.keyId !== item.keyId))}>X</button>
							</Reorder.Item>
						))}
					</Reorder.Group>
					<div className={styles.uploadRow}>
						<button
							onClick={() => {
								uploadAsset();
							}}
						>
							Upload Asset
						</button>
					</div>
				</section>
			</article>
		</main>
	);
}
