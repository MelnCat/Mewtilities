import { test } from "@/db/db";
import styles from "./page.module.scss";

export default async function Home() {
	const number = await test();
	return (
		<main className={styles.main}>
			empty {number}
		</main>
	);
}
