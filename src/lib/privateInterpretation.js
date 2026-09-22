import { calculateAspects, aspectsForPlanet, calculateTransitNatalAspects, calculateTransitHouseAspects, destinationZoneFromBearing } from './astro';
import { buildPredictionFormulaEvidence } from './predictionFormula';

const PRIVATE_VOCAB_KEY='astrowalk_private_vocab_v2';

function readPrivateVocabulary(){
  if(typeof window==='undefined')return null;
  try{
    const raw=window.localStorage.getItem(PRIVATE_VOCAB_KEY);
    if(!raw)return null;
    const parsed=JSON.parse(raw);
    return parsed?.vocabulary&&typeof parsed.vocabulary==='object'?parsed.vocabulary:null;
  }catch{
    return null;
  }
}

export async function requestPrivateInterpretation({chart,natalChart,houseLords,origin,destination,bearing,direction,distanceKm,selectedDate,focusHouses=[],focusLords=[],relocationCurrent=[],relocationDestination=[],localSpaceContacts=[],routeContext=null,currentZone=null}){
  if(!chart?.planets?.length||!natalChart?.planets?.length)return null;
  const transitAspects=calculateAspects(chart.planets);
  const transitNatalAspects=calculateTransitNatalAspects(chart.planets,natalChart.planets);
  const natalHouseAspects=calculateTransitHouseAspects(chart.planets,natalChart.houseCusps);
  const zone=destinationZoneFromBearing(chart,bearing);
  const formulaEvidence=buildPredictionFormulaEvidence({chart,natalChart,houseLords,currentZone,destinationZone:zone,routeContext});
  const planets=chart.planets.map(p=>({
    id:p.id,name:p.name,glyph:p.glyph,sign:p.sign,degree:Number(p.degree),siderealLon:p.siderealLon,house:p.house,
    nakshatra:p.nakshatra?.name,pada:p.nakshatra?.pada,retrograde:p.retrograde,longitudeSpeed:Number(p.longitudeSpeed)||0,
    condition:p.condition?.label,conditionStrength:p.condition?.strength,aspects:aspectsForPlanet(p.id,transitAspects)
  }));
  const natalPlanets=natalChart.planets.map(p=>({id:p.id,name:p.name,sign:p.sign,degree:Number(p.degree),siderealLon:p.siderealLon,house:p.house,nakshatra:p.nakshatra?.name,pada:p.nakshatra?.pada}));
  const privateVocabulary=readPrivateVocabulary();
  const response=await fetch('/api/interpret',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    date:selectedDate?.toISOString?.()||String(selectedDate||''),
    origin:{lat:origin?.lat,lng:origin?.lng},destination:{lat:destination?.lat,lng:destination?.lng},bearing,direction,distanceKm,
    destinationZone:zone,currentZone,planets,natalPlanets,houseLords,transitNatalAspects,natalHouseAspects,
    natalAsc:natalChart.asc,natalHouseCusps:natalChart.houseCusps,focusHouses,focusLords,relocationCurrent,relocationDestination,localSpaceContacts,routeContext,formulaEvidence,
    privateVocabulary
  })});
  if(!response.ok)throw new Error('Private interpretation service unavailable');
  return response.json();
}
