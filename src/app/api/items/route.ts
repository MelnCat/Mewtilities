import { getAllItems, getProcessedItems } from "@/db/db";

export const dynamic = "force-dynamic";

export async function GET() {
	const data = await getProcessedItems();
	return Response.json(data);
}
