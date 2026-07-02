"use client";
import { useEffect } from "react";

/** Capture UTM / ref / fbclid on landing into a 30-day cookie so enroll can attribute the source. */
export default function AttribCapture() {
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref", "fbclid"];
      const data: Record<string, string> = {};
      for (const k of keys) { const v = p.get(k); if (v) data[k] = v; }
      if (Object.keys(data).length === 0) return;
      data.landing = window.location.pathname;
      data.ts = new Date().toISOString();
      document.cookie = "op_attrib=" + encodeURIComponent(JSON.stringify(data)) + "; path=/; max-age=" + (60 * 60 * 24 * 30) + "; SameSite=Lax";
    } catch {}
  }, []);
  return null;
}
