export interface RawMarketEntry {
	item: { id: number; name: string; count: number };
	seller: { id: number; name: string };
	category: string;
	priceType: string;
	priceCount: number;
	expiryTime: Date;
}
