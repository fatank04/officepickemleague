"use client";
import { useState } from "react";

/**
 * Interactive "three ways in" section: tabbed mock conversations showing the
 * real journey for the three base ways — TEXT, WEB, PAPER — plus CALL, the concierge
 * phone line offered as a premium add-on (tab kept last, labelled as such). Each ends
 * in a visible confirmation,
 * because the promise is: nothing counts until you've seen your picks echoed back.
 * Animations are pure CSS keyframes (compositor-safe); switching tabs remounts
 * the panel (React key) so the sequence replays. Reduced motion: static.
 */
type Mode = "text" | "call" | "web" | "paper";

const tabs: { id: Mode; label: string; sub: string }[] = [
  { id: "text", label: "Text", sub: "like texting a friend" },
  { id: "web", label: "Web", sub: "one tap per pick" },
  { id: "paper", label: "Paper", sub: "check, snap, text" },
  { id: "call", label: "Call", sub: "concierge add-on" },
];

export default function ModalityJourney() {
  const [mode, setMode] = useState<Mode>("text");

  return (
    <div className="ld-mj">
      <div className="ld-mj-tabs" role="tablist" aria-label="Ways to play">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={mode === t.id}
            className={`ld-mj-tab${mode === t.id ? " active" : ""}`}
            onClick={() => setMode(t.id)}
          >
            <span className="l">{t.label}</span>
            <span className="s">{t.sub}</span>
          </button>
        ))}
      </div>

      {mode === "text" && (
        <div className="ld-mj-panel" key="text" role="tabpanel">
          <div className="ld-phone">
            <div className="ld-phone-bar">Office Pick&apos;em · Text</div>
            <div className="ld-msg in" style={{ animationDelay: "0.1s" }}>
              Week 1 is live 🏈 Here are your games:
1 Cowboys@Eagles · 2 Bills@Jets · 3 Packers@Bears. Text the game number + your call.
            </div>
            <div className="ld-msg out" style={{ animationDelay: "0.9s" }}>
              1 Cowboys  2 Bills  3 under
            </div>
            <div className="ld-msg in" style={{ animationDelay: "1.8s" }}>
              Got it ✓ 1) Cowboys 2) Bills 3) under. That&apos;s your card — change any pick by text
              until kickoff.
            </div>
          </div>
          <p className="ld-mj-caption">
            No app, no login. We text you the numbered games; you text back the number and your call.
            Every pick comes back to you in writing — so you know exactly what&apos;s in before it locks.
          </p>
        </div>
      )}

      {mode === "call" && (
        <div className="ld-mj-panel" key="call" role="tabpanel">
          <div className="ld-phone">
            <div className="ld-phone-bar">Office Pick&apos;em · Call</div>
            <div className="ld-msg in" style={{ animationDelay: "0.1s" }}>
              🎙️ &quot;Sunday&apos;s games: Cowboys–Eagles, Bills–Jets… want the point spreads?&quot;
            </div>
            <div className="ld-msg out" style={{ animationDelay: "0.9s" }}>
              &quot;Give me the Cowboys, and the over on Bills–Jets.&quot;
            </div>
            <div className="ld-msg in" style={{ animationDelay: "1.8s" }}>
              🎙️ &quot;Here&apos;s your final card: Cowboys to win, Bills–Jets over. Sound right?&quot;
            </div>
            <div className="ld-msg out" style={{ animationDelay: "2.7s" }}>
              &quot;Lock it in.&quot;
            </div>
          </div>
          <p className="ld-mj-caption">
            A simple two-way conversation. Say your picks in plain words, hear your final list read back,
            and confirm — nothing counts until you say so. The concierge phone line is an optional add-on
            for teams that want call-in play.
          </p>
        </div>
      )}

      {mode === "paper" && (
        <div className="ld-mj-panel" key="paper" role="tabpanel">
          <div className="ld-phone">
            <div className="ld-phone-bar">Office Pick&apos;em · Paper</div>
            <div className="ld-msg in" style={{ animationDelay: "0.1s" }}>
              This week&apos;s sheets are in the break room 📄 Check your boxes, snap a photo, text it here.
            </div>
            <div className="ld-msg out" style={{ animationDelay: "0.9s" }}>
              📸 <i>[photo of your checked-off sheet]</i>
            </div>
            <div className="ld-msg in" style={{ animationDelay: "1.8s" }}>
              Got your sheet ✓ Cowboys · Bills · Sunday night <b>under</b> · Lock: DAL. That&apos;s your card —
              we typed it in for you. Change any pick by text until kickoff.
            </div>
          </div>
          <p className="ld-mj-caption">
            The classic way, upgraded: pen and paper, then one photo. We read your sheet, enter it for you,
            and text your card back so you know it&apos;s in — no typing, nothing to learn.
          </p>
        </div>
      )}

      {mode === "web" && (
        <div className="ld-mj-panel" key="web" role="tabpanel">
          <div className="ld-phone web">
            <div className="ld-phone-bar">officepickemleague.com</div>
            <div className="ld-webrow" style={{ animationDelay: "0.1s" }}>
              <span className="g">Cowboys @ Eagles</span>
              <span className="pick sel">Cowboys ✓</span>
              <span className="pick">Eagles</span>
            </div>
            <div className="ld-webrow" style={{ animationDelay: "0.7s" }}>
              <span className="g">Bills @ Jets</span>
              <span className="pick sel">Over ✓</span>
              <span className="pick">Under</span>
            </div>
            <div className="ld-msg in toast" style={{ animationDelay: "1.5s" }}>
              Saved ✓ 2 of 2 picked — editable until each game kicks off.
            </div>
          </div>
          <p className="ld-mj-caption">
            One tap per pick, saved the moment you tap it. Your card stays open — check it, change it,
            right up to kickoff.
          </p>
        </div>
      )}
    </div>
  );
}
