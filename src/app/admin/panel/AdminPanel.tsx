import { getItemDatabaseInfo } from "../actions";
import styles from "./AdminPanel.module.scss";
import { FilePanels } from "./FilePanel";

export const AdminPanel = async () => {
	const itemDatabaseInfo = await getItemDatabaseInfo();
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
			</section>
		</article>
	);
};
