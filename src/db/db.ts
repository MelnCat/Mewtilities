"use server";
import prisma from "./prisma";

export const getItemData = (id: number) => prisma.item.findFirst({ where: { id }, include: { marketEntries: true } });