import { pceLink } from "@/util/util";
import styles from "./ItemImage.module.scss";
import type { Item } from "@/generated/prisma/client";
import Image from "next/image";

export const ItemImage = ({ item }: { item: Pick<Item, "customData" | "name" | "image" | "custom"> }) => {
	if (item.custom) {
		const position = `${item.customData!.model.x}px ${item.customData!.model.y}px`;
		return (
			<div className={styles.imageContainer}>
				{item.customData!.model.image ? (
					<img loading="lazy" src={pceLink(item.customData!.model.image)} className={styles.modelImage} style={{ objectPosition: position }} alt="cat" />
				) : null}
				<img loading="lazy" src={pceLink(item.image)} className={styles.itemImage} style={{ objectPosition: position }} alt={item.name} />
			</div>
		);
	} else
		return (
			<div className={styles.normalItemContainer}>
				<Image style={{ objectPosition: "center center" }} fill loading="lazy" src={pceLink(item.image)} className={styles.itemImage} alt={item.name} />
			</div>
		);
};
