import "server-only";
import { prisma } from "@/lib/db";

export async function getOwnedBusiness(slug: string, userId: string) {
  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business || business.ownerId !== userId) return null;
  return business;
}
