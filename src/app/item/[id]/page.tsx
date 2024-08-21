import { getItemData } from "@/db/db";
import styles from "./item.module.scss";
import { EssenceIcon, NoteIcon } from "@/components/currencyIcons";

export default async function Page({ params: { id } }: { params: { id: string } }) {
	const data = await getItemData(+id);
	if (!data) return <h1>404</h1>;
	const market = data.marketEntries;
	const noteMarket = market.filter(x => x.priceType === "NOTE");
	const essenceMarket = market.filter(x => x.priceType === "ESSENCE");

	return data ? (
		<main className={styles.main}>
			<h1>
				{id}: {data.name}
			</h1>
			<img src={data.image} />
			{market.length}
			<section>
				<div>
					<b>Historical Low (N)</b>: {noteMarket.reduce((l, c) => (c.unitPrice < l ? c.unitPrice : l), Infinity)} <NoteIcon />
				</div>
				<div>
					<b>Historical Low (E)</b>: {essenceMarket.reduce((l, c) => (c.unitPrice < l ? c.unitPrice : l), Infinity)} <EssenceIcon />
				</div>
			</section>
		</main>
	) : (
		<h1>Error</h1>
	);
}
