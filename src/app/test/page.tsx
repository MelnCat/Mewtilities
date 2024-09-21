"use client";
import { ClipboardEventHandler, useMemo, useState } from "react";
import styles from "./page.module.scss";
import { parseCatPage } from "@/parser/catParser";

export default function GeneTestPage() {
	const [pasted, setPasted] = useState("");
	const onPaste: ClipboardEventHandler<HTMLInputElement> = e => {
		setPasted(e.clipboardData.getData("text/html"));
	};
	const cat = useMemo(() => pasted ? parseCatPage(pasted) : null, [pasted]);
	return (
		<main className={styles.main}>
			<input placeholder="paste here" onPaste={onPaste} />
			<pre>
				<code>{cat?.ok ? JSON.stringify(cat.data, null, "\t") : cat?.message}</code>
			</pre>
			<pre>
				<code>{pasted}</code>
			</pre>
		</main>
	);
}
