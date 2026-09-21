import { ASPECT_DEFINITIONS, HOUSE_MEANINGS, getNakshatra, getSignData } from './astro';

const PRIORITY_HOUSES=[1,3,7,9];
const norm=n=>((Number(n)%360)+360)%360;
const angularDistance=(a,b)=>Math.abs(((norm(a)-norm(b)+540)%360)-180);

function bestAspect(a,b,definitions=ASPECT_DEFINITIONS,orbCap=null){
  if(!Number.isFinite(Number(a))||!Number.isFinite(Number(b)))return null;
  const separation=angularDistance(a,b);
  let best=null;
  for(const def of definitions){
    const allowed=orbCap==null?def.orb:Math.min(def.orb,orbCap);
    const delta=Math.abs(separation-def.angle);
    if(delta<=allowed&&(!best||delta<best.orb))best={type:def.type,angle:def.angle,orb:Number(delta.toFixed(2)),separation:Number(separation.toFixed(2))};
  }
  return best;
}

function aspectPhase(transit,target,aspect){
  const speed=Number(transit?.longitudeSpeed);
  if(!aspect||!Number.isFinite(speed)||Math.abs(speed)<1e-6)return 'exact/static';
  const now=Math.abs(angularDistance(transit.siderealLon,target)-aspect.angle);
  const later=Math.abs(angularDistance(Number(transit.siderealLon)+speed*.25,target)-aspect.angle);
  if(now<=.12)return 'exact';
  return later<now?'applying':'separating';
}

function serializePlanet(p){
  if(!p)return null;
  return {id:p.id,name:p.name,glyph:p.glyph,sign:p.sign,degree:Number(p.degree),siderealLon:Number(p.siderealLon),house:Number(p.house),nakshatra:p.nakshatra?.name||p.nakshatra||null,pada:p.nakshatra?.pada||p.pada||null,retrograde:Boolean(p.retrograde),longitudeSpeed:Number(p.longitudeSpeed)||0,condition:p.condition?.label||p.condition||null};
}

function houseContexts(natalChart,houseLords){
  if(!natalChart?.houseCusps?.length)return[];
  return natalChart.houseCusps.map((cusp,i)=>{
    const house=i+1;
    const sign=getSignData(cusp);
    const nak=getNakshatra(cusp);
    const occupants=(natalChart.planets||[]).filter(p=>Number(p.house)===house).map(serializePlanet);
    const lord=(houseLords||[]).find(h=>Number(h.house)===house)||null;
    return {house,cusp:Number(cusp),sign:sign.sign,degree:sign.degreeDecimal,nakshatra:nak.name,pada:nak.pada,occupants,lord:lord?{house:lord.house,lordId:lord.lordId,lordName:lord.lordName,lordHouse:lord.lordHouse,lordSign:lord.lordSign,lordNakshatra:lord.lordNakshatra?.name||lord.lordNakshatra||null}:null,topics:HOUSE_MEANINGS[house]?.topics||[]};
  });
}

function transitToHouseEvidence(chart,contexts){
  const out=[];
  for(const t of chart?.planets||[]){
    for(const h of contexts){
      const aspect=bestAspect(t.siderealLon,h.cusp,ASPECT_DEFINITIONS,4);
      if(aspect)out.push({transit:serializePlanet(t),house:h.house,houseContext:h,aspect:{...aspect,phase:aspectPhase(t,h.cusp,aspect)}});
    }
  }
  return out.sort((a,b)=>a.aspect.orb-b.aspect.orb);
}

function transitToNatalPlanetEvidence(chart,natalChart){
  const out=[];
  for(const t of chart?.planets||[]){
    for(const n of natalChart?.planets||[]){
      const aspect=bestAspect(t.siderealLon,n.siderealLon);
      if(aspect)out.push({transit:serializePlanet(t),natal:serializePlanet(n),aspect:{...aspect,phase:aspectPhase(t,n.siderealLon,aspect)}});
    }
  }
  return out.sort((a,b)=>a.aspect.orb-b.aspect.orb);
}

function currentTransitAspectsForPlanet(chart,planetId){
  const p=(chart?.planets||[]).find(x=>x.id===planetId);if(!p)return[];
  const out=[];
  for(const other of chart.planets||[]){
    if(other.id===planetId)continue;
    const aspect=bestAspect(p.siderealLon,other.siderealLon);
    if(aspect)out.push({with:serializePlanet(other),aspect});
  }
  return out.sort((a,b)=>a.aspect.orb-b.aspect.orb);
}

function buildLordChains(chart,natalChart,houseLords,houseEvidence,planetEvidence){
  return PRIORITY_HOUSES.map(house=>{
    const natalLord=(houseLords||[]).find(x=>Number(x.house)===house)||null;
    if(!natalLord)return {house,missing:true};
    const transitLord=(chart?.planets||[]).find(p=>p.id===natalLord.lordId)||null;
    const toNatalLord=planetEvidence.filter(x=>x.natal?.id===natalLord.lordId).slice(0,8);
    const fromTransitLordToNatal=planetEvidence.filter(x=>x.transit?.id===natalLord.lordId).slice(0,8);
    const fromTransitLordToHouses=houseEvidence.filter(x=>x.transit?.id===natalLord.lordId).slice(0,8);
    return {house,topics:HOUSE_MEANINGS[house]?.topics||[],natalLord:{lordId:natalLord.lordId,lordName:natalLord.lordName,natalHouse:natalLord.lordHouse,natalSign:natalLord.lordSign,natalNakshatra:natalLord.lordNakshatra?.name||natalLord.lordNakshatra||null},currentTransitPlacement:serializePlanet(transitLord),aspectsToNatalLord:toNatalLord,aspectsFromCurrentLordToNatalPlanets:fromTransitLordToNatal,aspectsFromCurrentLordToNatalHouses:fromTransitLordToHouses,currentTransitAspects:currentTransitAspectsForPlanet(chart,natalLord.lordId).slice(0,8)};
  });
}

function normalizeField(field,label){
  if(!field||!Number.isFinite(Number(field.longitude)))return null;
  return {label,longitude:Number(field.longitude),house:Number(field.house)||null,sign:field.sign||getSignData(field.longitude).sign,nakshatra:field.nakshatra?.name||field.nakshatra||getNakshatra(field.longitude).name,pada:field.nakshatra?.pada||field.pada||getNakshatra(field.longitude).pada};
}

function fieldAspects(chart,field){
  if(!field)return[];
  return (chart?.planets||[]).map(p=>{const aspect=bestAspect(p.siderealLon,field.longitude,ASPECT_DEFINITIONS,4);return aspect?{planet:serializePlanet(p),aspect:{...aspect,phase:aspectPhase(p,field.longitude,aspect)}}:null}).filter(Boolean).sort((a,b)=>a.aspect.orb-b.aspect.orb);
}

function moonEvidence(chart,natalChart,lordChains,currentField,destinationField){
  const transitMoon=(chart?.planets||[]).find(p=>p.id==='moon');
  const natalMoon=(natalChart?.planets||[]).find(p=>p.id==='moon');
  const moonToNatalMoon=transitMoon&&natalMoon?bestAspect(transitMoon.siderealLon,natalMoon.siderealLon):null;
  const lordIds=new Set(lordChains.map(x=>x.natalLord?.lordId).filter(Boolean));
  const moonToPriorityLords=[];
  if(transitMoon){
    for(const n of natalChart?.planets||[]){
      if(!lordIds.has(n.id))continue;
      const aspect=bestAspect(transitMoon.siderealLon,n.siderealLon);
      if(aspect)moonToPriorityLords.push({natalLord:serializePlanet(n),houses:lordChains.filter(x=>x.natalLord?.lordId===n.id).map(x=>x.house),aspect:{...aspect,phase:aspectPhase(transitMoon,n.siderealLon,aspect)}});
    }
  }
  return {natalMoon:serializePlanet(natalMoon),transitMoon:serializePlanet(transitMoon),moonToNatalMoon:moonToNatalMoon?{...moonToNatalMoon,phase:aspectPhase(transitMoon,natalMoon.siderealLon,moonToNatalMoon)}:null,moonToPriorityLords,currentLocation:{field:currentField,aspects:transitMoon&&currentField?fieldAspects({planets:[transitMoon]},currentField):[]},destination:{field:destinationField,aspects:transitMoon&&destinationField?fieldAspects({planets:[transitMoon]},destinationField):[]}};
}

export function buildPredictionFormulaEvidence({chart,natalChart,houseLords,currentZone,destinationZone,routeContext}){
  if(!chart?.planets?.length||!natalChart?.planets?.length)return null;
  const houses=houseContexts(natalChart,houseLords);
  const transitHouseEvidence=transitToHouseEvidence(chart,houses);
  const transitNatalPlanetEvidence=transitToNatalPlanetEvidence(chart,natalChart);
  const lordChains=buildLordChains(chart,natalChart,houseLords,transitHouseEvidence,transitNatalPlanetEvidence);
  const currentField=normalizeField(currentZone||routeContext?.start,'current location');
  const destinationField=normalizeField(destinationZone||routeContext?.end,'destination');
  const routeFields=(routeContext?.fieldTransitions||[]).map((f,i)=>normalizeField(f,`route transition ${i+1}`)).filter(Boolean);
  return {
    formulaVersion:'astrowalk-route-synthesis-1',
    priorityHouses:PRIORITY_HOUSES,
    natalHouseContexts:houses,
    transitToNatalHouses:transitHouseEvidence,
    transitToNatalPlanets:transitNatalPlanetEvidence,
    routeLordChains:lordChains,
    currentLocation:{field:currentField,aspects:fieldAspects(chart,currentField)},
    destination:{field:destinationField,aspects:fieldAspects(chart,destinationField)},
    route:{start:currentField,end:destinationField,fieldTransitions:routeFields,houseSequence:routeContext?.houseSequence||[],nakshatraSequence:routeContext?.nakshatraSequence||[],gandanta:routeContext?.gandanta||[]},
    moon:moonEvidence(chart,natalChart,lordChains,currentField,destinationField)
  };
}
