import "server-only";
import { prisma } from "@/lib/db";

// Owner or team member — either can view the dashboard and manage feedback.
// Settings and team management stay owner-only; check `isOwner` for those.
export async function getAccessibleBusiness(slug: string, userId: string) {
  const business = await prisma.business.findUnique({
    where: { slug },
    include: { members: { where: { userId }, select: { id: true } } },
  });
  if (!business) return null;

  const isOwner = business.ownerId === userId;
  if (!isOwner && business.members.length === 0) return null;

  return { ...business, isOwner };
}
