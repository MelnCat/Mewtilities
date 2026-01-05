import { getClothing } from "@/db/db";

export const dynamic = "force-dynamic";

export async function GET() {
	const data = await getClothing();
	return Response.json(data);
}
