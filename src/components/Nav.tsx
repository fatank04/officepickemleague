"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ slug, isCommish }: { slug: string; isCommish: boolean }) {
  const path = usePathname();
  const items: [string, string][] = [
    ["picks", "Picks"],
    ["standings", "Standings"],
    ["insights", "Insights"],
  ];
  if (isCommish) items.push(["settings", "Settings"]);
  return (
    <div className="navlinks">
      {items.map(([k, label]) => {
        const href = `/l/${slug}/${k}`;
        return (
          <Link key={k} href={href} className={path === href ? "active" : ""}>
            {label}
          </Link>
        );
      })}
    </div>
  );
}
