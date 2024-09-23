"use server";

import { signIn } from "@/auth";

export const signIntoGoogle = async() => {
	await signIn("google");
};
