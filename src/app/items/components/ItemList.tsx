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
import { ItemImage } from "@/app/components/ItemImage";

const ItemBox = ({ item }: { item: ProcessedItem }) => {
	return (
		<section className={`${styles.itemBox}${item.records === 0 && !item.custom ? ` ${styles.noDataBox}` : ""}`}>
			<p className={styles.itemId}>{item.id}</p>
			<h2>{item.name}</h2>
			<Link href={`/item/${item.id}`}>
				<ItemImage item={item} />
			</Link>
			{item.custom ? (
				<div className={styles.lower}>
					<p>
						Author: <b>{item.customData!.author.name}</b> ({item.customData!.author.id})
					</p>
				</div>
			) : (
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
			)}
			{item.info && typeof item.info === "object" ? (
				<div className={styles.itemInfo}>
					{Object.entries(item.info).map(([k, v]) => (
						<p key={k}>
							{k}: {String(v)}
						</p>
					))}
				</div>
			) : null}
			<div className={styles.itemCategory}>{item.category}</div>
			<div className={styles.spacer} />
			<div className={styles.recordCount}>{item.custom ? item.extraText.join("\n").replace(/by @.+$/, "") : `${item.records} Records`}</div>
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
	customAuthor: (item, asc) => item.custom ? item.customData!.author.id : (asc ? Infinity : -Infinity),
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
	const [craftable, setCraftable] = useQueryState("craftable", parseAsBoolean.withDefault(false));
	const [infoKey, setInfoKey] = useQueryState("info_key", parseAsString.withDefault("-"));
	const [infoValue, setInfoValue] = useQueryState("info_val", parseAsString.withDefault("-"));
	const [type, setType] = useQueryState("type", parseAsStringLiteral(["all", "official", "custom"]).withDefault("all"));
	const [customAuthor, setCustomAuthor] = useQueryState("custom_author", parseAsString.withDefault("-"));
	const itemCategories = useMemo(() => {
		return items ? [...new Set(items.map(x => x.category))].sort((a, b) => a.localeCompare(b)) : [];
	}, [items]);
	const itemInfoKeys = useMemo(() => {
		return items
			? [...new Set(items.flatMap(x => (x.info && typeof x.info === "object" ? Object.keys(x.info) : [])))]
					.sort((a, b) => a.localeCompare(b))
					.filter(x => infoValue === "-" || items.some(y => y.info[x] === infoValue))
			: [];
	}, [items, infoValue]);
	const itemInfoValues = useMemo(() => {
		return items
			? [...new Set(items.flatMap(x => (x.info && typeof x.info === "object" ? Object.values(x.info) : [])))]
					.map(x => String(x))
					.sort((a, b) => a.localeCompare(b))
					.filter(x => infoKey === "-" || items.some(y => y.info[infoKey] === x))
			: [];
	}, [items, infoKey]);
	const customItemAuthors = useMemo(() => {
		return items
			? [
					...new Set(
						items
							.map(x => x.customData?.author.id)
							.filter(x => x !== undefined)
							.map(x => items.find(y => y.customData?.author.id === x)!.customData!.author.name)
					),
			  ].sort((a, b) => a.localeCompare(b))
			: [];
	}, [items]);

	const presortData = useMemo(() => {
		if (!items) return null;
		const author = customAuthor !== "-" ? items.find(x => x.customData?.author.name === customAuthor)?.customData!.author.id : null;
		return items
			.filter(x => type === "all" || (type === "custom" && x.custom) || (type === "official" && !x.custom))
			.filter(x => category === "all" || x.category === category)
			.filter(x => !craftable || x.craftable)
			.filter(x => infoKey === "-" || (x.info !== null && typeof x.info === "object" && infoKey in x.info))
			.filter(x => infoValue === "-" || (x.info !== null && typeof x.info === "object" && Object.values(x.info).includes(infoValue)))
			.filter(x => !author || x.customData?.author.id === author);
	}, [items, type, category, craftable, infoKey, infoValue, customAuthor]);
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
					<p>Info Key</p>
					<select
						value={infoKey}
						onChange={e => {
							setInfoKey(e.target.value);
						}}
					>
						<option value="-">-</option>
						{itemInfoKeys.map(k => (
							<option value={k} key={k}>
								{k}
							</option>
						))}
					</select>
				</div>
				<div className={styles.searchOption}>
					<p>Info Value</p>
					<select
						value={infoValue}
						onChange={e => {
							setInfoValue(e.target.value);
						}}
					>
						<option value="-">-</option>
						{itemInfoValues.map(k => (
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
					<p>Type</p>
					<select value={type} onChange={e => setType(e.target.value as "all" | "official" | "custom")}>
						<option value="all">All</option>
						<option value="official">Official</option>
						<option value="custom">Custom</option>
					</select>
				</div>
				<div className={styles.searchOption}>
					<p>Custom Item Author</p>
					<select
						value={customAuthor}
						onChange={e => {
							setCustomAuthor(e.target.value);
						}}
					>
						<option value="-">-</option>
						{customItemAuthors.map(k => (
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
