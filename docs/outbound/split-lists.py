#!/usr/bin/env python3
"""
Split the scored people master into two channel-ready lists.

USAGE: python3 docs/outbound/split-lists.py   (after join-people-apollo.py)

INPUT:  ~/Downloads/opl-people-master.csv
OUTPUT: ~/Downloads/opl-kit-call-list.csv   — kits + calls (mailing address + phone; geo-mistags dropped)
        ~/Downloads/opl-email-list.csv       — Instantly (Verified emails only; geo-mistags dropped)

Both drop GeoFlag=VERIFY-LOCATION rows. Email list keeps Email Status == Verified only and tags
isKitAccount (Ring 1-2 people get the kit-recipient email variant, not the cold sequence).
"""
import csv, os

SRC = os.path.expanduser("~/Downloads/opl-people-master.csv")
KIT = os.path.expanduser("~/Downloads/opl-kit-call-list.csv")
EML = os.path.expanduser("~/Downloads/opl-email-list.csv")

rows = [r for r in csv.DictReader(open(SRC, encoding="utf-8", errors="replace")) if not r["GeoFlag"]]

def rk(r):
    try: rg = int(r["Ring"])
    except: rg = 99
    try: pre = int(r["preScore"])
    except: pre = 0
    return (rg, -pre, r["Company Name"].lower(), {"buyer":0,"champion":1,"other":2}.get(r["Role"],3))
rows.sort(key=rk)

# --- kit/call list (all non-flagged Pittsburgh people; Ring 1-2 = the kit accounts, ranked first) ---
kit_fields = ["Ring","inMaster","preScore","familyOwned","Role","Company Name","Company Address",
    "Company Phone","First Name","Last Name","Title","Person Phone","Email","Email Status",
    "Person Linkedin","Apollo Account Id","Keep? (y/n)","Notes"]
with open(KIT,"w",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f,fieldnames=kit_fields,extrasaction="ignore"); w.writeheader(); w.writerows(rows)

# --- email list (Verified only; tag kit accounts so Instantly uses the kit-recipient variant) ---
eml_rows=[]
for r in rows:
    if r["Email Status"].strip().lower()!="verified" or not r["Email"].strip(): continue
    try: is_kit = 1 if int(r["Ring"]) in (1,2) else 0
    except: is_kit = 0
    eml_rows.append({"Email":r["Email"],"First Name":r["First Name"],"Last Name":r["Last Name"],
        "Title":r["Title"],"Company Name":r["Company Name"],"Metro":r["Metro"],"Ring":r["Ring"],
        "isKitAccount":is_kit,"preScore":r["preScore"],"familyOwned":r["familyOwned"],
        "Apollo Account Id":r["Apollo Account Id"],"Keep? (y/n)":"","Notes":""})
eml_fields=["Email","First Name","Last Name","Title","Company Name","Metro","Ring","isKitAccount",
    "preScore","familyOwned","Apollo Account Id","Keep? (y/n)","Notes"]
with open(EML,"w",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f,fieldnames=eml_fields); w.writeheader(); w.writerows(eml_rows)

kit_r12 = sum(1 for r in rows if r["Ring"] in ("1","2"))
kit_acct = len({r["Apollo Account Id"] for r in rows if r["Ring"] in ("1","2")})
print(f"kit/call list: {len(rows)} people (Ring 1-2 kit-account people: {kit_r12} across {kit_acct} companies) -> {KIT}")
print(f"email list:    {len(eml_rows)} verified emails ({sum(e['isKitAccount'] for e in eml_rows)} are kit accounts) -> {EML}")
