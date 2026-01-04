"use client";
import { useRef, useState } from "react";
import styles from "./AdminPanel.module.scss";
import {
	processCatFiles,
	processChestDatabaseFiles,
	processDeletedItemFile,
	processItemDatabaseFiles,
	processMarketFiles,
	processQuickSellFiles,
	processRecipeDatabaseFiles,
	processResourceGatherFiles,
	processShopEntryFiles,
	processShopListFiles,
} from "../actions";
import { parseMarketPage } from "@/parser/marketParser";
import { Failure, unwrap } from "@/util/result";
import { useExtData } from "@/util/util";

export const FilePanel = ({
	title,
	onSubmit,
	description,
	path,
}: {
	title: string;
	onSubmit: (files: FileList | Uint8Array[]) => Promise<{ success: boolean; message: string }>;
	description?: string;
	path?: string;
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
	useExtData(async event => {
		if (path && event.detail.url.includes(path)) {
			setLoading(true);
			const result = await onSubmit([event.detail.data]);
			setLoading(false);
			setError(!result.success);
			setMessage(result.message);
			console.log(`got here`);
		}
	});
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
			processor: (data: FormData | Uint8Array[]) => Promise<{
				success: boolean;
				message: string;
			}>
		) =>
		async (files: FileList | Uint8Array[]) => {
			if (files instanceof Array) {
				const result = await processor(files);
				return result;
			}
			const formData = new FormData();
			for (const file of files) formData.append("files", file);
			const result = await processor(formData);
			return result;
		};
	const decoder = new TextDecoder();
	const uploadMarket = async (fileList: FileList | Uint8Array[]) => {
		const files = [...fileList];
		try {
			const processed = await Promise.all(
				files.map(async x => {
					try {
						return parseMarketPage(decoder.decode(x instanceof Uint8Array ? x : await x.arrayBuffer()));
					} catch (e) {
						throw new Error(`${"name" in x ? x.name : "data"}: ${e}`);
					}
				})
			);
			const errors = processed.map((x, i) => [x, i] as const).filter(x => !x[0].ok);
			if (errors.length)
				return {
					success: false,
					message: `${errors
						.map(x => `${"name" in files[x[1]] ? (files[x[1]] as File).name : ""}: ${(x[0] as Failure).message}`)
						.join("\n")}`,
				};
			const unwrapped = processed.map(x => unwrap(x)).flat();
			return await processMarketFiles(unwrapped);
		} catch (e) {
			return { success: false, message: String(e) };
		}
	};
	return (
		<>
			<FilePanel title="Process Item Database" onSubmit={upload(processItemDatabaseFiles)} path="/items" />
			<FilePanel title="Process Marketplace" onSubmit={uploadMarket} path="/market" />
			<FilePanel
				title="Process Shop List"
				description="The city page, not the place where you buy stuff."
				onSubmit={upload(processShopListFiles)}
			/>
			<FilePanel title="Process Shop" description="Where you buy stuff." onSubmit={upload(processShopEntryFiles)} />
			<FilePanel title="Process Quick Sell" onSubmit={upload(processQuickSellFiles)} path="/quick-sales" />
			<FilePanel title="Process Recipe Database" onSubmit={upload(processRecipeDatabaseFiles)} path="/crafts" />
			<FilePanel title="Process Cat" onSubmit={upload(processCatFiles)} path="/cat" />
			<FilePanel title="Process Resource Gather" onSubmit={upload(processResourceGatherFiles)} path="/gather-resources" />
			<FilePanel title="Process Deleted Items" onSubmit={upload(processDeletedItemFile)} />
			<FilePanel title="Process Chest Database" onSubmit={upload(processChestDatabaseFiles)} />
		</>
	);
};
