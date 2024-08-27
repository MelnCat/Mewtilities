"use client";
import React, { useRef } from "react";
import styles from "./CatGeneDisplay.module.scss";
import { deserializeCatGene, getCatTextures, getGenePhenotype, PartialCatGene, textureFromGene } from "@/util/cat";
import { useHover } from "usehooks-ts";
import { defaultFont } from "@/util/font";
import { CatImage } from "./CatImage";
import { pceLink } from "@/util/util";
import { colorNames, patternNames, whiteTypeNames, accentNames } from "@/util/catData";

const CatGeneSection = ({ category, children, tooltip }: { category: string; children: React.ReactNode; tooltip: { title: string; content: string | React.ReactNode } }) => {
	const ref = useRef<HTMLDivElement | null>(null);
	const hovered = useHover(ref);
	return (
		<div className={styles.geneSection} data-category={category} ref={ref}>
			{hovered ? (
				<div className={`${styles.tooltip} ${defaultFont.className}`}>
					<h1>{tooltip.title}</h1>
					<div>{tooltip.content}</div>
				</div>
			) : null}
			[{children}]
		</div>
	);
};

const CatGeneContent = ({ content }: { content: number | string | string[] }) => {
	return content instanceof Array ? (
		content.map((x, i) => (
			<span className={styles.geneContent} data-content={x} key={i}>
				{x}
			</span>
		))
	) : (
		<span className={styles.geneContent} data-content={content} style={typeof content === "number" ? { "--content": content } : {}}>
			{content}
		</span>
	);
};
export const WindIcon = ({ wind }: { wind: string }) => <img className={styles.windIcon} src={pceLink(`main_assets/runes/wind_${wind.toLowerCase()}.png`)} alt={wind} />;

export const CatGeneDisplay = (data: { gene: string } | { gene: PartialCatGene }) => {
	if (typeof data.gene === "string") {
		const deserialized = deserializeCatGene(data.gene);
		if (deserialized.ok) return <CatGeneDisplay gene={deserialized.data} />;
		return <p>{deserialized.message}</p>;
	}
	const g = data.gene;
	const p = getGenePhenotype(g);
	return (
		<div className={styles.display}>
			<CatGeneSection
				category="species"
				tooltip={{
					title: "Species",
					content: (
						<>
							{p.species === "c" ? "Not-Cat" : "Mercat"}
							<CatImage gene={g} />
						</>
					),
				}}
			>
				<CatGeneContent content={g.species} />
			</CatGeneSection>
			<CatGeneSection
				category="wind"
				tooltip={{
					title: "Wind",
					content: (
						<>
							{`${
								p.wind === "Trade" || p.wind === "Null"
									? ""
									: g.wind.includes("?" as "O")
									? "Unknown "
									: g.wind.every(x => x === g.wind[0])
									? "Homozygous "
									: "Heterozygous "
							} ${p.wind}`}
							<WindIcon wind={p.wind} />
						</>
					),
				}}
			>
				<CatGeneContent content={g.wind} />
			</CatGeneSection>
			<CatGeneSection
				category="fur"
				tooltip={{
					title: "Fur",
					content: (
						<>
							{`${p.fur === "longhair" ? "Longhair" : `${g.fur.every(x => x === g.fur[0]) ? "Homozygous" : "Heterozygous"} Shorthair`}`}
							<CatImage gene={g} layer={pceLink(`main_assets/${p.species === "m" ? "mercat" : "notcat"}_grey_model.png`)} />
						</>
					),
				}}
			>
				<CatGeneContent content={g.fur} />
			</CatGeneSection>
			<CatGeneSection
				category="color"
				tooltip={{
					title: "Color",
					content: (
						<>
							{p.tradeColor
								? `${colorNames[p.mainColor]}-${colorNames[p.tradeColor]} ${g.color.every(x => x === g.color[0]) ? "Watercolor" : "Tortoiseshell"}`
								: colorNames[p.mainColor]}
							<CatImage gene={g} layer={[0, 1]} />
						</>
					),
				}}
			>
				<CatGeneContent content={g.color} />
				<CatGeneContent content={g.dilution} />
				<CatGeneContent content={g.density} />
			</CatGeneSection>
			<CatGeneSection
				category="pattern"
				tooltip={{
					title: "Pattern",
					content: (
						<>
							{patternNames[p.pattern]}
							<CatImage gene={g} layer={[0, 1]} />
						</>
					),
				}}
			>
				<CatGeneContent content={g.pattern} />
				<CatGeneContent content={g.spotting} />
			</CatGeneSection>
			<CatGeneSection
				category="white"
				tooltip={{
					title: "White",
					content: (
						<>
							{p.whiteType === "?" || p.whiteNumber === "?" ? "Albino" : whiteTypeNames[p.whiteType][p.whiteNumber]}
							<CatImage gene={g} layer={2} />
						</>
					),
				}}
			>
				<CatGeneContent content={g.white} />
				<CatGeneContent content={g.whiteNumber} />
				<CatGeneContent content={g.whiteType} />
			</CatGeneSection>
			<CatGeneSection category="growth" tooltip={{ title: "Growth", content: p.growthType === "?" ? "Unknown" : p.growthType }}>
				<CatGeneContent content={g.growth} />
			</CatGeneSection>
			<CatGeneSection
				category="accent"
				tooltip={{
					title: "Accent",
					content: (
						<>
							{p.accent === "?" ? "Unknown" : accentNames[p.accent]}

							<CatImage gene={g} layer={3} />
						</>
					),
				}}
			>
				<CatGeneContent content={g.accent} />
			</CatGeneSection>
		</div>
	);
};