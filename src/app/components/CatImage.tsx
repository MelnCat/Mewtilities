import styles from "./CatImage.module.scss";
import { PartialCatGene, deserializeCatGene, textureFromGene } from "@/util/cat";

export const CatImage = (data: { gene: string } | { gene: PartialCatGene } | { images: string[]; offset: { x: number; y: number } }) => {
	if ("gene" in data) {
		if (typeof data.gene === "string") {
			const test = deserializeCatGene(data.gene);
			if (test.ok) return <CatImage gene={test.data} />;
			return <p>{test.message}</p>;
		}
		const processed = textureFromGene("adult", "upsidedown", "content", data.gene);
		return <CatImage images={processed.images} offset={processed.offset} />;
	}
	return (
		<article className={styles.catContainer}>
			{data.images.map(x => (
				<img style={{ objectPosition: `${data.offset.x}px ${data.offset.y}px` }} key={x} src={x} alt="Cat" />
			))}
		</article>
	);
};
