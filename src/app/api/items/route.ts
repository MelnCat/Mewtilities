import { getAllItems } from "@/db/db";

export async function GET() {
	const data = await getAllItems();
	return Response.json(data);
}
