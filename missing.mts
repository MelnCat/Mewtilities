import prisma from "@/db/prisma";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { existsSync } from "fs";

const prisma = new PrismaClient({
	adapter: new PrismaPg({
		connectionString: process.env.DATABASE_URL,
	}),
}).$extends({
	result: {
		marketEntry: {
			unitPrice: {
				needs: { priceCount: true, itemCount: true },
				compute(marketEntry) {
					return marketEntry.priceCount / marketEntry.itemCount;
				},
			},
		},
	},
});

const clothing = await prisma.item.findMany({ where: { category: "clothing" } });

console.log("CAT")
console.log(JSON.stringify(clothing.filter(x => !existsSync(`../pcefiles/images/clothing/c/${x.key}.png`)).map(x => x.key)))
console.log(JSON.stringify(clothing.filter(x => !existsSync(`../pcefiles/images/clothing/c/${x.key}.png`)).map(x => x.id)))
console.log("MERCAT")
console.log(JSON.stringify(clothing.filter(x => !existsSync(`../pcefiles/images/clothing/m/${x.key}.png`)).map(x => x.key)))
console.log(JSON.stringify(clothing.filter(x => !existsSync(`../pcefiles/images/clothing/m/${x.key}.png`)).map(x => x.id)))