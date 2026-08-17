"use server";

import { refresh } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export async function toggleBusinessStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const businessId = String(formData.get("businessId") ?? "");
  const nextStatus = String(formData.get("nextStatus") ?? "");
  if (!businessId || (nextStatus !== "active" && nextStatus !== "suspended")) return;

  await prisma.business.update({ where: { id: businessId }, data: { status: nextStatus } });
  refresh();
}
