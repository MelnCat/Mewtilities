import "server-only";
import { PrismaClient, Prisma } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const prismaClientSingleton = () => {
	return new PrismaClient({
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
};

declare const globalThis: {
	prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
