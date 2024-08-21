import styles from "./currencyIcons.module.scss";

const numberFormat = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 2 })

export const NoteIcon = () => <img src="https://www.pixelcatsend.com/main_assets/paper_note.png" alt="notes" />;
export const EssenceIcon = () => <img src="https://www.pixelcatsend.com/main_assets/essence_fragment.png" alt="essence fragments" />;

export const NoteValue = ({ children }: { children: string | number }) => (
	<span className={styles.currencyValue}>
		{typeof children === "number" ? numberFormat.format(children) : children} <NoteIcon />
	</span>
);
export const EssenceValue = ({ children }: { children: string | number }) => (
	<span className={styles.currencyValue}>
		{typeof children === "number" ? numberFormat.format(children) : children} <EssenceIcon />
	</span>
);
