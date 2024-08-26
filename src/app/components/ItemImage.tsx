import styles from "./ItemImage.module.scss";
import { Item } from "@prisma/client";

export const ItemImage = ({ item }: { item: Item }) => {
	if (item.custom) {
		const position = `${item.customData!.model.x}px ${item.customData!.model.y}px`;
		return (
			<div className={styles.imageContainer}>
				{item.customData!.model.image ? (
					<img loading="lazy" src={item.customData!.model.image} className={styles.modelImage} style={{ objectPosition: position }} alt="cat" />
				) : null}
				<img
					loading="lazy"
					src={item.image}
					className={styles.itemImage}
					style={{ objectPosition: position }}
					alt={item.name}
				/>
			</div>
		);
	} else return <img loading="lazy" src={item.image} className={styles.itemImage} alt={item.name} />;
};
