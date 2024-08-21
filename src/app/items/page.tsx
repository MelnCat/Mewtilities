import { getAllItems } from "@/db/db";
import styles from "./page.module.scss";
import { Item, MarketEntry } from "@prisma/client";
import { EssenceValue, NoteValue } from "@/components/currencyIcons";

const ItemBox = ({ item }: { item: Item & { marketEntries: (MarketEntry & { unitPrice: number })[] } }) => {
	const market = item.marketEntries.toSorted((a, b) => a.unitPrice - b.unitPrice);
	const noteMarket = market.filter(x => x.priceType === "NOTE");
	const essenceMarket = market.filter(x => x.priceType === "ESSENCE");
	return (
		<section className={`${styles.itemBox}${market.length === 0 ? ` ${styles.noDataBox}` : ""}`}>
			<p className={styles.itemId}>{item.id}</p>
			<h2>
				{item.name}
			</h2>
			<a href={`/item/${item.id}`}><img src={item.image} /></a>
			<div className={styles.lower}>
				<b>Current Cheapest: </b>
				<NoteValue>{noteMarket[0]?.unitPrice ?? "?"}</NoteValue> / <EssenceValue>{essenceMarket[0]?.unitPrice ?? "?"}</EssenceValue>
			</div>
			<div className={styles.recordCount}>
				{market.length} Records
			</div>
		</section>
	);
};

export default async function ItemsPage() {
	const items = await getAllItems();
	return (
		<main className={styles.main}>
			<h1>Item Index</h1>
			<article className={styles.itemList}>
				{items.map(x => (
					<ItemBox item={x} key={x.id} />
				))}
			</article>
		</main>
	);
}
