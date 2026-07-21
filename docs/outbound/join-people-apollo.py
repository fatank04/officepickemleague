#!/usr/bin/env python3
"""
Join an Apollo *people* export to the scored company master → one deduped, ring-labeled people list.

USAGE:
    1) run consolidate-apollo.py first (builds ~/Downloads/opl-companies-master.csv)
    2) pull people in Apollo (People tab, title/level filters per apollo-icp-spec.md), export to Downloads
    3) python3 docs/outbound/join-people-apollo.py

INPUT:  ~/Downloads/apollo-contacts-export*.csv  (Apollo People export)
        ~/Downloads/opl-companies-master.csv      (from consolidate-apollo.py)
OUTPUT: ~/Downloads/opl-people-master.csv         (import into Google Sheets)

Does: join person -> company by Apollo Account Id (inherits Metro/Wave/Ring/preScore/familyOwned/address),
classify each person buyer / champion / other by title, then keep **2 per account** (best buyer + best
champion), ring-labeled and sorted for outreach.

NOTE: Apollo people-export headers are handled defensively via g(); if your export uses different column
names, extend the name lists in g() calls. Verify against your first real export.
"""
import csv, glob, os, re, collections

PEOPLE = sorted(glob.glob(os.path.expanduser("~/Downloads/apollo-contacts-export*.csv")))
MASTER = os.path.expanduser("~/Downloads/opl-companies-master.csv")
OUT    = os.path.expanduser("~/Downloads/opl-people-master.csv")

def g(row, *names):
    for n in names:
        v = row.get(n)
        if v and str(v).strip(): return str(v).strip().lstrip("'")
    return ""

def classify(title):
    t = title.lower()
    if "vice" not in t and any(k in t for k in ["owner","president","chief executive"," ceo","founder","proprietor","managing partner","managing director","principal"]):
        return ("buyer", 1)
    if "general manager" in t or re.search(r"\bgm\b", t):
        return ("buyer", 1)
    if any(k in t for k in ["human resources","hr manager","hr director","people operations","head of people","chief people","people & culture","people and culture","talent acquisition"]):
        return ("buyer", 2)
    if any(k in t for k in ["office manager","operations manager","operations director","director of operations","business manager","ops manager"]):
        return ("champion", 3)
    return ("other", 9)

# --- load company master by Apollo Account Id ---
comp = {}
if os.path.exists(MASTER):
    for r in csv.DictReader(open(MASTER, encoding="utf-8", errors="replace")):
        comp[(r.get("Apollo Account Id") or "").strip()] = r
else:
    raise SystemExit("Run consolidate-apollo.py first — no company master found.")

# --- load + classify people ---
by_acct = collections.defaultdict(list)
n_people = 0
for path in PEOPLE:
    for row in csv.DictReader(open(path, encoding="utf-8", errors="replace")):
        n_people += 1
        aid = g(row, "Apollo Account Id")
        title = g(row, "Title", "Job Title")
        role, pri = classify(title)
        by_acct[aid].append({
            "aid": aid, "role": role, "pri": pri, "title": title,
            "first": g(row,"First Name"), "last": g(row,"Last Name"),
            "seniority": g(row,"Seniority"),
            "email": g(row,"Email","Primary Email"),
            "email_status": g(row,"Email Status","Email Confidence"),
            "phone": g(row,"Mobile Phone","Work Direct Phone","Corporate Phone","Direct Phone","Other Phone"),
            "linkedin": g(row,"Person Linkedin Url","LinkedIn Url"),
            "contact_id": g(row,"Apollo Contact Id","Contact Id"),
        })

# --- keep 2 per account: best buyer + best champion (fallbacks) ---
selected, unmatched = [], 0
for aid, plist in by_acct.items():
    plist.sort(key=lambda p: p["pri"])
    buyers = [p for p in plist if p["role"]=="buyer"]
    champs = [p for p in plist if p["role"]=="champion"]
    picks = []
    if buyers: picks.append(buyers[0])
    if champs: picks.append(champs[0])
    for p in plist:
        if len(picks) >= 2: break
        if p not in picks: picks.append(p)
    for p in picks[:2]:
        c = comp.get(aid)
        if not c: unmatched += 1
        p["comp"] = c
        selected.append(p)

out_fields = ["Wave","Metro","Ring","preScore","familyOwned","Role","Company Name","Company Address",
    "Company Phone","First Name","Last Name","Title","Seniority","Email","Email Status","Person Phone",
    "Person Linkedin","Apollo Account Id","Apollo Contact Id","Keep? (y/n)","Notes"]
recs = []
for p in selected:
    c = p["comp"] or {}
    recs.append({
        "Wave": c.get("Wave",""), "Metro": c.get("Metro","(no company match)"),
        "Ring": c.get("Ring",""), "preScore": c.get("preScore",""), "familyOwned": c.get("familyOwned",""),
        "Role": p["role"], "Company Name": c.get("Company Name",""), "Company Address": c.get("Company Address",""),
        "Company Phone": c.get("Company Phone",""),
        "First Name": p["first"], "Last Name": p["last"], "Title": p["title"], "Seniority": p["seniority"],
        "Email": p["email"], "Email Status": p["email_status"], "Person Phone": p["phone"],
        "Person Linkedin": p["linkedin"], "Apollo Account Id": p["aid"], "Apollo Contact Id": p["contact_id"],
        "Keep? (y/n)": "", "Notes": "",
    })
def _sk(x):
    try: wv=int(x["Wave"]); rg=int(x["Ring"])
    except: wv, rg = 99, 9
    return (wv, rg, x["Company Name"].lower(), {"buyer":0,"champion":1,"other":2}.get(x["Role"],3))
recs.sort(key=_sk)

with open(OUT,"w",newline="",encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=out_fields); w.writeheader(); w.writerows(recs)

roles = collections.Counter(r["Role"] for r in recs)
rings = collections.Counter((r["Wave"], r["Ring"]) for r in recs if r["Metro"]!="(no company match)")
print(f"People rows read: {n_people} | accounts with people: {len(by_acct)} | selected (<=2/acct): {len(recs)}")
print(f"Roles: {dict(roles)} | unmatched-to-company: {unmatched}")
print("By wave/ring:", dict(sorted(rings.items())))
print(f"Wrote: {OUT}")
