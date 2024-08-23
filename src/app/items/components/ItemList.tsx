"use client";
import { CurrencyValue, EssenceValue, NoteValue } from "@/components/currencyIcons";
import { getAllItems, ProcessedItem } from "@/db/db";
import { bestOffersByCurrency } from "@/util/util";
import { Currency, Item, MarketEntry, QuickSellEntry, ShopEntry } from "@prisma/client";
import fuzzysort from "fuzzysort";
import { parseAsInteger, parseAsBoolean, parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useMemo } from "react";
import * as R from "remeda";
import useSWR from "swr";
import styles from "../page.module.scss";
import Link from "next/link";

const ItemBox = ({ item }: { item: ProcessedItem }) => {
	return (
		<section className={`${styles.itemBox}${item.records === 0 ? ` ${styles.noDataBox}` : ""}`}>
			<p className={styles.itemId}>{item.id}</p>
			<h2>{item.name}</h2>
			<Link href={`/item/${item.id}`}>
				<img src={item.image} loading="lazy" />
			</Link>
			<div className={styles.lower}>
				<b>Current Cheapest: </b>
				<p>
					<NoteValue>{item.cheapestMarketEntries.find(x => x.priceType === Currency.NOTE)?.priceCount ?? "?"}</NoteValue> /{" "}
					<EssenceValue>{item.cheapestMarketEntries.find(x => x.priceType === Currency.ESSENCE)?.priceCount ?? "?"}</EssenceValue>
				</p>
				{item.cityOffers.length > 0 ? (
					<>
						<b>City Shops:</b>
						{item.cityOffers.map(x => (
							<p key={`${x.priceType}/${x.priceCount}`}>
								<CurrencyValue type={x.priceType}>{x.priceCount}</CurrencyValue>
							</p>
						))}
					</>
				) : null}
				{item.quickSell?.some(x => x !== null) ? (
					<>
						<b>Quick Sell Value:</b>
						<p>
							{item.quickSell.map((x, i) => (
								<span key={`${x?.priceType}_${x?.priceCount}`}>
									{i === 0 ? "" : " / "}
									{x === null ? "None" : <CurrencyValue type={x.priceType}>{x.priceCount}</CurrencyValue>}
								</span>
							))}
						</p>
					</>
				) : null}
				{item.craftable ? <p>Craftable</p> : null}
			</div>
			<div className={styles.spacer} />
			<div className={styles.recordCount}>{item.records} Records</div>
		</section>
	);
};

const lowestForCurrency = (currency: Currency) => (item: ProcessedItem, asc: boolean) => {
	return item.cheapestMarketEntries.find(x => x.priceType === currency)?.priceCount ?? (asc ? Infinity : -Infinity);
};
const lowestForCurrencyCity = (currency: Currency) => (item: ProcessedItem, asc: boolean) => {
	return item.cityOffers.find(x => x.priceType === currency)?.priceCount ?? (asc ? Infinity : -Infinity);
};

const itemKeys = {
	id: item => item.id,
	name: item => item.name.toLocaleLowerCase(),
	category: item => item.category,
	marketPriceNotes: lowestForCurrency(Currency.NOTE),
	marketPriceEssence: lowestForCurrency(Currency.ESSENCE),
	quickSellPrice: (item, asc) => item.quickSell?.find(x => x !== null)?.priceCount ?? (asc ? Infinity : -Infinity),
	cityPriceNotes: lowestForCurrencyCity(Currency.NOTE),
	cityPriceEssence: lowestForCurrencyCity(Currency.ESSENCE),
	records: item => item.records,
} as const satisfies Record<string, (item: ProcessedItem, asc: boolean) => string | number>;

export const ItemList = () => {
	const { data: rawItems } = useSWR<ProcessedItem[]>("/api/items", async () => await (await fetch("/api/items", { cache: "force-cache", next: { revalidate: 300 } })).json());
	const items = useMemo(() => rawItems?.map(x => ({ ...x, prepared: fuzzysort.prepare(x.name) })), [rawItems]);
	const [category, setCategory] = useQueryState("category", parseAsString.withDefault("all"));
	const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(0));
	const [perPage, setPerPage] = useQueryState("per_page", parseAsInteger.withDefault(250));
	const [name, setName] = useQueryState("name", parseAsString.withDefault(""));
	const [sortBy, setSortBy] = useQueryState("sort_by", parseAsStringLiteral(Object.keys(itemKeys) as (keyof typeof itemKeys)[]).withDefault("id"));
	const [sortOrder, setSortOrder] = useQueryState("sort_order", parseAsStringLiteral(["asc", "desc"]).withDefault("asc"));
	const [craftable, setCraftable] = useQueryState("craftable_only", parseAsBoolean.withDefault(false));
	const itemCategories = useMemo(() => {
		return items ? [...new Set(items.map(x => x.category))].sort((a, b) => a.localeCompare(b)) : [];
	}, [items]);

	const presortData = useMemo(() => {
		if (!items) return null;
		return items.filter(x => category === "all" || x.category === category).filter(x => !craftable || x.craftable);
	}, [items, category, craftable]);
	const nameFilteredData = useMemo(() => {
		if (!presortData) return null;
		if (!name?.trim()) return presortData;
		const filtered = fuzzysort.go(name, presortData, { key: "prepared", threshold: 0.4 });
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
					<p>Craftable</p>
					<input type="checkbox" checked={craftable} onChange={() => setCraftable(!craftable)} />
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
