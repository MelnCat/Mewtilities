"use client";
import { ClipboardEventHandler, useState } from "react";
import styles from "./page.module.scss";

export default function GeneTestPage() {
	const [pasted, setPasted] = useState("");
	const onPaste: ClipboardEventHandler<HTMLInputElement> = e => {
		setPasted(e.clipboardData.getData("text/html"));
	};
	return (
		<main className={styles.main}>
			<input placeholder="paste here" onPaste={onPaste} />
			<pre>
				<code>{pasted}</code>
			</pre>
			<div dangerouslySetInnerHTML={{ __html: pasted }} />
		</main>
	);
}
