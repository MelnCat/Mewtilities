"use client";
import { useState } from "react";
import styles from "./AdminPanel.module.scss";

const FilePanel = (onSubmit: (files: FileList) => void) => {
	const [files, setFiles] = useState<FileList | null>(null);
	const submit = () => {
		if (files === null) return;
		onSubmit(files);
	}
	return <section className={styles.panelContent}>
		<div className={styles.panelEntry}>
			<h1 className={styles.panelEntryTitle}>Process Item Database Files</h1>
			<input type="file" multiple accept=".html" onChange={e => setFiles(e.target.files)} />
			<button onClick={submit}>Process</button>
		</div>
	</section>;
};

export const AdminPanel = () => {
	const processItemDatabaseFiles = async () => {
	};
	return (
		<article className={styles.panel}>
			<header className={styles.panelHeader}>
				<h1>admin panel</h1>
			</header>
			<section className={styles.panelContent}>
				<div className={styles.panelEntry}>
					<h1 className={styles.panelEntryTitle}>Process Item Database Files</h1>
					<button onClick={processItemDatabaseFiles}>Process</button>
				</div>
			</section>
		</article>
	);
};
