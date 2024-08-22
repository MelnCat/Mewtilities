import { getAllItems } from "@/db/db";

export const dynamic = "force-dynamic";

export async function GET() {
	const data = await getAllItems();
	return Response.json(data);
}
