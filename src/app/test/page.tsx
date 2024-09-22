"use client";
import { ClipboardEventHandler, useMemo, useState } from "react";
import styles from "./page.module.scss";
import { parseCatPage } from "@/parser/catParser";
import { geneFromImported } from "@/util/cat";
import { CatGeneDisplay } from "../components/CatGeneDisplay";

export default function GeneTestPage() {
	const [pasted, setPasted] = useState("");
	const onPaste: ClipboardEventHandler<HTMLInputElement> = e => {
		setPasted(e.clipboardData.getData("text/html"));
	};
	const cat = useMemo(() => pasted ? parseCatPage(pasted) : null, [pasted]);
	const gene = useMemo(() => cat?.data ? geneFromImported(cat.data) : null, [cat])
	return (
		<main className={styles.main}>
			<h1>Tersting</h1>
			<input placeholder="paste here" onPaste={onPaste} />
			{gene && <CatGeneDisplay gene={gene} />}
			<pre>
				<code>{cat?.ok ? JSON.stringify(cat.data, null, "\t") : cat?.message}</code>
			</pre>
			<pre>
				<code>{pasted}</code>
			</pre>
		</main>
	);
}
