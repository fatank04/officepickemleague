// Full team name (as returned by The Odds API / ESPN) -> nickname, abbreviation, color.
// Colors/abbreviations are used only to render generic, license-safe marks (no NFL logos).
export interface Team {
  nick: string;
  abbr: string;
  color: string;
}

export const TEAMS: Record<string, Team> = {
  "Arizona Cardinals": { nick: "Cardinals", abbr: "ARI", color: "#97233F" },
  "Atlanta Falcons": { nick: "Falcons", abbr: "ATL", color: "#A71930" },
  "Baltimore Ravens": { nick: "Ravens", abbr: "BAL", color: "#241773" },
  "Buffalo Bills": { nick: "Bills", abbr: "BUF", color: "#00338D" },
  "Carolina Panthers": { nick: "Panthers", abbr: "CAR", color: "#0085CA" },
  "Chicago Bears": { nick: "Bears", abbr: "CHI", color: "#0B162A" },
  "Cincinnati Bengals": { nick: "Bengals", abbr: "CIN", color: "#FB4F14" },
  "Cleveland Browns": { nick: "Browns", abbr: "CLE", color: "#FF3C00" },
  "Dallas Cowboys": { nick: "Cowboys", abbr: "DAL", color: "#003594" },
  "Denver Broncos": { nick: "Broncos", abbr: "DEN", color: "#FB4F14" },
  "Detroit Lions": { nick: "Lions", abbr: "DET", color: "#0076B6" },
  "Green Bay Packers": { nick: "Packers", abbr: "GB", color: "#203731" },
  "Houston Texans": { nick: "Texans", abbr: "HOU", color: "#03202F" },
  "Indianapolis Colts": { nick: "Colts", abbr: "IND", color: "#002C5F" },
  "Jacksonville Jaguars": { nick: "Jaguars", abbr: "JAX", color: "#006778" },
  "Kansas City Chiefs": { nick: "Chiefs", abbr: "KC", color: "#E31837" },
  "Las Vegas Raiders": { nick: "Raiders", abbr: "LV", color: "#5B6770" },
  "Los Angeles Chargers": { nick: "Chargers", abbr: "LAC", color: "#0080C6" },
  "Los Angeles Rams": { nick: "Rams", abbr: "LAR", color: "#003594" },
  "Miami Dolphins": { nick: "Dolphins", abbr: "MIA", color: "#008E97" },
  "Minnesota Vikings": { nick: "Vikings", abbr: "MIN", color: "#4F2683" },
  "New England Patriots": { nick: "Patriots", abbr: "NE", color: "#0B2C5E" },
  "New Orleans Saints": { nick: "Saints", abbr: "NO", color: "#9F8958" },
  "New York Giants": { nick: "Giants", abbr: "NYG", color: "#0B2265" },
  "New York Jets": { nick: "Jets", abbr: "NYJ", color: "#125740" },
  "Philadelphia Eagles": { nick: "Eagles", abbr: "PHI", color: "#004C54" },
  "Pittsburgh Steelers": { nick: "Steelers", abbr: "PIT", color: "#B9A23B" },
  "San Francisco 49ers": { nick: "49ers", abbr: "SF", color: "#AA0000" },
  "Seattle Seahawks": { nick: "Seahawks", abbr: "SEA", color: "#1A8E3A" },
  "Tampa Bay Buccaneers": { nick: "Buccaneers", abbr: "TB", color: "#D50A0A" },
  "Tennessee Titans": { nick: "Titans", abbr: "TEN", color: "#2F6FB0" },
  "Washington Commanders": { nick: "Commanders", abbr: "WAS", color: "#5A1414" },
};

const NICK_TO_TEAM: Record<string, Team> = Object.fromEntries(
  Object.values(TEAMS).map((t) => [t.nick, t])
);

/** Accepts a full name ("Seattle Seahawks") or a nickname ("Seahawks"). */
export function team(name: string): Team {
  return TEAMS[name] || NICK_TO_TEAM[name] || { nick: name, abbr: name.slice(0, 3).toUpperCase(), color: "#39465f" };
}
export const nick = (name: string) => team(name).nick;
export const abbr = (name: string) => team(name).abbr;
