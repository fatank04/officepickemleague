import { prisma } from "@/lib/db";
import { brandOf } from "@/lib/brand";
import BrandTheme from "@/components/BrandTheme";
import EnrollForm from "./EnrollForm";

export const dynamic = "force-dynamic";

export default async function JoinPage({ params }: { params: { slug: string } }) {
  const league = await prisma.league.findUnique({ where: { slug: params.slug } });
  if (!league)
    return <main style={{ padding: 24, color: "#eef3fa", fontFamily: "system-ui" }}>That league link isn’t valid.</main>;
  const brand = brandOf(league as any);
  return (
    <>
      <BrandTheme accent={brand.accent} />
      <EnrollForm
        slug={params.slug}
        leagueName={league.name}
        accent={brand.accent}
        ink={brand.ink}
        logoUrl={brand.logoUrl}
        prizeText={brand.prizeText}
        welcomeMessage={brand.welcomeMessage}
      />
    </>
  );
}
