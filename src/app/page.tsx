import Link from "next/link";
import styles from "./page.module.scss";

export default async function Home() {
	return (
		<main className={styles.main}>
            <h1>Welcome to Mewtilities!</h1>
            <p>you should play silksong</p>
			<Link href="/cat-editor">Cat Editor</Link>
		</main>
	);
}
