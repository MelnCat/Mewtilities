import { getAdminState } from "@/admin/auth";
import { useState } from "react";
import styles from "./page.module.scss";
import { cookies } from "next/headers";
import { AdminPanel } from "./panel/AdminPanel";

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
	return <main className={styles.main}>{adminState ? <AdminPanel /> : <Login />}</main>;
}
