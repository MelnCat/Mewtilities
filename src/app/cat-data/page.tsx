import { getAdminState } from "@/admin/auth";
import { cookies } from "next/headers";
import styles from "./page.module.scss";
import { CatGraphs } from "./CatGraphs";
import prisma from "@/db/prisma";
import { getProcessedItems } from "@/db/db";

const Login = () => {
	const submit = async(formData: FormData) => {
		"use server";
		cookies().set("password", formData.get("password") as string);
	}
	return (
		<form action={submit}>
			<label htmlFor="password">Password</label>
			<input type="password" name="password" required/>
			<button type="submit">Submit</button>
		</form>
	);
};


export default async function Admin() {
	const adminState = await getAdminState();
	const catData = await prisma.cat.findMany();
	const itemData = await getProcessedItems();
	return <main className={styles.main}>{adminState ? <CatGraphs data={catData} items={itemData} /> : <Login />}</main>;
}
