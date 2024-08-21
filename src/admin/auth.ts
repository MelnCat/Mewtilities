import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";

export const getAdminState = cache(async () => {
	const cookie = cookies().get("password")?.value;

	return cookie === process.env.PASSWORD;
});

