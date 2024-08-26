"use client";
import { useMemo, useState } from "react";
import styles from "../item.module.scss";
import { PartialCatGene, randomCatTexture, textureFromGene } from "@/util/cat";
import { sample } from "remeda";

const allowedSpecies = {
	custom_clothing_global: ["C", "M"],
	custom_clothing_c: ["C"],
	custom_clothing_m: ["M"]
}

export const CustomItemPreview = ({ image, model, name, category }: { image: string; model?: string; name: string; category: string; }) => {
	const [catTexture, setCatTexture] = useState<{ images: string[] } | null>();
	const allowedTypes = allowedSpecies[category as keyof typeof allowedSpecies] as string[] | null;
	return (
		<div className={styles.customPreview}>
			<div className={styles.spriteSheetContainer}>
				<div className={styles.modelContainer}>
					{catTexture ? catTexture.images.map(x => <img key={x} src={x} alt="Random Cat" />) : model ? <img src={model} alt="Model" /> : null}
				</div>
				<img src={image} alt={name} />
			</div>
			{allowedTypes? <button onClick={() => setCatTexture(randomCatTexture(sample(allowedTypes, 1)[0]))}>Randomize Cat</button> : null}
		</div>
	);
};
