"use client";
import { useMemo, useState } from "react";
import styles from "./page.module.scss";
import tags from "./tags.json";
import { groupBy } from "remeda";

export const Category = ({ title, contents }: { title: string; contents: string[] }) => {
	const [open, setOpen] = useState(false);
	return (
		<div className={styles.category}>
			<div className={styles.categoryTitle} onClick={() => setOpen(x => !x)}>{title}</div>
			<div className={styles.categoryContents} data-visible={open || null}>
				{contents.map(x => (
					<div className={styles.tag} key={x}>{x}</div>
				))}
			</div>
		</div>
	);
};

export const BapMenu = () => {
	const grouped = useMemo(() => Object.entries(groupBy(tags, x => x.category)), []);
	return (
		<main className={styles.main}>
			<img className={styles.banner} src="/img/services/bap.png" alt="Buying Alerts Pinglist" />
			<section className={styles.register}>
				<div className={styles.categories}>
					{grouped.map(([k, v]) => (
					<Category key={k} title={k} contents={v.map(x => x.name)} />
				))}
				</div>
			</section>
		</main>
	);
}
