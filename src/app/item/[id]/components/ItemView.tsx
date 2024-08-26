import { getItemData } from "@/db/db";
import styles from "../item.module.scss";
import { CurrencyValue, EssenceIcon, EssenceValue, NoteIcon, NoteValue } from "@/components/currencyIcons";
import { Currency, MarketEntry } from "@prisma/client";
import { PriceGraph } from "./PriceGraph";
import { getCheapestEntries, getCheapestNote } from "@/db/dbUtil";
import Link from "next/link";
import { getNestorSources } from "@/util/nestor";
import { smallNumberFormat } from "@/util/util";
import { ItemImage } from "@/app/components/ItemImage";

const createHistory = (entries: { creationTime: Date; expiryTime: Date; itemCount: number; priceCount: number }[]) => {
	if (entries.length === 0) return [[], []];
	const dateSorted = entries.toSorted((a, b) => +a.creationTime - +b.creationTime);
	const begin = +dateSorted[0].creationTime;
	const end = Math.min(Date.now(), +dateSorted.at(-1)!.expiryTime);
	const slices = 50;
	let lastPrice = -1;
	const times: [Date, number][] = [];
	const realTimes: [Date, number][] = [];
	let lastClosest = -1;
	for (let i = 0; i <= slices; i++) {
		const time = begin + ((end - begin) / slices) * i;
		const valid = dateSorted.filter(x => +x.creationTime <= time && time <= +x.expiryTime);
		const lowest = valid.length ? valid.reduce((l, c) => (l > c.priceCount / c.itemCount ? c.priceCount / c.itemCount : l), Infinity) : lastPrice;
		const price = lastPrice !== -1 && lowest > lastPrice * 2 ? lastPrice : lowest;
		lastPrice = price;
		times.push([new Date(time), price]);
		const closest = dateSorted.findLast(x => +x.creationTime <= time);
		const c = closest ? (lastClosest === -1 || closest.priceCount / closest.itemCount / lastClosest < 4 ? closest.priceCount / closest.itemCount : lastClosest) : null;
		if (c && c > lastClosest) lastClosest = c;
		realTimes.push([new Date(time), c ?? realTimes.at(-1)?.[1] ?? lastPrice]);
	}
	return [times, realTimes];
};

export const ItemView = async({ item }: { item: Awaited<ReturnType<typeof getItemData>> }) => {
	const nestor = await getNestorSources();
	if (!item) return <h1>404</h1>;
	const market = item.marketEntries.toSorted((a, b) => a.unitPrice - b.unitPrice);
	const noteMarket = market.filter(x => x.priceType === "NOTE");
	const essenceMarket = market.filter(x => x.priceType === "ESSENCE");
	const currentNoteMarket = noteMarket.filter(x => +x.expiryTime > Date.now());
	const currentEssenceMarket = essenceMarket.filter(x => +x.expiryTime > Date.now());
	const individualMarket = item.marketEntries.toSorted((a, b) => a.priceCount - b.priceCount);
	const individualNoteMarket = individualMarket.filter(x => x.priceType === "NOTE");
	const individualEssenceMarket = individualMarket.filter(x => x.priceType === "ESSENCE");
	const individualCurrentNoteMarket = individualNoteMarket.filter(x => +x.expiryTime > Date.now());
	const individualCurrentEssenceMarket = individualEssenceMarket.filter(x => +x.expiryTime > Date.now());
	const noteHistory = createHistory(noteMarket);
	const essenceHistory = createHistory(essenceMarket);

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
						<div className={styles.info}>
							{Object.entries(item.info ?? {}).map(x => (
								<p key={x[0]}>
									{x[0]}: {x[1]}
								</p>
							))}
						</div>
						{item.extraText.length ? <div>{item.extraText.join("\n")}</div> : null}
						<div className={styles.seasons}>
							{item.seasons.map(x => (
								<p data-season={x} key={x}>
									{x}
								</p>
							))}
						</div>
						<div>{market.length} Records</div>
						<hr />
						<div>
							<b>Current Low</b>: <NoteValue>{currentNoteMarket[0]?.unitPrice ?? "?"}</NoteValue> /{" "}
							<EssenceValue>{currentEssenceMarket[0]?.unitPrice ?? "?"}</EssenceValue>
						</div>
						<div>
							<b>Current High</b>: <NoteValue>{currentNoteMarket.at(-1)?.unitPrice ?? "?"}</NoteValue> /{" "}
							<EssenceValue>{currentEssenceMarket.at(-1)?.unitPrice ?? "?"}</EssenceValue>
						</div>
						<div>
							<b>Historical Low</b>: <NoteValue>{noteMarket[0]?.unitPrice ?? "?"}</NoteValue> / <EssenceValue>{essenceMarket[0]?.unitPrice ?? "?"}</EssenceValue>
						</div>
						<div>
							<b>Historical High</b>: <NoteValue>{noteMarket.at(-1)?.unitPrice ?? "?"}</NoteValue> /{" "}
							<EssenceValue>{essenceMarket.at(-1)?.unitPrice ?? "?"}</EssenceValue>
						</div>
						<div>
							<b>Current Individual Low</b>: <NoteValue>{individualCurrentNoteMarket[0]?.priceCount ?? "?"}</NoteValue> /{" "}
							<EssenceValue>{individualCurrentEssenceMarket[0]?.priceCount ?? "?"}</EssenceValue>
						</div>
						<div>
							<b>Historical Individual Low</b>: <NoteValue>{individualNoteMarket[0]?.priceCount ?? "?"}</NoteValue> /{" "}
							<EssenceValue>{individualEssenceMarket[0]?.priceCount ?? "?"}</EssenceValue>
						</div>
						<div className={styles.quickSell}>
							<b>Quick Sell Value</b>:{" "}
							{item.quickSellEntries.length > 0
								? item.quickSellEntries.map((x, i) => (
										<>
											{i === 0 ? "" : " / "}
											{x.priceCount === -1 ? "None" : <CurrencyValue type={x.priceType!}>{x.priceCount}</CurrencyValue>}
										</>
								  ))
								: "?"}
						</div>
						<h1>Sources</h1>
						{item.shopEntries.length > 0 ? (
							<div className={styles.shopList}>
								<h2>City Shop Offers</h2>
								{item.shopEntries.map(x => (
									<p key={x.id}>
										{x.shop.name}: <CurrencyValue type={x.priceType}>{x.priceCount}</CurrencyValue>
									</p>
								))}
							</div>
						) : null}
						{item.info && "gift_nestor" in (item.info as object) ? (
							<p>Gift from Nestor: {smallNumberFormat.format((0.2 / nestor[(item.info as { gift_nestor: string }).gift_nestor].length) * 100)}%</p>
						) : null}
						{item.id === 118 /*heartof nestor*/ ? <p>Gift from Nestor: 1%</p> : null}
					</section>
				</article>
				<article className={styles.rightPanel}>
					<PriceGraph data={noteHistory} />
					<PriceGraph data={essenceHistory} />
				</article>
			</section>
			<section className={styles.rest}>
				{item.recipe ? (
					<div className={styles.recipe}>
						<h2>Recipe</h2>
						<p>Type: {item.recipe.category}</p>
						<div className={styles.recipeRow}>
							{item.recipe.ingredients
								.map(x => ({ item: x.item as typeof item, count: x.count }))
								.concat({ item: item, count: item.recipe.resultCount })
								.map((x, i, a) => {
									const cheapest = getCheapestEntries(x.item.marketEntries);
									const cheapestNote =
										i === a.length - 1
											? a
													.slice(0, -1)
													.map(y => getCheapestNote(y.item) * y.count)
													.map(y => (isFinite(y) ? y : 0))
													.reduce((l, c) => l + c)
											: getCheapestNote(x.item);
									return (
										<>
											{i !== 0 ? (
												<p className={styles.operator} key={i}>
													{i === a.length - 1 ? "=" : "+"}
												</p>
											) : null}
											<section className={styles.ingredientBox} key={x.item.id}>
												<h4>
													{x.count} {x.item.name}
												</h4>
												<Link href={`/item/${x.item.id}`}>
													<img src={x.item.image} className={styles.icon} />
												</Link>
												{isFinite(cheapestNote) ? (
													<div className={styles.ingredientPrice}>
														<b>Total Cost</b>:
														<span className={styles.value}>
															<NoteValue>{cheapestNote * x.count}</NoteValue>
														</span>
													</div>
												) : null}
												{cheapest ? (
													<div className={styles.ingredientPrice}>
														<b>OM</b>:
														<span className={styles.value}>
															<NoteValue>{cheapest.find(x => x.priceType === Currency.NOTE)?.priceCount ?? "?"}</NoteValue>
															<span className={styles.slash}>/</span>
															<EssenceValue>{cheapest.find(x => x.priceType === Currency.ESSENCE)?.priceCount ?? "?"}</EssenceValue>
														</span>
													</div>
												) : null}
												{x.item.shopEntries.length > 0 ? (
													<div className={styles.ingredientPrice}>
														<b>CS</b>:{" "}
														<span className={styles.value}>
															{x.item.shopEntries.map((y, j) => (
																<p key={j}>
																	<CurrencyValue type={y.priceType}>{y.priceCount}</CurrencyValue>
																</p>
															))}
														</span>
													</div>
												) : null}
											</section>
										</>
									);
								})}
						</div>
					</div>
				) : null}
			</section>
		</main>
	);
};
