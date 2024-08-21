import "server-only";
import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
	return new PrismaClient().$extends({
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
