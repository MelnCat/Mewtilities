import { getAllItems } from "@/db/db";
import styles from "./page.module.scss";
import { Currency, Item, MarketEntry, ShopEntry } from "@prisma/client";
import { CurrencyValue, EssenceValue, NoteValue } from "@/components/currencyIcons";
import { bestOffersByCurrency } from "@/util/util";

const ItemBox = ({ item }: { item: Item & { marketEntries: (MarketEntry & { unitPrice: number })[]; shopEntries: ShopEntry[] } }) => {
	const market = item.marketEntries.toSorted((a, b) => a.unitPrice - b.unitPrice);
	const noteMarket = market.filter(x => x.priceType === "NOTE");
	const essenceMarket = market.filter(x => x.priceType === "ESSENCE");
	return (
		<section className={`${styles.itemBox}${market.length === 0 ? ` ${styles.noDataBox}` : ""}`}>
			<p className={styles.itemId}>{item.id}</p>
			<h2>{item.name}</h2>
			<a href={`/item/${item.id}`}>
				<img src={item.image} loading="lazy" />
			</a>
			<div className={styles.lower}>
				<b>Current Cheapest: </b>
				<p>
					<NoteValue>{noteMarket[0]?.unitPrice ?? "?"}</NoteValue> / <EssenceValue>{essenceMarket[0]?.unitPrice ?? "?"}</EssenceValue>
				</p>
				{item.shopEntries.length > 0 ? (
					<>
						<b>City Shops:</b>
						{bestOffersByCurrency(item.shopEntries).map(x => (
							<p key={x[0]}>
								<CurrencyValue type={x[0] as Currency}>{x[1]}</CurrencyValue>
							</p>
						))}
					</>
				) : null}
			</div>
			<div className={styles.recordCount}>{market.length} Records</div>
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
