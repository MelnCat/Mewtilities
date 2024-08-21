"use server";
import prisma from "./prisma";

export const getItemData = (id: number) => prisma.item.findFirst({ where: { id }, include: { marketEntries: true } });
export const getAllItems = () => prisma.item.findMany({ orderBy: { id: "asc" }, include: { marketEntries: { where: { expiryTime: { gt: new Date() } } } } });
