import { getItemData } from "@/db/db";
import styles from "./item.module.scss";
import { EssenceIcon, EssenceValue, NoteIcon, NoteValue } from "@/components/currencyIcons";
import { MarketEntry } from "@prisma/client";

const createHistory = (entries: MarketEntry[]) => {
	const dateSorted = entries.toSorted((a, b) => (+a.creationTime) - (+b.creationTime));
	const begin = +dateSorted[0].creationTime;
	const end = Math.min(Date.now(), +dateSorted.at(-1)!.expiryTime);
	const slices = 10;
	let lastPrice = -1;
	const times: [Date, number][] = [];
	for (let i = 0; i <= slices; i++) {
		const time = begin + (end - begin) / slices * i;
		const valid = dateSorted.filter(x => +x.creationTime <= time && time <= +x.expiryTime);
		const lowest = valid.length ? valid.reduce((l, c) => l > (c.priceCount / c.itemCount) ? c.priceCount / c.itemCount : l, Infinity) : lastPrice;
		const price = lastPrice !== -1 && lowest > lastPrice * 2 ? lastPrice : lowest;
		lastPrice = price;
		times.push([new Date(time), price]);
	}
	return times;
}

export default async function Page({ params: { id } }: { params: { id: string } }) {
	const data = await getItemData(+id);
	if (!data) return <h1>404</h1>;
	const market = data.marketEntries.toSorted((a, b) => a.unitPrice - b.unitPrice);
	const noteMarket = market.filter(x => x.priceType === "NOTE");
	const essenceMarket = market.filter(x => x.priceType === "ESSENCE");
	const noteHistory = createHistory(noteMarket);

	return data ? (
		<main className={styles.main}>
			<h1>
				{id}: {data.name}
			</h1>
			<img src={data.image} className={styles.itemImage} />
			{market.length}
			<section>
				<div>
					<b>Historical Low (N)</b>: <NoteValue>{noteMarket[0].unitPrice}</NoteValue>
				</div>
				<div>
					<b>Historical Low (E)</b>: <EssenceValue>{essenceMarket[0].unitPrice}</EssenceValue>
				</div>
				<div>temp {noteHistory.map(x => x[1]).join(" ")}</div>
			</section>
		</main>
	) : (
		<h1>Error</h1>
	);
}
