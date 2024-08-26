"use client";
import React, { useRef } from "react";
import styles from "./CatGeneDisplay.module.scss";
import { deserializeCatGene, PartialCatGene } from "@/util/cat";
import { useHover } from "usehooks-ts";
import { defaultFont } from "@/util/font";

const CatGeneSection = ({ category, children, tooltip }: { category: string; children: React.ReactNode; tooltip: { title: string; content: string } }) => {
	const ref = useRef<HTMLDivElement | null>(null);
	const hovered = useHover(ref);
	return (
		<div className={styles.geneSection} data-category={category} ref={ref}>
			{hovered ? (
				<div className={`${styles.tooltip} ${defaultFont.className}`}>
					<h1>{tooltip.title}</h1>
					<p>{tooltip.content}</p>
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

export const CatGeneDisplay = (data: { gene: string } | { gene: PartialCatGene }) => {
	if (typeof data.gene === "string") {
		const deserialized = deserializeCatGene(data.gene);
		if (deserialized.ok) return <CatGeneDisplay gene={deserialized.data} />;
		return <p>{deserialized.message}</p>;
	}
	const g = data.gene;
	return (
		<div className={styles.display}>
			<CatGeneSection category="species" tooltip={{ title: "Species", content: g.species === "C" ? "Not-Cat" : "Mercat" }}>
				<CatGeneContent content={g.species} />
			</CatGeneSection>
			<CatGeneSection category="wind" tooltip={{ title: "Wind", content: "todo" }}>
				<CatGeneContent content={g.wind} />
			</CatGeneSection>
			<CatGeneSection category="fur" tooltip={{ title: "Fur", content: "todo" }}>
				<CatGeneContent content={g.fur} />
			</CatGeneSection>
			<CatGeneSection category="color" tooltip={{ title: "Color", content: "todo" }}>
				<CatGeneContent content={g.color} />
				<CatGeneContent content={g.dilution} />
				<CatGeneContent content={g.density} />
			</CatGeneSection>
			<CatGeneSection category="pattern" tooltip={{ title: "Pattern", content: "todo" }}>
				<CatGeneContent content={g.pattern} />
				<CatGeneContent content={g.spotting} />
			</CatGeneSection>
			<CatGeneSection category="white" tooltip={{ title: "White", content: "todo" }}>
				<CatGeneContent content={g.white} />
				<CatGeneContent content={g.whiteNumber} />
				<CatGeneContent content={g.whiteType} />
			</CatGeneSection>
			<CatGeneSection category="growth" tooltip={{ title: "Growth", content: "todo" }}>
				<CatGeneContent content={g.growth} />
			</CatGeneSection>
			<CatGeneSection category="accent" tooltip={{ title: "Accent", content: "todo" }}>
				<CatGeneContent content={g.accent} />
			</CatGeneSection>
		</div>
	);
};
