"use client";
import { randomCatTexture } from "@/util/cat";
import { useState } from "react";
import { sample } from "remeda";
import styles from "../item.module.scss";
import { pceLink } from "@/util/util";

const allowedSpecies = {
	custom_clothing_global: ["C", "M"],
	custom_clothing_c: ["C"],
	custom_clothing_m: ["M"],
};

export const CustomItemPreview = ({ image, model, name, category }: { image: string; model?: string; name: string; category: string }) => {
	const [catTexture, setCatTexture] = useState<{ images: (string | null)[] } | null>();
	const allowedTypes = allowedSpecies[category as keyof typeof allowedSpecies] as ("C" | "M")[] | null;
	return (
		<div className={styles.customPreview}>
			<div className={styles.spriteSheetContainer}>
				<div className={styles.modelContainer}>
					{catTexture ? catTexture.images.map(x => x ? <img key={x} src={pceLink(x)} alt="Random Cat" /> : null) : model ? <img src={model} alt="Model" /> : null}
				</div>
				<img src={image} alt={name} />
			</div>
			{allowedTypes ? <button onClick={() => setCatTexture(randomCatTexture(sample(allowedTypes, 1)[0]))}>Randomize Cat</button> : null}
		</div>
	);
};
