import { getItemData } from "@/db/db";
import styles from "./item.module.scss";
import { CurrencyValue, EssenceIcon, EssenceValue, NoteIcon, NoteValue } from "@/components/currencyIcons";
import { MarketEntry } from "@prisma/client";
import { PriceGraph } from "./components/PriceGraph";

const createHistory = (entries: MarketEntry[]) => {
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
		const c = closest ? (lastClosest === -1 || (closest.priceCount / closest.itemCount) / lastClosest < 4 ? closest.priceCount / closest.itemCount : lastClosest) : null;
		if (c && c > lastClosest) lastClosest = c;
		realTimes.push([new Date(time), c ?? realTimes.at(-1)?.[1] ?? lastPrice]);
	}
	return [times, realTimes];
};

export default async function Page({ params: { id } }: { params: { id: string } }) {
	const data = await getItemData(+id);
	if (!data) return <h1>404</h1>;
	const market = data.marketEntries.toSorted((a, b) => a.unitPrice - b.unitPrice);
	const noteMarket = market.filter(x => x.priceType === "NOTE");
	const essenceMarket = market.filter(x => x.priceType === "ESSENCE");
	const currentNoteMarket = noteMarket.filter(x => +x.expiryTime > Date.now());
	const currentEssenceMarket = essenceMarket.filter(x => +x.expiryTime > Date.now());
	const noteHistory = createHistory(noteMarket);
	const essenceHistory = createHistory(essenceMarket);

	return data ? (
		<main className={styles.main}>
			<article className={styles.leftPanel}>
				<h1>
					{id}: {data.name}
				</h1>
				<img src={data.image} className={styles.itemImage} />
				<section>
					<div>{data.key}</div>
					<div>{data.category}</div>
					<div className={styles.info}>
						{Object.entries(data.info ?? {}).map(x => (
							<p key={x[0]}>
								{x[0]}: {x[1]}
							</p>
						))}
					</div>
					{data.extraText.length ? <div>{data.extraText.join("\n")}</div> : null}
					<div className={styles.seasons}>
						{data.seasons.map(x => (
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
						<b>Historical High</b>: <NoteValue>{noteMarket.at(-1)?.unitPrice ?? "?"}</NoteValue> / <EssenceValue>{essenceMarket.at(-1)?.unitPrice ?? "?"}</EssenceValue>
					</div>
					<div className={styles.quickSell}>
						<b>Quick Sell Value</b>:{" "}
						{data.quickSellEntries.length > 0
							? data.quickSellEntries.map((x, i) => (
									<>
										{i === 0 ? "" : " / "}
										{x.priceCount === -1 ? "None" : <CurrencyValue type={x.priceType!}>{x.priceCount}</CurrencyValue>}
									</>
							  ))
							: "?"}
					</div>
					{data.shopEntries.length > 0 ? (
						<div className={styles.shopList}>
							<h2>City Shop Offers</h2>
							{data.shopEntries.map(x => (
								<p key={x.id}>
									{x.shop.name}: <CurrencyValue type={x.priceType}>{x.priceCount}</CurrencyValue>
								</p>
							))}
						</div>
					) : null}
				</section>
			</article>
			<article className={styles.rightPanel}>
				<PriceGraph data={noteHistory} />
				<PriceGraph data={essenceHistory} />
			</article>
		</main>
	) : (
		<h1>Error</h1>
	);
}
