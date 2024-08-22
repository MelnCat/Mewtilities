"use client";
import { getAllItems } from "@/db/db";
import styles from "../page.module.scss";
import { NoteValue, EssenceValue, CurrencyValue } from "@/components/currencyIcons";
import { bestOffersByCurrency } from "@/util/util";
import { Item, MarketEntry, ShopEntry, QuickSellEntry, Currency } from "@prisma/client";
import useSWR from "swr";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import NextAdapterApp from "next-query-params/app";
import { QueryParamProvider, useQueryParam, StringParam, withDefault, NumberParam } from "use-query-params";
import fuzzysort from "fuzzysort";
import { useDebounce } from "use-debounce";

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
	const { data: items } = useSWR<Awaited<ReturnType<typeof getAllItems>>>(
		"/api/items",
		async () => await (await fetch("/api/items", { cache: "force-cache", next: { revalidate: 300 } })).json()
	);
	const [page, setPage] = useQueryParam("page", withDefault(NumberParam, 0));
	const [name, setName] = useState(""); // useQueryParam("name", withDefault(StringParam, ""));
	const [debouncedName] = useDebounce(name, 100);
	const nameFilteredData = useMemo(() => {
		if (!items) return null;
		if (!debouncedName.trim()) return items;
		const filtered = fuzzysort.go(debouncedName, items, { key: "name", threshold: 0.5 });
		return filtered.map(x => x.obj);
	}, [items, debouncedName]);
	useEffect(() => {
		setPage(0);
	}, [nameFilteredData, setPage]);
	return (
		<>
			<h1>Item Index</h1>
			<section className={styles.search}>
				<div className={styles.searchOption}>
					<p>Name</p>
					<input value={name} onChange={e => setName(e.target.value)} />
				</div>
				<div className={styles.searchOption}>
					<button
						disabled={nameFilteredData === null || !((page - 1) * 50 in nameFilteredData)}
						onClick={nameFilteredData && (page - 1) * 50 in nameFilteredData && setPage(x => x - 1)}
					>
						{"<"}
					</button>
					<button
						disabled={nameFilteredData === null || !((page + 1) * 50 in nameFilteredData)}
						onClick={nameFilteredData && (page + 1) * 50 in nameFilteredData && setPage(x => x + 1)}
					>
						{">"}
					</button>
				</div>
			</section>
			<article className={styles.itemList}>
				{nameFilteredData ? nameFilteredData.slice(page * 50, (page + 1) * 50).map(x => <ItemBox item={x} key={x.id} />) : "Loading..."}
			</article>
		</>
	);
};

export const ItemDisplay = () => {
	return (
		<QueryParamProvider adapter={NextAdapterApp}>
			<ItemList />
		</QueryParamProvider>
	);
};
