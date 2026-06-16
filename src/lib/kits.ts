import { prisma } from "./db";

// DB-backed kit accounts. The pURL page (/kit/<slug>) and the ops console both read these.
export type KitView = {
  slug: string;
  company: string;
  teamCity?: string | null;
  teamName?: string | null;
  accent?: string | null;
  contact?: string | null;
};

export const slugifyCompany = (company: string) =>
  company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "account";

const titleize = (slug: string) => slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Look up a kit from the DB. Unknown slugs fall back to a generic record so the page still converts. */
export async function getKit(slug: string): Promise<{ account: KitView; known: boolean }> {
  const hit = await prisma.kitAccount.findUnique({ where: { slug: slug.toLowerCase() } }).catch(() => null);
  if (hit) return { account: hit, known: true };
  return { account: { slug, company: titleize(slug) }, known: false };
}
