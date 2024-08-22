"use client";
import { CurrencyValue, EssenceValue, NoteValue } from "@/components/currencyIcons";
import { getAllItems } from "@/db/db";
import { bestOffersByCurrency } from "@/util/util";
import { Currency, Item, MarketEntry, QuickSellEntry, ShopEntry } from "@prisma/client";
import fuzzysort from "fuzzysort";
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useMemo } from "react";
import * as R from "remeda";
import useSWR from "swr";
import styles from "../page.module.scss";

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

type PopulatedItem = Awaited<ReturnType<typeof getAllItems>>[number];

const lowestForCurrency = (currency: Currency) => (item: PopulatedItem, asc: boolean) => {
	const entries = item.marketEntries.filter(x => x.priceType === currency);
	if (!entries.length) return asc ? Infinity : -Infinity;
	return entries.reduce((l, c) => (c.unitPrice < l ? c.unitPrice : l), Infinity);
};
const lowestForCurrencyCity = (currency: Currency) => (item: PopulatedItem, asc: boolean) => {
	const entries = item.shopEntries.filter(x => x.priceType === currency);
	if (!entries.length) return asc ? Infinity : -Infinity;
	return entries.reduce((l, c) => (c.priceCount < l ? c.priceCount : l), Infinity);
};

const itemKeys = {
	id: item => item.id,
	name: item => item.name.toLocaleLowerCase(),
	category: item => item.category,
	marketPriceNotes: lowestForCurrency(Currency.NOTE),
	marketPriceEssence: lowestForCurrency(Currency.ESSENCE),
	quickSellPrice: (item, asc) =>
		item.quickSellEntries.length === 0 || item.quickSellEntries.every(x => x.priceCount === -1)
			? asc
				? Infinity
				: -Infinity
			: item.quickSellEntries.reduce((l, c) => (c.priceCount !== -1 && c.priceCount < l ? c.priceCount : l), Infinity),
	cityPriceNotes: lowestForCurrencyCity(Currency.NOTE),
	cityPriceEssence: lowestForCurrencyCity(Currency.ESSENCE),
	records: item => item.marketEntries.length
} as const satisfies Record<string, (item: PopulatedItem, asc: boolean) => string | number>;

export const ItemList = () => {
	const { data: rawItems } = useSWR<PopulatedItem[]>("/api/items", async () => await (await fetch("/api/items", { cache: "force-cache", next: { revalidate: 300 } })).json());
	const items = useMemo(() => rawItems?.map(x => ({ ...x, prepared: fuzzysort.prepare(x.name) })), [rawItems]);
	const [category, setCategory] = useQueryState("category", parseAsString.withDefault("all"));
	const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(0));
	const [perPage, setPerPage] = useQueryState("per_page", parseAsInteger.withDefault(250));
	const [name, setName] = useQueryState("name", parseAsString.withDefault(""));
	const [sortBy, setSortBy] = useQueryState("sort_by", parseAsStringLiteral(Object.keys(itemKeys) as (keyof typeof itemKeys)[]).withDefault("id"));
	const [sortOrder, setSortOrder] = useQueryState("sort_order", parseAsStringLiteral(["asc", "desc"]).withDefault("asc"));
	const itemCategories = useMemo(() => {
		return items ? [...new Set(items.map(x => x.category))].sort((a, b) => a.localeCompare(b)) : [];
	}, [items]);

	const presortData = useMemo(() => {
		if (!items) return null;
		return items.filter(x => category === "all" || x.category === category);
	}, [items, category]);
	const nameFilteredData = useMemo(() => {
		if (!presortData) return null;
		if (!name?.trim()) return presortData;
		const filtered = fuzzysort.go(name, presortData, { key: "prepared", threshold: 0.5 });
		return filtered.map(x => x.obj);
	}, [presortData, name]);
	const finalData = useMemo(() => {
		if (!nameFilteredData) return null;
		return nameFilteredData.toSorted((a, b) => {
			const first = itemKeys[sortBy](a, sortOrder === "asc");
			const second = itemKeys[sortBy](b, sortOrder === "asc");
			if (typeof first === "string" && typeof second === "string") return sortOrder === "asc" ? first.localeCompare(second) : second.localeCompare(first);
			if (typeof first === "number" && typeof second === "number") return sortOrder === "asc" ? first - second : second - first;
			return 0;
		});
	}, [nameFilteredData, sortBy, sortOrder]); 
	useEffect(() => {
		setPage(0);
	}, [setPage, name, perPage, sortBy, sortOrder, category]);
	const paginatedData = useMemo(() => {
		return finalData
			? R.chunk(
					finalData.map(x => <ItemBox item={x} key={x.id} />),
					perPage
			  )
			: [];
	}, [finalData, perPage]);
	return (
		<>
			<h1>Item Index</h1>
			<section className={styles.search}>
				<div className={styles.searchOption}>
					<p>Name</p>
					<input value={name} onChange={e => setName(e.target.value)} />
				</div>
				<div className={styles.searchOption}>
					<p>Items Per Page</p>
					<input value={perPage} onChange={e => setPerPage(+e.target.value)} />
				</div>
				<div className={styles.searchOption}>
					<p>Sort By</p>
					<select value={sortBy} onChange={e => setSortBy(e.target.value as keyof typeof itemKeys)}>
						{Object.keys(itemKeys).map(k => (
							<option value={k} key={k}>
								{k}
							</option>
						))}
					</select>
					<select value={sortOrder} onChange={e => setSortOrder(e.target.value as "desc" | "asc")}>
						<option value="asc">ASC</option>
						<option value="desc">DESC</option>
					</select>
				</div>
				<div className={styles.searchOption}>
					<p>Category</p>
					<select
						value={category}
						onChange={e => {
							setCategory(e.target.value);
						}}
					>
						<option value="all">all</option>
						{itemCategories.map(k => (
							<option value={k} key={k}>
								{k}
							</option>
						))}
					</select>
				</div>
				<div className={styles.searchOption}>
					<button disabled={!(page - 1 in paginatedData)} onClick={() => page - 1 in paginatedData && setPage(page - 1)}>
						{"<"}
					</button>
					<button disabled={!(page + 1 in paginatedData)} onClick={() => page + 1 in paginatedData && setPage(page + 1)}>
						{">"}
					</button>
					<p>
						Page {finalData ? (!rawItems || paginatedData.length === 0 ? 0 : page + 1) : 1}/{paginatedData.length}
					</p>
				</div>
				<div className={styles.searchOption}></div>
			</section>
			<article className={styles.itemList}>{finalData ? paginatedData[page] : "Loading..."}</article>
		</>
	);
};

export const ItemDisplay = () => {
	return <ItemList />;
};
