import { ItemDisplay } from "./components/ItemList";
import styles from "./page.module.scss";


export default async function ItemsPage() {
	return (
		<main className={styles.main}>
			<ItemDisplay />
		</main>
	);
}
