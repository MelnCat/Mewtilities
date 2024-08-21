"use client";
import { cache, useRef, useState } from "react";
import styles from "./AdminPanel.module.scss";
import { getItemDatabaseInfo, processItemDatabaseFiles, processMarketFiles } from "./actions";

const FilePanel = ({ title, onSubmit }: { title: string; onSubmit: (files: FileList) => Promise<{ success: boolean; message: string }> }) => {
	const [files, setFiles] = useState<FileList | null>(null);
	const [error, setError] = useState<boolean>(false);
	const [message, setMessage] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const ref = useRef<HTMLInputElement | null>(null);
	const submit = async () => {
		if (files === null) return;
		setLoading(true);
		const result = await onSubmit(files);
		setLoading(false);
		setError(!result.success);
		setMessage(result.message);
		if (result.success && ref.current) {
			ref.current.value = "";
			setFiles(null);
		}
	};
	return (
		<div className={styles.panelEntry}>
			<h1 className={styles.panelEntryTitle}>{title}</h1>
			<input
				type="file"
				multiple
				accept=".html"
				onChange={e => {
					setFiles(e.target.files);
					setMessage(null);
				}}
				ref={ref}
				disabled={loading}
			/>
			<button onClick={submit} disabled={files === null || files.length === 0 || loading}>
				{loading ? "Processing..." : "Process"}
			</button>
			<p className={error ? styles.error : styles.success}>{message}</p>
		</div>
	);
};

export const AdminPanel = async() => {
	const info = await getItemDatabaseInfo();
	const uploadItemDatabaseFiles = async (files: FileList) => {
		const formData = new FormData();
		for (const file of files) formData.append("files", file);
		const result = await processItemDatabaseFiles(formData);
		return result;
	};
	const uploadMarketFiles = async (files: FileList) => {
		const formData = new FormData();
		for (const file of files) formData.append("files", file);
		const result = await processMarketFiles(formData);
		return result;
	};
	return (
		<article className={styles.panel}>
			<header className={styles.panelHeader}>
				<h1>admin panel</h1>
			</header>
			<section className={styles.panelContent}>
				<FilePanel title="Process Item Database Files" onSubmit={uploadItemDatabaseFiles} />
				<FilePanel title="Process Marketplace Files" onSubmit={uploadMarketFiles} />
				<div className={styles.panelEntry}>
					<h1 className={styles.panelEntryTitle}>Item Database Info</h1>
					<p></p>
				</div>
			</section>
		</article>
	);
};
