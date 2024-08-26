import styles from "./CatImage.module.scss";
import { PartialCatGene, deserializeCatGene, textureFromGene } from "@/util/cat";

export const CatImage = (data: ({ gene: string } | { gene: PartialCatGene } | { images: (string | null)[]; offset: { x: number; y: number } }) & { layer?: number | string | number[] }) => {
	if ("gene" in data) {
		if (typeof data.gene === "string") {
			const test = deserializeCatGene(data.gene);
			if (test.ok) return <CatImage gene={test.data} layer={data.layer} />;
			return <p>{test.message}</p>;
		}
		const processed = textureFromGene("adult", "standing", "neutral", data.gene);
		return <CatImage images={processed.images} offset={processed.offset} layer={data.layer} />;
	}
	const images = data.images.map(x => (x === null ? null : <img style={{ objectPosition: `${data.offset.x}px ${data.offset.y}px` }} key={x} src={x} alt="Cat" />));
	const toDisplay =
		data.layer === undefined ? (
			images
		) : typeof data.layer === "number" ? (
			images[data.layer]
		) : data.layer instanceof Array ? images.filter((x, i) => (data.layer as number[]).includes(i))
		: (
			<img style={{ objectPosition: `${data.offset.x}px ${data.offset.y}px` }} src={data.layer} alt="Cat" />
		);
	return toDisplay === null ? null : <article className={styles.catContainer}>{toDisplay}</article>;
};
