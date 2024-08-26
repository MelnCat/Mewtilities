import { getItemData } from "@/db/db";
import styles from "./item.module.scss";
import { ItemView } from "./components/ItemView";
import { CustomItemView } from "./components/CustomItemView";

export default async function Page({ params: { id } }: { params: { id: string } }) {
	const data = await getItemData(+id);
	if (!data) return <h1>404</h1>;
	if (data.custom) return <CustomItemView item={data} />;
	return <ItemView item={data} />;
}
