/** Fire a Meta Pixel standard event client-side. Safe no-op if the pixel isn't loaded. */
export function fbTrack(event: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  (window as any).fbq?.("track", event, params);
}
