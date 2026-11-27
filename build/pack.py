import csv,json,math,sys
D=sys.argv[1]; OUT=sys.argv[2]
rd=lambda f:list(csv.DictReader(open(f'{D}/tables/{f}',encoding='utf-8-sig')))
def hav(a,b,c,d):
    a,b,c,d=map(math.radians,(a,b,c,d));return 6371*2*math.asin(math.sqrt(math.sin((c-a)/2)**2+math.cos(a)*math.cos(c)*math.sin((d-b)/2)**2))
f=lambda x:float(x) if x not in ('',None) else None
pm=rd('places_master.csv'); ra={r['place']:r for r in rd('road_access.csv')}
stays=[s for s in rd('gmaps_stays.csv') if s['lat'] and 'hotel' in s['google_type'].lower() or s['kind']=='stay']
stays=[s for s in stays if s['lat'] and not any(w in s['google_type'].lower() for w in ('view point','park','attraction','temple'))]
food=[s for s in rd('gmaps_food.csv') if s['lat']]
attr=[s for s in rd('gmaps_attractions.csv') if s['lat']]
places=[]
for p in pm:
    lat,lon=f(p['lat']),f(p['lon'])
    o={'n':p['place'],'alt':[a.strip() for a in p['other_names'].split(';') if a.strip()],'kind':p['kind'],'area':p['cluster']}
    if lat is not None:
        def near(rows,k,km):
            out=[]
            for s in rows:
                dd=hav(lat,lon,float(s['lat']),float(s['lon']))
                if dd<=km: out.append((int(s['review_count'] or 0),s,dd))
            out.sort(key=lambda x:-x[0]);seen=set();res=[]
            for rc,s,dd in out:
                if s['name'] in seen: continue
                seen.add(s['name']);res.append(s|{'_km':dd})
                if len(res)>=k:break
            return res
        o['stays']=[[s['name'],s['google_type'],int(float(s['price_from_inr'])) if s['price_from_inr'] else None,round(s['_km'],1)] for s in near(stays,4,5)]
        o['food']=[[s['name'],round(s['_km'],1)] for s in near(food,3,5)]
        o['see']=[[s['name'],round(s['_km'],1)] for s in near(attr,4,10)]
    if p['nearest_station']: o['stn']=[p['nearest_station'],f(p['station_km'])]
    if p['nearest_bus_stand']: o['bus']=[p['nearest_bus_stand'],f(p['bus_stand_km'])]
    if p['nearest_hospital']: o['hosp']=[p['nearest_hospital'],f(p['hospital_km'])]
    o['atm5']=int(p['atm_bank_within_5km'] or 0);o['fuel10']=int(p['fuel_pumps_within_10km'] or 0)
    r=ra.get(p['place'])
    if r:
        road={}
        for k,lab in (('New_Jalpaiguri','NJP'),('Bagdogra','Bagdogra airport'),('Siliguri','Siliguri'),('New_Mal_Junction','New Mal Jn'),('Hasimara','Hasimara'),('Alipurduar','Alipurduar')):
            if r.get('km_from_'+k): road[lab]=[f(r['km_from_'+k]),f(r['min_from_'+k])]
        o['road']=road
        if r['three_nearest_places_by_road']: o['nearby']=r['three_nearest_places_by_road']
    places.append(o)
saf=[]
for s in rd('safari_routes_official.csv'):
    saf.append({k:s[k] for k in ('wildlife_division','safari_type','safari_name','reporting_place','slot','slot_start','slot_end','reporting_time','total_rate_inr','rate_category','max_persons_per_booking','checked_on')})
gr=[{k:r[k] for k in ('from','to','google_road_km','google_drive_time','via')} for r in rd('key_routes_google.csv')]
js='/* Generated from the Dooars master database (15 Nov 2026) by build/pack.py. Do not edit by hand.\n   Sources: OpenStreetMap, Wikidata, WBSFDA safari booking site, Google Maps (names, types and listed prices only; ratings used for ordering, never shown). */\n'
js+='window.PLACES='+json.dumps(places,ensure_ascii=False,separators=(',',':'))+';\n'
js+='window.SAFARI='+json.dumps(saf,ensure_ascii=False,separators=(',',':'))+';\n'
js+='window.ROUTES='+json.dumps(gr,ensure_ascii=False,separators=(',',':'))+';\n'
open(OUT,'w',encoding='utf-8').write(js)
print(len(places),len(saf),len(gr),len(js))
