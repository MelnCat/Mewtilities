"use client";
import { parseCatPage, RawCat } from "@/parser/catParser";
import styles from "./page.module.scss";
import { Ref, RefObject, useMemo, useState } from "react";
import { useEventListener } from "usehooks-ts";
import { CatAppearance, catSpeciesList, deserializeCatGene, geneFromImported, PartialCatGene, serializeCatGene } from "@/util/cat";
import { CatGeneDisplay } from "../components/CatGeneDisplay";
import { calculateUnknownGenes } from "@/util/gene";
import { parseBeanSandboxPage } from "@/parser/beanSandboxParser";
import { smallNumberFormat, useExtData } from "@/util/util";
import SignIn from "../components/SignIn";

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
const useElementPaste = (element: RefObject<HTMLElement>, cb: (html: string) => void | Promise<void>) => {
	useEventListener("paste", event => {
		try {
			cb(event.clipboardData!.getData("text/html"));
		} catch {}
	}, element);
};

const Title = ({ setCat }: { setCat: (cat: RawCat) => void }) => {
	const [error, setError] = useState("");
	usePaste(str => {
		if (!str) return;
		const parsedCat = parseCatPage(str);
		if (parsedCat.message !== undefined) setError(parsedCat.message);
		else setCat(parsedCat.data);
	});
	return (
		<>
			<h1 className={styles.title}>
				<img src="/img/services/gato.png" alt="GATO" />
			</h1>
			<p>Paste a cat to begin.</p>
			<input value="" onChange={() => {}} />
			<p className={styles.error}>{error}</p>
		</>
	);
};

const testerGenes = {
	572: deserializeCatGene(`[ M ] [ NS ] [ SL ] [ BBDF2 ] [ NYMT ] [ NY3C ] [ BC ] [ BB ]`).data!,
	77688: deserializeCatGene(`[ C ] [ SO ] [ SS ] [ BBFD3 ] [ YYTT ] [ YY1C ] [ BC ] [ BL ]`).data!,
	77444: deserializeCatGene(`[C] {NS} [LL] [BOFF4] [YY{TM}] [{YN}10C] [??] {BY}`).data!,
	85612: deserializeCatGene(`[C] {NS} {SL} [BO{FD}2] [{YN}TT] [{YN}1C] [??] [BB]`).data!,
	92856: deserializeCatGene(`[ C ] [ NS ] [ LL ] [ BOFD3 ] [ NNPT ] [ NN6C ] [ CB ] [ LL ]`).data!,
	96891: deserializeCatGene(`[C] {NS} {SL} [BBDD3] [{YN}TT] [{YN}4L] [??] [LL]`).data!,
	97754: deserializeCatGene(`[ C ] [ NS ] [ LL ] [ OBDD4 ] [ NYMT ] [ NY7I ] [ CB ] [ RL ]`).data!,
	114019: deserializeCatGene(`[C] {NS} [SS] [BO{FD}2] [YY{TS}] [NN10C] [??] [LL]`).data!,
};

const certain = <T,>(value: T) => [{ result: value, probability: 1 }];
const sortMap = <T,>(map: Map<T, number>) => [...map.entries()].sort((a, b) => b[1] - a[1]).map(x => ({ result: x[0], probability: x[1] }));

type ForumColor = "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "pink" | "brown" | "grey" | "teal";

const defaultColors = { "[": "grey", "]": "grey", "{": "grey", "}": "grey", "?": "black" } as const;
const replaceColors = (str: string, rules: Record<string, ForumColor | "black">) => {
	let out = "";
	let currentColor = "black";
	for (const char of str) {
		const color = rules[char] ?? defaultColors[char as keyof typeof defaultColors] ?? "black";
		if (currentColor !== color) {
			if (currentColor !== "black") out += `[/color]`;
			if (color !== "black") out += `[color=${color}]`;
			currentColor = color;
		}
		out += char;
	}
	if (currentColor !== "black") out += "[/color]";
	return out;
};
const brackets = (text: string, braces: boolean = false) => (braces ? `{${text}}` : `[${text}]`);
const optionalBrackets = (text: string, braces: boolean = false) => (braces ? `{${text}}` : text);

const generateBBCode = (gene: PartialCatGene, oldStyle = true) => {
	const species = replaceColors(brackets(gene.species), { C: "brown", M: "blue" });
	const wind = replaceColors(brackets(gene.wind.join(""), !oldStyle && gene.unknownOrder?.wind), { N: "blue", S: "red", O: "grey" });
	const fur = replaceColors(brackets(gene.fur.join(""), !oldStyle && gene.unknownOrder?.fur), { S: "yellow", L: "orange" });
	const colorType = optionalBrackets(gene.color.join(""), !oldStyle && gene.unknownOrder?.color);
	const dilution = optionalBrackets(gene.dilution.join(""), !oldStyle && gene.unknownOrder?.dilution);
	const density = gene.density.toString();
	const color = replaceColors(brackets(`${colorType}${dilution}${density}`), {
		1: "black",
		2: "black",
		3: "black",
		4: "black",
		D: "yellow",
		F: "red",
		O: "orange",
		B: "grey",
	});
	const YN = { Y: "green", N: "red" } as const;
	const patternColors = { ...YN /*T: "green", M: "blue", S: "red", P: "yellow"*/ } as const;
	const pattern = gene.pattern.join("");
	const spotting = gene.spotting.join("");
	const patternSection =
		!oldStyle && gene.unknownOrder?.pattern && gene.unknownOrder?.spotting
			? replaceColors(brackets(`${pattern}${spotting}`, true), patternColors)
			: replaceColors(
					brackets(
						`${optionalBrackets(pattern, !oldStyle && gene.unknownOrder?.pattern)}${optionalBrackets(
							spotting,
							!oldStyle && gene.unknownOrder?.spotting
						)}`
					),
					patternColors
			  );
	const white = replaceColors(optionalBrackets(gene.white.join(""), !oldStyle && gene.unknownOrder?.white), YN);
	const whiteNumber = gene.whiteNumber === 0 || gene.whiteNumber === "?" ? "0" : gene.whiteNumber; /*`[color=${
					{
						0: "black",
						1: "black",
						2: "black",
						3: "black",
						4: "black",
						5: "black",
						6: "black",
						7: "black",
						8: "black",
						9: "black",
						10: "black",
					}[gene.whiteNumber]
			  }]${gene.whiteNumber}[/color]`*/
	const whiteType = replaceColors(gene.whiteType, { C: "red", P: "purple", L: "blue", R: "green", I: "yellow", T: "teal" });
	const whiteSection = `${replaceColors("[", {})}${white}${whiteNumber}${whiteType}${replaceColors("]", {})}`;
	const growth = replaceColors(brackets(gene.growth.join(""), !oldStyle && gene.unknownOrder?.growth), {
		A: "green",
		B: "yellow",
		C: "red",
	});
	const accent = replaceColors(brackets(gene.accent.join(""), !oldStyle && gene.unknownOrder?.accent), {
		B: "blue",
		L: "grey",
		R: "red",
		Y: "yellow",
	});
	const content = `${species} ${wind} ${fur} ${color} ${patternSection} ${whiteSection} ${growth} ${accent}`.replaceAll(" ", " ");
	return `[center][table][tr][td][size=3][font='Nimbus Mono PS', 'Courier New', monospace]${content}[/font][/size][/td][/tr][/table][/center]`;
};

const GeneDashboard = ({ cat }: { cat: RawCat }) => {
	const [gene, setGene] = useState(geneFromImported(cat));
	const [tests, setTests] = useState<{ parents: [number, number]; result: CatAppearance }[]>([]);
	const copy = async (id: number) => {
		await navigator.clipboard.writeText(id.toString());
	};
	const matched = useMemo(
		() =>
			calculateUnknownGenes(
				gene,
				tests.map(x => ({ result: x.result, tester: testerGenes[x.parents.find(y => y !== cat.id) as keyof typeof testerGenes] }))
			),
		[gene, tests, cat]
	);
	const getOrCertain = useMemo(
		() => (key: keyof typeof matched & keyof typeof gene) => matched[key] ? sortMap(matched[key]) : certain(gene[key]),
		[gene, matched]
	);
	const probableGene = useMemo(
		() => ({
			species: certain(gene.species),
			wind: getOrCertain("wind"),
			fur: getOrCertain("fur"),
			color: getOrCertain("color"),
			dilution: getOrCertain("dilution"),
			density: getOrCertain("density"),
			pattern: getOrCertain("pattern"),
			spotting: getOrCertain("spotting"),
			white: matched.white ? sortMap(matched.white) : certain([gene.white, gene.whiteNumber]),
			whiteType: getOrCertain("whiteType"),
			accent: getOrCertain("accent"),
		}),
		[matched, gene, getOrCertain]
	);
	const outputGene = useMemo(
		() =>
			({
				species: probableGene.species[0].result,
				wind: probableGene.wind[0].result,
				fur: probableGene.fur[0].result,
				color: probableGene.color[0].result,
				dilution: probableGene.dilution[0].result,
				density: probableGene.density[0].result,
				pattern: probableGene.pattern[0].result,
				spotting: probableGene.spotting[0].result,
				white: probableGene.white[0].result[0],
				whiteNumber: probableGene.white[0].result[1],
				whiteType: probableGene.whiteType[0].result,
				accent: probableGene.accent[0].result,
				growth: gene.growth,
				unknownOrder: {
					wind: gene.unknownOrder?.wind && probableGene.wind[0].result[0] !== probableGene.wind[0].result[1],
					fur: gene.unknownOrder?.fur && probableGene.fur[0].result[0] !== probableGene.fur[0].result[1],
					color: gene.unknownOrder?.color && probableGene.color[0].result[0] !== probableGene.color[0].result[1],
					dilution: gene.unknownOrder?.dilution && probableGene.dilution[0].result[0] !== probableGene.dilution[0].result[1],
					pattern: gene.unknownOrder?.pattern && probableGene.pattern[0].result[0] !== probableGene.pattern[0].result[1],
					spotting: gene.unknownOrder?.spotting && probableGene.spotting[0].result[0] !== probableGene.spotting[0].result[1],
					white: gene.unknownOrder?.white && probableGene.white[0].result[0][0] !== probableGene.white[0].result[0][1],
					accent: gene.unknownOrder?.accent && probableGene.accent[0].result[0] !== probableGene.accent[0].result[1],
					growth: gene.unknownOrder?.growth,
				},
			} satisfies PartialCatGene),
		[probableGene, gene]
	);
	const [seen, setSeen] = useState<string[]>([]);
	usePaste(data => {
		if (!data) return;
		if (seen.includes(data)) return;
		const sandbox = parseBeanSandboxPage(data);
		if (!sandbox.ok) return;
		if (!sandbox.data.parents.includes(cat.id)) return;
		setSeen(seen.concat(data));
		setTests(tests.concat(sandbox.data.results.map(x => ({ result: x, parents: sandbox.data.parents }))));
	});
	useExtData(event => {
		if (!event.detail.url.includes("sandbox/beans")) return;
		const data = new TextDecoder().decode(event.detail.data);
		if (seen.includes(data)) return;
		const sandbox = parseBeanSandboxPage(data);
		if (!sandbox.ok) return;
		if (!sandbox.data.parents.includes(cat.id)) return;
		setSeen(seen.concat(data));
		setTests(tests.concat(sandbox.data.results.map(x => ({ result: x, parents: sandbox.data.parents }))));
	});
	return (
		<>
			<h1>
				{cat.id}: {cat.name}
			</h1>
			<CatGeneDisplay gene={gene} />
			<CatGeneDisplay gene={outputGene} />
			<section className={styles.certaintyList}>
				{Object.entries(probableGene).map(([k, v]) => (
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
				<p>Paste a sandbox trial to gene.</p>
				<input value="" readOnly />
				<h1>Sandbox Inputs:</h1>
				<div className={styles.sandboxInputs}>
					<input value={cat.wind === "South" ? 572 : cat.id} readOnly />
					<input value={cat.wind === "South" ? cat.id : 572} readOnly />
				</div>
				<a href="https://www.pixelcatsend.com/sandbox/beans" target="_blank">
					Open Sandbox
				</a>
				<button onClick={() => copy(cat.id)}>Copy Cat ID</button>
				<button onClick={() => copy(572)}>Copy Tester ID</button>
				<p>
					Stuck on the white YN? Use <input readOnly value="114019" />
				</p>
				<p>{serializeCatGene(outputGene, true)}</p>
				<h2>BBCode</h2>
				<textarea readOnly value={generateBBCode(outputGene)} />
				<button onClick={() => navigator.clipboard.writeText(generateBBCode(outputGene))}>Copy BBCode</button>
				<h2>Traditional Gene Format</h2>
				<p>{serializeCatGene({ ...outputGene, unknownOrder: {} }, true)}</p>
			</article>
		</>
	);
};

export default function GeneTestPage() {
	const [cat, setCat] = useState<null | RawCat>(null);
	return <main className={styles.main}>{cat ? <GeneDashboard cat={cat} /> : <Title setCat={setCat} />}</main>;
}
