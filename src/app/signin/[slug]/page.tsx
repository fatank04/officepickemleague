import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { current } from "@/lib/league";
import { brandOf } from "@/lib/brand";
import BrandTheme from "@/components/BrandTheme";
import SignInForm from "./SignInForm";

export const dynamic = "force-dynamic";

export default async function SignInPage({ params }: { params: { slug: string } }) {
  const ctx = await current();
  if (ctx && ctx.league.slug === params.slug) redirect(`/l/${params.slug}/picks`);
  const league = await prisma.league.findUnique({ where: { slug: params.slug } });
  if (!league)
    return <main style={{ padding: 24, color: "#eef3fa", fontFamily: "system-ui" }}>That league link isn’t valid.</main>;
  const brand = brandOf(league as any);
  return (
    <>
      <BrandTheme accent={brand.accent} />
      <Suspense>
        <SignInForm slug={params.slug} leagueName={league.name} />
      </Suspense>
    </>
  );
}
