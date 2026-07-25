import type { Metadata } from "next";
import Deck from "@/components/Deck";

export const metadata: Metadata = {
  title: { absolute: "Office Pick'em League — Founding Season 2026" },
  description:
    "The buyer walkthrough: four ways to play, what a week feels like, and Founding Season 2026 pricing.",
  robots: { index: false, follow: false },
};

export default function DeckPage() {
  return <Deck />;
}
