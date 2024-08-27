"use client";
import { MutableRefObject, useEffect, useRef } from "react";
import styles from "./CatImage.module.scss";
import { CatEyes, PartialCatGene, deserializeCatGene, textureFromGene } from "@/util/cat";
import { downloadFile } from "@/util/downloadFile";

export const CatSheet = ({ gene, eyes }: { gene: PartialCatGene | (string | null)[]; eyes?: CatEyes }) => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	useEffect(() => {
		if (!canvasRef.current) return;
		const canvas = new OffscreenCanvas(600, 500);
		const context = canvas.getContext("2d");
		if (!context) return;
		let shouldCancel = false;
		(async () => {
			const processed = gene instanceof Array ? { images: gene } : textureFromGene("adult", "standing", eyes ?? "neutral", gene);
			const images = processed.images
				.filter(x => x)
				.map(x => {
					const img = new Image();
					img.src = x!;
					return img;
				});
			if (!images.length) return;
			for (const image of images) {
				if (!image.complete) {
					const success = await new Promise(res => {
						image.addEventListener("load", () => res(true));
						image.addEventListener("error", () => res(false));
					});
					if (success) context.drawImage(image, 0, 0);
				} else context.drawImage(image, 0, 0);
				if (shouldCancel) return;
			}
			const ctx = canvasRef.current!.getContext("2d")!;
			ctx.clearRect(0, 0, 600, 500);
			ctx.drawImage(canvas, 0, 0);
		})();
		return () => {
			shouldCancel = true;
		};
	}, [gene]);
	return <canvas height={600} width={500} ref={canvasRef} />;
};

export const CatImage = (
	data: ({ gene: string } | { gene: PartialCatGene } | { images: (string | null)[]; offset: { x: number; y: number } }) & {
		layer?: number | string | number[];
		sheet?: boolean;
		eyes?: CatEyes;
		downloadRef?: MutableRefObject<() => unknown>;
	}
) => {
	const imageRefs = useRef([] as HTMLImageElement[]);
	/*
	useEffect(() => {
		(async () => {
			const images = imageRefs.current.filter(x => x);
			if (images.length === 0) return;
			await Promise.all(images.map(x => new Promise(res => x.addEventListener("load", res))));
			const width = Math.max(...images.map(x => x.width));
			const height = Math.max(...images.map(x => x.height));
			const canvas = new OffscreenCanvas(width, height);
			const context = canvas.getContext("2d");
			for (const image of images) context?.drawImage(image, 0, 0);
			const blob = await canvas.convertToBlob();
			if (data.downloadRef) data.downloadRef.current = () => downloadFile("cat.png", blob);
		})();
	}, []);*/
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
