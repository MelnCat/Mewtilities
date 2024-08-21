"use server";
import prisma from "./prisma";

export const test = async() => {
	return prisma.item.count();
} 