import { prisma } from "@/lib/db";

export function slugify(input: string): string {
  return (
    input
      .normalize("NFD")
      // strip combining diacritics left behind by NFD (e.g. "città" -> "citta")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "azienda"
  );
}

export async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let suffix = 1;

  while (await prisma.business.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}
