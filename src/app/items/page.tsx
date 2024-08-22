import { getAllItems } from "@/db/db";
import styles from "./page.module.scss";
import { Currency, Item, MarketEntry, QuickSellEntry, ShopEntry } from "@prisma/client";
import { CurrencyValue, EssenceValue, NoteValue } from "@/components/currencyIcons";
import { bestOffersByCurrency } from "@/util/util";
import { ItemList } from "./components/ItemList";


export default async function ItemsPage() {
	return (
		<main className={styles.main}>
			<ItemList />
		</main>
	);
}
