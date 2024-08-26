import { ItemImage } from "@/app/components/ItemImage";
import { getItemData } from "@/db/db";
import styles from "../item.module.scss";
import { CustomItemPreview } from "./CustomItemPreview";

export const CustomItemView = async ({ item }: { item: Awaited<ReturnType<typeof getItemData>> }) => {
	if (!item) return null;
	const data = item?.customData!;
	return (
		<main className={styles.main}>
			<section className={styles.topContainer}>
				<article className={styles.leftPanel}>
					<h1>
						{item.id}: {item.name}
					</h1>
					<ItemImage item={item} />
					<section>
						<div>{item.key}</div>
						<div>{item.category}</div>
						<div>
							Author: <a href={`https://www.pixelcatsend.com/profile&id=${data.author.id}`}>@{data.author.name}</a> [{data.author.id}]
						</div>
						{item.extraText.length ? <div>{item.extraText.join("\n")}</div> : null}
						<hr />
					</section>
				</article>
				<article className={styles.rightPanel}>
					<CustomItemPreview image={item.image} model={data.model.image} name={item.name} category={item.category} />
				</article>
			</section>
		</main>
	);
};
