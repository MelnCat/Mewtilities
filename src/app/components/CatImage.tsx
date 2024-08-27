"use client";
import { Ref, useEffect, useRef } from "react";
import styles from "./CatImage.module.scss";
import { CatEyes, PartialCatGene, deserializeCatGene, textureFromGene } from "@/util/cat";

export const CatImage = (
	data: ({ gene: string } | { gene: PartialCatGene } | { images: (string | null)[]; offset: { x: number; y: number } }) & {
		layer?: number | string | number[];
		sheet?: boolean;
		eyes?: CatEyes;
		downloadRef?: Ref<() => void>;
	}
) => {
	const imageRefs = useRef([] as HTMLImageElement[]);
	useEffect(() => {
		const images = imageRefs.current;
		const width = Math.max(...images.map(x => x.width));
		const height = Math.max(...images.map(x => x.height));
		const canvas = new OffscreenCanvas(width, height);
		const context = canvas.getContext("2d");
		for (const image of images) context?.drawImage(image, 0, 0);
		
	}, []);
	if ("gene" in data) {
		if (typeof data.gene === "string") {
			const test = deserializeCatGene(data.gene);
			if (test.ok) return <CatImage gene={test.data} layer={data.layer} sheet={data.sheet} eyes={data.eyes} downloadRef={data.downloadRef} />;
			return <p>{test.message}</p>;
		}
		const processed = textureFromGene("adult", "standing", data.eyes ?? "neutral", data.gene);
		return <CatImage images={processed.images} offset={processed.offset} layer={data.layer} sheet={data.sheet} eyes={data.eyes} downloadRef={data.downloadRef} />;
	}
	const images = data.images.map((x, i) =>
		x === null ? null : (
			<img
				ref={ref => {
					imageRefs.current[i] = ref!;
				}}
				style={{ objectPosition: data.sheet ? "" : `${data.offset.x}px ${data.offset.y}px` }}
				key={x}
				src={x}
				alt="Cat"
			/>
		)
	);
	const toDisplay =
		data.layer === undefined ? (
			images
		) : typeof data.layer === "number" ? (
			images[data.layer]
		) : data.layer instanceof Array ? (
			images.filter((x, i) => (data.layer as number[]).includes(i))
		) : (
			<img style={{ objectPosition: data.sheet ? "" : `${data.offset.x}px ${data.offset.y}px` }} src={data.layer} alt="Cat" />
		);
	return toDisplay === null ? null : <article className={`${styles.catContainer}${data.sheet ? ` ${styles.sheet}` : ""}`}>{toDisplay}</article>;
};
