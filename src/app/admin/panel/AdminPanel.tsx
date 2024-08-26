import prisma from "@/db/prisma";
import { getItemDatabaseInfo, getMarketInfo } from "../actions";
import styles from "./AdminPanel.module.scss";
import { FilePanels } from "./FilePanel";
import prettyMs from "pretty-ms";
import { CatImage } from "@/app/components/CatImage";
import { randomCatGene } from "@/util/cat";
import { CatGeneDisplay } from "@/app/components/CatGeneDisplay";

export const AdminPanel = async () => {
	const itemDatabaseInfo = await getItemDatabaseInfo();
	const marketInfo = await getMarketInfo();
	const cats = await prisma.cat.findMany({ select: { id: true }, orderBy: { id: "asc" } });
	const ranges = cats.reduce((l, c) => {
		if (!l.length) l.push([c.id, c.id]);
		else if (c.id === l.at(-1)![1] + 1) l.at(-1)![1] = c.id;
		else l.push([c.id, c.id]);
		return l;
	}, [] as [number, number][])
	return (
		<article className={styles.panel}>
			<header className={styles.panelHeader}>
				<h1>admin panel</h1>
			</header>
			<section className={styles.panelContent}>
				<FilePanels />
				<div className={styles.panelEntry}>
					<h1 className={styles.panelEntryTitle}>Item Database Info</h1>
					<p>
						<b>Items</b>: {itemDatabaseInfo.count}
					</p>
					<p>
						<b>First Missing</b>: {itemDatabaseInfo.firstMissing} (Page {Math.floor((itemDatabaseInfo.firstMissing - 1) / 40) + 1})
					</p>
					<p>
						<b>Highest #ID</b>: {itemDatabaseInfo.highest}
					</p>
				</div>
				<div className={styles.panelEntry}>
					<h1 className={styles.panelEntryTitle}>Market Info</h1>
					<p>
						<b>Last Update</b>: {marketInfo.lastUpdate ? `${prettyMs(Date.now() - marketInfo.lastUpdate)} ago` : "?"}
					</p>
				</div>
				<div className={styles.panelEntry}>
					<h1 className={styles.panelEntryTitle}>Cat Info</h1>
					<p>
						<b>Ranges</b>: {ranges.map(x => x[0] === x[1] ? x[0] : x.join("-")).join(", ") || "None"}
					</p>
				</div>
			</section>
			<CatGeneDisplay gene={randomCatGene()} />
			<CatGeneDisplay gene={randomCatGene()} />
			<CatGeneDisplay gene={randomCatGene()} />
			<CatGeneDisplay gene={randomCatGene()} />
		</article>
	);
};
