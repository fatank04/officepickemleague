#!/usr/bin/env python3
"""
Consolidate rolling Apollo *account* exports into one deduped, metro-bucketed, pre-scored master CSV.

USAGE:
    python3 docs/outbound/consolidate-apollo.py

INPUT:  every ~/Downloads/apollo-accounts-export*.csv  (Apollo "Companies" export, any # of pages/cities)
OUTPUT: ~/Downloads/opl-companies-master.csv           (import into Google Sheets: File > Import > Replace)

What it does:
  - dedup by Apollo Account Id (fallback: company+city)
  - bucket each company into a metro/wave by State + ZIP (see metro_and_wave)
  - GeoFlag = VERIFY-LOCATION when the phone area code doesn't match the metro
    (catches Apollo mis-tags like "Philadelphia MS" and toll-free 800 numbers)
  - pre-score (auto, company-level): preScore = sizeFit(0-2) + shiftSignal(0/1)  -> 0..3
    plus helper flags familyOwned (owner-is-buyer) and hasSocials (footballSignal candidate)

Manual / later layers (NOT computed here): footballSignal (check their socials),
roleFit + fanSignal (need people pulled first). See refinement-schema.md.

TO ADD A NEW METRO: add its area-code set + one line in metro_and_wave() (by State, split by ZIP if
the state has two target metros like PA=Pittsburgh/Philadelphia).
"""
import csv, glob, os, re, collections

SRC = sorted(glob.glob(os.path.expanduser("~/Downloads/apollo-accounts-export*.csv")))
OUT = os.path.expanduser("~/Downloads/opl-companies-master.csv")

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

rows,per_file={},{}
for path in SRC:
    n=0
    with open(path,newline="",encoding="utf-8",errors="replace") as f:
        for r in csv.DictReader(f):
            n+=1; aid=(r.get("Apollo Account Id") or "").strip()
            key=aid or (r.get("Company Name","").strip().lower()+"|"+r.get("Company City","").strip().lower())
            if key and key not in rows: rows[key]=r
    per_file[os.path.basename(path)]=n

out_fields=["Wave","Metro","Ring","preScore","sizeFit","shiftSignal","familyOwned","hasSocials","GeoFlag",
    "Company Name","# Employees","Industry","City","State","Company Address","Company Phone","Website","Company Linkedin Url",
    "Founded Year","Annual Revenue","Short Description","Apollo Account Id",
    "footballSignal (manual)","roleFit (after people)","Keep? (y/n)","Notes"]
recs=[]; wave_counts=collections.Counter(); flags=0; score_hist=collections.Counter(); fam=0
for r in rows.values():
    metro,wave=metro_and_wave(r.get("Company State"),r.get("Company City"),r.get("Company Phone"),r.get("Company Postal Code"))
    ac=area_code(r.get("Company Phone","")); flag="" if geo_ok(wave,ac) else "VERIFY-LOCATION"
    if flag: flags+=1
    blob=" ".join([r.get("Keywords","") or "", r.get("Short Description","") or "", r.get("Company Name","") or "", r.get("Industry","") or ""]).lower()
    familyOwned=1 if any(k in blob for k in FAMILY_KW) else 0
    shiftSignal=1 if any(k in blob for k in SHIFT_KW) else 0
    sf=size_fit(r.get("# Employees",""))
    hasSoc=1 if ((r.get("Facebook Url","") or "").strip() or (r.get("Twitter Url","") or "").strip()) else 0
    pre=shiftSignal+sf
    if wave!=9: score_hist[pre]+=1; fam+=familyOwned
    desc=(r.get("Short Description") or "").replace("\n"," ").strip()
    if len(desc)>200: desc=desc[:197]+"..."
    recs.append({"Wave":wave,"Metro":metro,"Ring":"","preScore":pre,"sizeFit":sf,"shiftSignal":shiftSignal,
        "familyOwned":familyOwned,"hasSocials":hasSoc,"GeoFlag":flag,
        "Company Name":r.get("Company Name","").strip(),"# Employees":r.get("# Employees",""),
        "Industry":r.get("Industry",""),"City":r.get("Company City",""),"State":r.get("Company State",""),
        "Company Address":r.get("Company Address",""),
        "Company Phone":(r.get("Company Phone","") or "").lstrip("'"),"Website":r.get("Website",""),
        "Company Linkedin Url":r.get("Company Linkedin Url",""),"Founded Year":r.get("Founded Year",""),
        "Annual Revenue":r.get("Annual Revenue",""),"Short Description":desc,
        "Apollo Account Id":r.get("Apollo Account Id",""),"footballSignal (manual)":"",
        "roleFit (after people)":"","Keep? (y/n)":"","Notes":""})
    wave_counts[(wave,metro)]+=1

recs.sort(key=lambda x:(x["Wave"], -x["preScore"], -x["familyOwned"], x["Company Name"].lower()))
# Ring = within-metro rank by fit: top 20 -> 1 (kit+call), next 30 -> 2 (kit+call), rest -> 3 (email pool)
_rank=collections.Counter()
for x in recs:
    if x["Wave"]==9: continue
    _rank[x["Wave"]]+=1; rk=_rank[x["Wave"]]
    x["Ring"]=1 if rk<=20 else (2 if rk<=50 else 3)
with open(OUT,"w",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f,fieldnames=out_fields); w.writeheader(); w.writerows(recs)

tot=sum(per_file.values()); scored=sum(score_hist.values())
print(f"Files: {len(per_file)} | rows: {tot} | unique: {len(recs)} | geo-flags: {flags}")
print("=== by metro ===")
for (wv,mt),c in sorted(wave_counts.items()): print(f"  W{wv} {mt}: {c}")
print("=== preScore distribution (0-3, target metros only) ===")
for s in (3,2,1,0): print(f"  {s}: {score_hist.get(s,0)}")
print(f"  family-owned: {fam}/{scored}  ({100*fam//max(scored,1)}%)")
print(f"Wrote: {OUT}")
