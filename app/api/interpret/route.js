import { FALLBACK_VOCABULARY } from '../../../src/server/vocabulary.js';
import { buildEventDrivenPrediction } from '../../../src/server/eventSynthesis.js';

const VALID_CATEGORIES=['people','events','qualities','places','objects'];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

function normalizeEntries(value){
  if(!Array.isArray(value))return[];
  return value.map(item=>{
    if(typeof item==='string')return {term:item.trim(),weight:.65};
    if(item&&typeof item.term==='string')return {term:item.term.trim(),weight:clamp(Number(item.weight)||.65,0,1)};
    return null;
  }).filter(x=>x?.term);
}

function mergePlanetBank(base={},custom={}){
  const out={};
  for(const category of VALID_CATEGORIES){
    const privateEntries=normalizeEntries(custom?.[category]);
    out[category]=privateEntries.length?privateEntries:normalizeEntries(base?.[category]);
  }
  return out;
}

function readVocabulary(){
  let privateVocabulary={};
  try{
    if(process.env.PLANET_VOCAB_JSON)privateVocabulary=JSON.parse(process.env.PLANET_VOCAB_JSON);
  }catch(error){
    console.error('PLANET_VOCAB_JSON could not be parsed. Falling back to built-in terminology.',error);
  }
  const result={};
  const planets=new Set([...Object.keys(FALLBACK_VOCABULARY),...Object.keys(privateVocabulary||{})]);
  for(const planet of planets)result[planet]=mergePlanetBank(FALLBACK_VOCABULARY[planet],privateVocabulary?.[planet]);
  return result;
}

function natalUsage(body){
  return {
    natalAsc:Number(body.natalAsc),
    natalPlanetCount:Array.isArray(body.natalPlanets)?body.natalPlanets.length:0,
    natalHouseCount:Array.isArray(body.natalHouseCusps)?body.natalHouseCusps.length:0,
    houseLordCount:Array.isArray(body.houseLords)?body.houseLords.length:0,
    transitNatalAspectCount:Array.isArray(body.transitNatalAspects)?body.transitNatalAspects.length:0,
    transitNatalHouseAspectCount:Array.isArray(body.natalHouseAspects)?body.natalHouseAspects.length:0,
    verified:Boolean(
      Number.isFinite(Number(body.natalAsc))&&
      Array.isArray(body.natalPlanets)&&body.natalPlanets.length>=9&&
      Array.isArray(body.natalHouseCusps)&&body.natalHouseCusps.length===12
    )
  };
}

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function POST(request){
  try{
    const body=await request.json();
    if(!Array.isArray(body.planets)||!body.planets.length){
      return Response.json({error:'No planetary data supplied'},{status:400});
    }
    if(!body.formulaEvidence){
      return Response.json({error:'Prediction evidence was not supplied'},{status:400});
    }

    const vocabulary=readVocabulary();
    const predictionCenter=buildEventDrivenPrediction(body,vocabulary);

    return Response.json({
      summary:predictionCenter.overallProse,
      predictionCenter,
      formulaEvidence:body.formulaEvidence,
      destinationZone:body.destinationZone||{},
      transitNatalAspects:body.transitNatalAspects||[],
      natalUsage:natalUsage(body),
      modelVersion:'astrowalk-3.7.6-neuro-experiential-vedic-prose'
    });
  }catch(error){
    console.error('Event-driven interpretation failed',error);
    return Response.json({error:'Interpretation failed'},{status:500});
  }
}
