import prisma from "@/db/prisma";
import type { Item } from "@/generated/prisma/client";
import "server-only";

export const getNestorSources = async () =>
	(await prisma.item.findMany()).reduce((l, c) => {
		const rarity = (c?.info as { gift_nestor: string })?.gift_nestor;
		if (!rarity) return l;
		if (rarity in l) l[rarity].push(c);
		else l[rarity] = [c];
		return l;
	}, {} as Record<string, Item[]>);
