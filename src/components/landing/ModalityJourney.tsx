"use client";
import { useState } from "react";

/**
 * Interactive "Four ways to play" section: tabbed mock conversations showing the
 * real journey for TEXT, WEB, PAPER — plus CALL, the concierge line offered as a
 * premium add-on (tab kept last, labelled as such). Each ends in a visible
 * confirmation, because the promise is: nothing counts until you've seen your
 * picks echoed back. Copy assumes the weekly FEATURED SLATE (~9 games), never a
 * full-schedule grind. Animations are pure CSS keyframes (compositor-safe);
 * switching tabs remounts the panel (React key) so the sequence replays.
 */
type Mode = "text" | "call" | "web" | "paper";

const tabs: { id: Mode; label: string; sub: string }[] = [
  { id: "text", label: "Text", sub: "one game at a time" },
  { id: "web", label: "Web", sub: "one tap per pick" },
  { id: "paper", label: "Paper", sub: "check, snap, text" },
  { id: "call", label: "Call", sub: "concierge add-on" },
];

const skipStyle: React.CSSProperties = {
  textAlign: "center", color: "var(--muted, #93a1bc)", fontSize: 12,
  letterSpacing: ".4px", padding: "2px 0", opacity: 0.8,
};

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
              Week 3 — nine games on the slate. One at a time, like a friend would.
              First up: <b>Cowboys @ Eagles</b>, Eagles −3.5, O/U 47.5. Who wins, who covers, over or under?
            </div>
            <div className="ld-msg out" style={{ animationDelay: "1.0s" }}>
              🎤 &quot;Eagles win and cover, gimme the under&quot;
            </div>
            <div className="ld-msg in" style={{ animationDelay: "1.9s" }}>
              ✓ Eagles · Eagles −3.5 · Under. Next: <b>Bills @ Jets</b>, Bills −2.5, O/U 44.5?
            </div>
            <div className="ld-msg out" style={{ animationDelay: "2.7s" }}>
              Bills, Bills, over
            </div>
            <div style={skipStyle}>· · · seven more games, one quick text each · · ·</div>
            <div className="ld-msg in" style={{ animationDelay: "3.9s" }}>
              That&apos;s the whole slate ✓ Your card, all nine: EAGLES cover/under · BILLS over · …
              Lock = Eagles. Say any change in plain words, or reply LOCK.
            </div>
            <div className="ld-msg out" style={{ animationDelay: "4.8s" }}>
              🎤 &quot;actually flip Bills to the under — lock it&quot;
            </div>
            <div className="ld-msg in" style={{ animationDelay: "5.6s" }}>
              Bills under ✓ Card locked 🔒 Good luck 🍀
            </div>
          </div>
          <p className="ld-mj-caption">
            It plays like texting a friend who asks one game at a time — nine quick replies and you&apos;re done.
            Hate typing? Tap the mic and say it; talk-to-text works for every pick and every change.
            Your full card comes back in writing before anything locks.
          </p>
        </div>
      )}

      {mode === "call" && (
        <div className="ld-mj-panel" key="call" role="tabpanel">
          <div className="ld-phone">
            <div className="ld-phone-bar">Office Pick&apos;em · Concierge call</div>
            <div className="ld-msg in" style={{ animationDelay: "0.1s" }}>
              🎙️ &quot;So — Eagles again. You rode them last week and they paid. Staying on, or are you
              seeing something in this one?&quot;
            </div>
            <div className="ld-msg out" style={{ animationDelay: "1.1s" }}>
              &quot;They&apos;re at home, I like the cover. Talk me through the total though.&quot;
            </div>
            <div className="ld-msg in" style={{ animationDelay: "2.0s" }}>
              🎙️ &quot;47½ — both defenses top-ten. If you&apos;re short on time I&apos;ll rapid-fire the rest;
              if not, let&apos;s talk them out.&quot;
            </div>
            <div className="ld-msg out" style={{ animationDelay: "3.0s" }}>
              &quot;Talk &apos;em out. I&apos;ve got ten minutes.&quot;
            </div>
            <div style={skipStyle}>· · · every game, at your pace · · ·</div>
            <div className="ld-msg in" style={{ animationDelay: "4.0s" }}>
              🎙️ &quot;Full card read-back: Eagles cover and under, Bills over… lock on the Eagles.
              Say the word and it&apos;s in.&quot;
            </div>
            <div className="ld-msg out" style={{ animationDelay: "4.9s" }}>
              &quot;Lock it in.&quot;
            </div>
          </div>
          <p className="ld-mj-caption">
            The premium add-on, and the closest thing to a weekly football friend with perfect memory.
            You&apos;re talking to a conversational agent that reads the room — chatty when you want company,
            rapid-fire when you&apos;re slammed — remembers how your picks went, talks each game out with you,
            then reads your whole card back and submits only when you say so.
          </p>
        </div>
      )}

      {mode === "paper" && (
        <div className="ld-mj-panel" key="paper" role="tabpanel">
          <div className="ld-phone">
            <div className="ld-phone-bar">Office Pick&apos;em · Paper</div>
            <div className="ld-msg in" style={{ animationDelay: "0.1s" }}>
              This week&apos;s sheets are in the break room 📄 Nine games — check your boxes over coffee,
              snap a photo, text it here.
            </div>
            <div className="ld-msg out" style={{ animationDelay: "1.0s" }}>
              📸 <i>[photo of your checked-off sheet]</i>
            </div>
            <div className="ld-msg in" style={{ animationDelay: "1.9s" }}>
              Read your sheet ✓ here&apos;s everything, game by game:
              EAGLES cover · under — BILLS over — PACKERS cover · over — … Lock: DAL.
              All nine as you marked them. Anything to fix? Just say it.
            </div>
            <div className="ld-msg out" style={{ animationDelay: "2.9s" }}>
              🎤 &quot;make the Packers game an under — rest is right&quot;
            </div>
            <div className="ld-msg in" style={{ animationDelay: "3.7s" }}>
              Packers under ✓ Card locked 🔒 See you on the standings.
            </div>
          </div>
          <p className="ld-mj-caption">
            The classic way, upgraded: pen and paper, then one photo. We read your sheet, type it in,
            and text back every pick in plain English — one look, one fix at most, done. Corrections work
            by talk-to-text too: say the change out loud and it&apos;s made.
          </p>
        </div>
      )}

      {mode === "web" && (
        <div className="ld-mj-panel" key="web" role="tabpanel">
          <div className="ld-phone web">
            <div className="ld-phone-bar">officepickemleague.com</div>
            <div className="ld-webrow" style={{ animationDelay: "0.1s" }}>
              <span className="g">Cowboys @ Eagles</span>
              <span className="pick sel">Eagles ✓</span>
              <span className="pick">Cowboys</span>
            </div>
            <div className="ld-webrow" style={{ animationDelay: "0.7s" }}>
              <span className="g">Bills @ Jets</span>
              <span className="pick sel">Over ✓</span>
              <span className="pick">Under</span>
            </div>
            <div className="ld-msg in toast" style={{ animationDelay: "1.5s" }}>
              Saved ✓ — every tap saves itself. Short on time? Autofill finishes your card in one tap.
            </div>
          </div>
          <p className="ld-mj-caption">
            One tap per pick, saved the moment you tap it. The week&apos;s slate fits on one screen, and
            Autofill (favorites, home teams, or pure chance) covers anything you leave blank. Change any
            pick right up to kickoff.
          </p>
        </div>
      )}
    </div>
  );
}
