import Link from "next/link";
import styles from "./page.module.scss";

export default async function Home() {
	return (
		<main className={styles.main}>
			<Link href="/cat-editor">Cat editor</Link>
			<Link href="/items">items</Link>
			<Link href="/offspring-calculator">offspring calculator</Link>
			<Link href="/">dont click this</Link>
		</main>
	);
}
