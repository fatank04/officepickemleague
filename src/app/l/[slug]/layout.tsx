import { redirect } from "next/navigation";
import { current } from "@/lib/league";
import { Brand } from "@/components/Brand";
import { NavLinks } from "@/components/Nav";

export default async function LeagueLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const ctx = await current();
  if (!ctx || ctx.league.slug !== params.slug) redirect("/");

  return (
    <>
      <div className="nav">
        <div className="nav-inner">
          <Brand />
          <NavLinks slug={params.slug} isCommish={ctx.player.isCommish} />
          <div className="who">
            <span className="avatar" style={{ background: ctx.player.color }}>
              {ctx.player.name.slice(0, 2).toUpperCase()}
            </span>
            {ctx.player.name}
          </div>
        </div>
      </div>
      <div className="wrap">{children}</div>
    </>
  );
}
