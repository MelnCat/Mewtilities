"use client";
import { getAllItems } from "@/db/db";
import styles from "../page.module.scss";
import { NoteValue, EssenceValue, CurrencyValue } from "@/components/currencyIcons";
import { bestOffersByCurrency } from "@/util/util";
import { Item, MarketEntry, ShopEntry, QuickSellEntry, Currency } from "@prisma/client";
import useSWR from "swr";

const ItemBox = ({ item }: { item: Item & { marketEntries: (MarketEntry & { unitPrice: number })[]; shopEntries: ShopEntry[]; quickSellEntries: QuickSellEntry[] } }) => {
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
				{item.quickSellEntries.some(x => x.priceCount !== -1) ? (
					<>
						<b>Quick Sell Value:</b>
						<p>
							{item.quickSellEntries.map((x, i) => (
								<span key={x.id}>
									{i === 0 ? "" : " / "}
									{x.priceCount === -1 ? "None" : <CurrencyValue type={x.priceType!}>{x.priceCount}</CurrencyValue>}
								</span>
							))}
						</p>
					</>
				) : null}
			</div>
			<div className={styles.recordCount}>{market.length} Records</div>
		</section>
	);
};

export const ItemList = () => {
	const { data: items } = useSWR<Awaited<ReturnType<typeof getAllItems>>>("/api/items", async () => await (await fetch("/api/items", { cache: "force-cache", next: { revalidate: 300 } })).json());
	return (
		<>
			<h1>Item Index</h1>
			<article className={styles.itemList}>{items && items.map(x => <ItemBox item={x} key={x.id} />)}</article>
		</>
	);
};
