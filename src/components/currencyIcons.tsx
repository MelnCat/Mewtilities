import { Currency } from "@prisma/client";
import styles from "./currencyIcons.module.scss";

const numberFormat = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 2 });

const noteDenominations = [1, 2, 5, 25, 100, 1000].reverse();

export const NoteIcon = ({ count }: { count?: number }) => <img src={`https://www.pixelcatsend.com/images/catmojis/${count ?? 1}note.png`} alt="notes" title="Paper Notes" />;
export const EssenceIcon = () => <img src="https://www.pixelcatsend.com/images/catmojis/essencefragment.png" alt="essence fragments" title="Essence Fragments" />;
export const SnowmeltStampIcon = () => <img src="https://www.pixelcatsend.com/images/catmojis/snowmeltstamp.png" alt="snowmelt stamps" title="Snowmelt Stamps" />;
export const LeafDayStampIcon = () => <img src="https://www.pixelcatsend.com/images/catmojis/leafdaystamp.png" alt="leaf day stamps" title="Leaf Day Stamps" />;
export const LostButtonIcon = () => <img src="https://www.pixelcatsend.com/images/catmojis/lostbuttons.png" alt="lost buttons" title="Lost Buttons" />;
export const FestivalTicketIcon = () => <img src="https://www.pixelcatsend.com/images/catmojis/festivaltickets.png" alt="festival tickets" title="Festival Tickets" />;

const icons = {
	[Currency.ESSENCE]: EssenceIcon,
	[Currency.SNOWMELT_STAMP]: SnowmeltStampIcon,
	[Currency.LEAF_DAY_STAMP]: LeafDayStampIcon,
	[Currency.LOST_BUTTON]: LostButtonIcon,
	[Currency.FESTIVAL_TICKET]: FestivalTicketIcon,
};

export const NoteValue = ({ children }: { children: string | number }) => (
	<span className={styles.currencyValue}>
		{typeof children === "number" ? numberFormat.format(children) : children} <NoteIcon count={typeof children === "number" ? noteDenominations.find(x => x < children) : 1} />
	</span>
);
export const EssenceValue = ({ children }: { children: string | number }) => <CurrencyValue type={Currency.ESSENCE}>{children}</CurrencyValue>;
const CurrencyDisplay = ({ children, icon }: { children: string | number; icon: () => React.ReactNode }) => {
	const Icon = icon;
	return (
		<span className={styles.currencyValue}>
			{typeof children === "number" ? numberFormat.format(children) : children} <Icon />
		</span>
	);
};

export const CurrencyValue = ({ type, children }: { type: Currency; children: number | string }) => {
	if (type === Currency.NOTE) return <NoteValue>{children}</NoteValue>;
	const Icon = icons[type];
	return <CurrencyDisplay icon={Icon}>{children}</CurrencyDisplay>;
};
