import { redirect } from "next/navigation";
import { opsAuthed } from "@/lib/ops";
import OpsLogin from "./OpsLogin";

export const dynamic = "force-dynamic";

export default function OpsHome() {
  if (opsAuthed()) redirect("/ops/kits");
  return <OpsLogin />;
}
