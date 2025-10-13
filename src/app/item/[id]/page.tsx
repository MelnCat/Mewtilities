import { getItemData } from "@/db/db";
import styles from "./item.module.scss";
import { ItemView } from "./components/ItemView";
import { CustomItemView } from "./components/CustomItemView";

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;

    const {
        id
    } = params;

    const data = await getItemData(+id);
    if (!data) return <h1>404</h1>;
    if (data.custom) return <CustomItemView item={data} />;
    return <ItemView item={data} />;
}
