"use client";
import { useState } from "react";
import styles from "./AdminPanel.module.scss";
import { useLocalStorage } from "usehooks-ts";
export const CatLinkPanel = () => {
	const [range, setRange] = useState("");
	const [visited, setVisited] = useLocalStorage("visited", [] as number[]);
	const parsedRange = range
		.split("-")
		.flatMap(x => (x ? +x : []))
		.sort((a, b) => a - b);
	return (
		<div className={styles.panelEntry}>
			<h1 className={styles.panelEntryTitle}>Cat Link Generator</h1>
			<p>
				Range <input value={range} onChange={e => setRange(e.target.value)} placeholder="1-5" />
			</p>
			<p>
				{isNaN(parsedRange[0]) || isNaN(parsedRange[1]) || !range || parsedRange[1] - parsedRange[0] > 200
					? null
					: [...Array(parsedRange[1] - parsedRange[0] + 1)]
							.map((x, i) => i + parsedRange[0])
							.map(x => (
								<a
									className={styles.catLink}
									key={x}
									href={`https://www.pixelcatsend.com/cat&id=${x}`}
									{...(visited.includes(x) ? { "data-visited": true } : null)}
									onClick={() => setVisited(y => [...new Set(y.concat(x))])}
								>
									{x}
								</a>
							))}
			</p>
		</div>
	);
};
