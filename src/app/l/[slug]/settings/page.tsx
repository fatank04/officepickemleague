import { redirect } from "next/navigation";
import { current } from "@/lib/league";
import { prisma } from "@/lib/db";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const ctx = (await current())!;
  if (!ctx.player.isCommish) redirect(`/l/${ctx.league.slug}/picks`);

  const games = await prisma.game.findMany({
    where: { season: ctx.league.season },
    orderBy: [{ week: "asc" }, { kickoff: "asc" }],
    select: { id: true, week: true, away: true, home: true, homeSpread: true, total: true, awayScore: true, homeScore: true },
  });

  return (
    <SettingsClient
      slug={ctx.league.slug}
      league={{
        format: ctx.league.format,
        playoffOn: ctx.league.playoffOn,
        playoffStart: ctx.league.playoffStart,
        playoffTeams: ctx.league.playoffTeams,
        seedStep: ctx.league.seedStep,
        seasonStart: ctx.league.seasonStart,
        seasonEnd: ctx.league.seasonEnd,
      }}
      games={games}
    />
  );
}
