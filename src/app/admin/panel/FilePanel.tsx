"use client";
import { useRef, useState } from "react";
import styles from "./AdminPanel.module.scss";
import { processItemDatabaseFiles, processMarketFiles, processQuickSellFiles, processRecipeDatabaseFiles, processShopEntryFiles, processShopListFiles } from "../actions";

export const FilePanel = ({
	title,
	onSubmit,
	description,
}: {
	title: string;
	onSubmit: (files: FileList) => Promise<{ success: boolean; message: string }>;
	description?: string;
}) => {
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
			{description && <p>{description}</p>}
			<input
				type="file"
				multiple
				accept=".html,.htm"
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

export const FilePanels = () => {
	const upload =
		(
			processor: (data: FormData) => Promise<{
				success: boolean;
				message: string;
			}>
		) =>
		async (files: FileList) => {
			const formData = new FormData();
			for (const file of files) formData.append("files", file);
			const result = await processor(formData);
			return result;
		};
	return (
		<>
			<FilePanel title="Process Item Database Files" onSubmit={upload(processItemDatabaseFiles)} />
			<FilePanel title="Process Marketplace Files" onSubmit={upload(processMarketFiles)} />
			<FilePanel title="Process Shop List Files" description="The city page, not the place where you buy stuff." onSubmit={upload(processShopListFiles)} />
			<FilePanel title="Process Shop Files" description="Where you buy stuff." onSubmit={upload(processShopEntryFiles)} />
			<FilePanel title="Process Quick Sell Files" onSubmit={upload(processQuickSellFiles)} />
			<FilePanel title="Process Recipe Database Files" onSubmit={upload(processRecipeDatabaseFiles)} />
		</>
	);
};
