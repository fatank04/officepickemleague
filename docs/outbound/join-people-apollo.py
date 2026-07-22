#!/usr/bin/env python3
"""
Join Apollo *people* exports into one deduped, scored, ring-labeled people list.

USAGE:
    1) consolidate-apollo.py first (builds ~/Downloads/opl-companies-master.csv — used for Ring + inMaster)
    2) pull people in Apollo (People tab, title/level filters per apollo-icp-spec.md), export to Downloads
    3) python3 docs/outbound/join-people-apollo.py

INPUT:  ~/Downloads/apollo-contacts-export*.csv
        ~/Downloads/opl-companies-master.csv   (optional — for Ring + inMaster tag)
OUTPUT: ~/Downloads/opl-people-master.csv

Self-contained: metro + pre-score come from each person row's own company fields (so people at companies
NOT in the vetted master still get scored). Keeps 2 per account (best buyer + best champion), flags geo
mis-tags (company HQ not in the metro), and pulls Ring from the master when the company is in it.
"""
import csv, glob, os, re, collections

PEOPLE = sorted(glob.glob(os.path.expanduser("~/Downloads/apollo-contacts-export*.csv")))
MASTER = os.path.expanduser("~/Downloads/opl-companies-master.csv")
OUT    = os.path.expanduser("~/Downloads/opl-people-master.csv")

# --- metro + scoring logic (mirror of consolidate-apollo.py) ---
PITT_AC={"412","724","878","814"}; PHILLY_AC={"215","267","445","484","610","835","856","609","302"}
NY_AC={"716","585"}; CLE_AC={"216","440","330","234"}; CIN_AC={"513","937","283"}
DET_AC={"313","248","586","734","947","810"}; BAL_AC={"410","443","667"}; MKE_AC={"414","262","920","608","715"}
AC_BY_WAVE={1:PITT_AC,2:NY_AC,3:CLE_AC,4:CIN_AC,5:PHILLY_AC,6:DET_AC,7:BAL_AC,8:MKE_AC}
CINCY_CITIES={"cincinnati","woodlawn","norwood","blue ash","mason","west chester","sharonville","fairfield","hamilton","milford","loveland","montgomery"}
PHILLY_CITIES={"philadelphia","reading","king of prussia","norristown","conshohocken","doylestown","bensalem","west chester","media","chester","lansdale","horsham","willow grove","fort washington","camden","vineland","wilmington","cherry hill"}
FAMILY_KW=["family owned","family-owned","family business","family-run","family operated","family-operated","family legacy","family tradition"]
SHIFT_KW=FAMILY_KW+["union","three shift","second shift","night shift","third shift","shift work"," shifts","plant ","plants","yard","dispatch","fleet","cdl","foreman","crew","loading dock","warehouse"]

def area_code(p):
    if not p: return ""
    m=re.search(r"\+?1?\D*(\d{3})\D*\d{3}\D*\d{4}",p); return m.group(1) if m else ""
def zip_of(addr):
    m=re.search(r"(\d{5})(?:-\d{4})?\s*$",(addr or "").strip()); return m.group(1) if m else ""
def metro_and_wave(state,city,phone,postal):
    st=(state or "").strip().lower(); ci=(city or "").strip().lower()
    z2=re.sub(r"\D","",postal or "")[:2]; ac=area_code(phone or "")
    if st=="pennsylvania":
        if z2 in ("19","18"): return ("Philadelphia",5)
        if z2 in ("15","16"): return ("Pittsburgh",1)
        if ac in PHILLY_AC: return ("Philadelphia",5)
        if ac in PITT_AC: return ("Pittsburgh",1)
        if ci in PHILLY_CITIES: return ("Philadelphia",5)
        return ("Pittsburgh",1)
    if st in ("new jersey","delaware"): return ("Philadelphia",5)
    if st=="new york": return ("Buffalo",2)
    if st=="michigan": return ("Detroit",6)
    if st=="maryland": return ("Baltimore",7)
    if st=="wisconsin": return ("Milwaukee/GreenBay",8)
    if st=="ohio": return ("Cincinnati",4) if ci in CINCY_CITIES else ("Cleveland",3)
    return ("OTHER (verify)",9)
def geo_ok(w,ac):
    if not ac or w not in AC_BY_WAVE: return True
    return ac in AC_BY_WAVE[w]
def size_fit(emp):
    try: e=int(str(emp).strip())
    except: return 0
    if 50<=e<=400: return 2
    if (25<=e<50) or (400<e<=1000): return 1
    return 0

def g(row,*names):
    for n in names:
        v=row.get(n)
        if v and str(v).strip(): return str(v).strip().lstrip("'")
    return ""
def classify(title):
    t=title.lower()
    if "vice" not in t and any(k in t for k in ["owner","president","chief executive"," ceo","founder","proprietor","managing partner","managing director","principal"]): return ("buyer",1)
    if "general manager" in t or re.search(r"\bgm\b",t): return ("buyer",1)
    if any(k in t for k in ["human resources","hr manager","hr director","people operations","head of people","chief people","people & culture","people and culture","talent acquisition"]): return ("buyer",2)
    if any(k in t for k in ["office manager","operations manager","operations director","director of operations","business manager","ops manager"]): return ("champion",3)
    return ("other",9)

ring_by_aid={}
if os.path.exists(MASTER):
    for r in csv.DictReader(open(MASTER,encoding="utf-8",errors="replace")):
        ring_by_aid[(r.get("Apollo Account Id") or "").strip()]=r.get("Ring","")

by_acct=collections.defaultdict(list); n_people=0
for path in PEOPLE:
    for row in csv.DictReader(open(path,encoding="utf-8",errors="replace")):
        n_people+=1
        aid=g(row,"Apollo Account Id")
        cstate=g(row,"Company State"); ccity=g(row,"Company City"); caddr=g(row,"Company Address")
        cphone=g(row,"Company Phone"); cemp=g(row,"# Employees")
        metro,wave=metro_and_wave(cstate,ccity,cphone,zip_of(caddr))
        ac=area_code(cphone); geoflag="" if geo_ok(wave,ac) else "VERIFY-LOCATION"
        if metro=="OTHER (verify)": geoflag="VERIFY-LOCATION"
        blob=(g(row,"Keywords")+" "+g(row,"Company Name")+" "+g(row,"Industry")).lower()
        familyOwned=1 if any(k in blob for k in FAMILY_KW) else 0
        shiftSignal=1 if any(k in blob for k in SHIFT_KW) else 0
        pre=shiftSignal+size_fit(cemp)
        role,prio=classify(g(row,"Title"))
        by_acct[aid].append({"aid":aid,"role":role,"prio":prio,"metro":metro,"wave":wave,"pre":pre,
            "familyOwned":familyOwned,"geoflag":geoflag,
            "first":g(row,"First Name"),"last":g(row,"Last Name"),"title":g(row,"Title"),
            "seniority":g(row,"Seniority"),"email":g(row,"Email"),"estatus":g(row,"Email Status"),
            "pphone":g(row,"Mobile Phone","Work Direct Phone","Corporate Phone","Other Phone"),
            "plink":g(row,"Person Linkedin Url"),"cid":g(row,"Apollo Contact Id"),
            "cname":g(row,"Company Name"),"caddr":caddr,"cphone":cphone})

selected=[]
for aid,plist in by_acct.items():
    plist.sort(key=lambda p:p["prio"])
    buyers=[p for p in plist if p["role"]=="buyer"]; champs=[p for p in plist if p["role"]=="champion"]
    picks=[]
    if buyers: picks.append(buyers[0])
    if champs: picks.append(champs[0])
    for p in plist:
        if len(picks)>=2: break
        if p not in picks: picks.append(p)
    selected+=picks[:2]

out_fields=["Wave","Metro","Ring","inMaster","preScore","familyOwned","GeoFlag","Role","Company Name",
    "Company Address","Company Phone","First Name","Last Name","Title","Seniority","Email","Email Status",
    "Person Phone","Person Linkedin","Apollo Account Id","Apollo Contact Id","Keep? (y/n)","Notes"]
recs=[]
for p in selected:
    recs.append({"Wave":p["wave"] if p["wave"]!=9 else "","Metro":p["metro"],
        "Ring":ring_by_aid.get(p["aid"],""),"inMaster":1 if p["aid"] in ring_by_aid else 0,
        "preScore":p["pre"],"familyOwned":p["familyOwned"],"GeoFlag":p["geoflag"],"Role":p["role"],
        "Company Name":p["cname"],"Company Address":p["caddr"],"Company Phone":p["cphone"],
        "First Name":p["first"],"Last Name":p["last"],"Title":p["title"],"Seniority":p["seniority"],
        "Email":p["email"],"Email Status":p["estatus"],"Person Phone":p["pphone"],"Person Linkedin":p["plink"],
        "Apollo Account Id":p["aid"],"Apollo Contact Id":p["cid"],"Keep? (y/n)":"","Notes":""})
def _sk(x):
    try: wv=int(x["Wave"])
    except: wv=99
    rg=x["Ring"] if x["Ring"]!="" else 9
    try: rg=int(rg)
    except: rg=9
    return (wv,rg,x["Company Name"].lower(),{"buyer":0,"champion":1,"other":2}.get(x["Role"],3))
recs.sort(key=_sk)

with open(OUT,"w",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f,fieldnames=out_fields); w.writeheader(); w.writerows(recs)

roles=collections.Counter(r["Role"] for r in recs)
metros=collections.Counter(r["Metro"] for r in recs)
flagged=sum(1 for r in recs if r["GeoFlag"])
withemail=sum(1 for r in recs if r["Email"] and r["Email Status"].lower()=="verified")
print(f"People rows read: {n_people} | accounts: {len(by_acct)} | selected (<=2/acct): {len(recs)}")
print(f"Roles: {dict(roles)}")
print(f"By metro: {dict(sorted(metros.items()))}")
print(f"Geo-flagged (cut, wrong-metro HQ): {flagged} | verified-email: {withemail}")
print(f"Wrote: {OUT}")
