import { getItemDatabaseInfo, getMarketInfo } from "../actions";
import styles from "./AdminPanel.module.scss";
import { FilePanels } from "./FilePanel";
import prettyMs from "pretty-ms";

export const AdminPanel = async () => {
	const itemDatabaseInfo = await getItemDatabaseInfo();
	const marketInfo = await getMarketInfo();
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
			</section>
		</article>
	);
};
