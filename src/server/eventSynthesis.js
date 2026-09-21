const PRIORITY_HOUSES = [1,3,7,9];
const SIGN_LORDS = {
  Aries:'mars', Taurus:'venus', Gemini:'mercury', Cancer:'moon', Leo:'sun', Virgo:'mercury',
  Libra:'venus', Scorpio:'mars', Sagittarius:'jupiter', Capricorn:'saturn', Aquarius:'saturn', Pisces:'jupiter'
};

const HOUSE_EVENT_MODEL = {
  1:{domain:'self', actors:['someone reacting directly to you','a person whose response changes your next decision'], actions:['forces a personal decision','puts you in the position of initiating or refusing something','requires you to respond immediately'], objects:['your schedule','your appearance or presentation','a personal choice'], places:['the immediate surroundings']},
  2:{domain:'money and speech', actors:['a cashier, family member, financial contact, or person discussing money'], actions:['raises a payment, price, possession, or family-resource matter','requires careful wording or a financial decision'], objects:['money','a purchase','a bill','a possession','a conversation'], places:['a shop, counter, bank, or family setting']},
  3:{domain:'messages and local logistics', actors:['a driver, neighbor, sibling, courier, merchant, dispatcher, or local contact'], actions:['sends information that changes the plan','creates a scheduling or directions issue','requires a reply, correction, detour, repair, or quick decision'], objects:['a message','phone','document','vehicle','directions','appointment'], places:['a street, shop, parking area, transit point, or nearby business']},
  4:{domain:'home and property', actors:['a family member, resident, property contact, or caretaker'], actions:['brings up a home, property, vehicle-parking, family, or private matter'], objects:['a key','property','home item','vehicle location'], places:['a residence, property, parking area, or private place']},
  5:{domain:'children, creativity, pleasure and study', actors:['a child, student, romantic interest, performer, or creative person'], actions:['draws attention to recreation, study, attraction, performance, or a personal risk'], objects:['a ticket','creative item','school material','entertainment purchase'], places:['a school, entertainment venue, park, restaurant, or creative space']},
  6:{domain:'work, service, health and conflict', actors:['a worker, service provider, coworker, technician, medical worker, or opponent'], actions:['creates a service problem, repair, obligation, queue, dispute, or health-related interruption'], objects:['work equipment','medicine','bill','repair item','service order'], places:['a workplace, clinic, repair shop, service counter, or administrative office']},
  7:{domain:'other people and agreements', actors:['a partner, client, customer, contractor, competitor, stranger, or negotiating party'], actions:['asks for agreement, clarification, cooperation, payment, or a change of terms','creates a direct negotiation, disagreement, request, or exchange'], objects:['an agreement','appointment','contract','purchase','promise','shared decision'], places:['a business, meeting place, counter, office, restaurant, or public setting']},
  8:{domain:'shared resources and hidden complications', actors:['a financial contact, investigator, specialist, insurer, or person holding information'], actions:['reveals a hidden condition, shared-cost issue, obligation, or sudden complication'], objects:['shared money','insurance','debt','private information','account access'], places:['a financial, medical, restricted, or private setting']},
  9:{domain:'guidance, institutions and long-range matters', actors:['an adviser, teacher, official, lawyer, mentor, traveler, or institutional contact'], actions:['provides or withholds guidance, permission, instruction, documentation, or a broader opportunity','forces a decision involving rules, travel, study, law, or unfamiliar territory'], objects:['documents','tickets','credentials','legal or educational material'], places:['a school, court, government office, religious place, airport, station, or unfamiliar district']},
 10:{domain:'authority, career and public responsibility', actors:['a manager, authority figure, employer, official, or public-facing professional'], actions:['creates a work, status, responsibility, deadline, or authority-related development'], objects:['work documents','badge','schedule','official instruction'], places:['a workplace, government office, public building, or professional setting']},
 11:{domain:'networks, income and goals', actors:['a friend, colleague, group member, customer, or network contact'], actions:['opens or complicates a connection, invitation, payment, goal, or group matter'], objects:['payment','invitation','message','membership item'], places:['a group venue, workplace, online/network setting, or social gathering']},
 12:{domain:'expenses, retreat and foreign/private matters', actors:['a foreign contact, hospital/retreat worker, isolated person, or someone operating privately'], actions:['creates an expense, delay, withdrawal, loss, private matter, or need to disengage'], objects:['expense','receipt','lost item','private message','travel item'], places:['a hospital, hotel, retreat, secluded place, foreign setting, or behind-the-scenes area']}
};

const PLANET_FUNCTION = {
  sun:{verbs:['authorizes','makes visible','puts pressure on','requires a clear decision about'], conditions:['visibility','authority','pride','recognition']},
  moon:{verbs:['brings immediate attention to','makes emotionally noticeable','changes the tone around'], conditions:['mood','public response','family','care']},
  mercury:{verbs:['communicates about','revises','redirects','questions','documents'], conditions:['information','timing','paperwork','devices','directions']},
  venus:{verbs:['offers','softens','attracts','negotiates','spends on'], conditions:['agreement','comfort','money','social interest','attraction']},
  mars:{verbs:['pressures','accelerates','cuts into','forces action on','repairs'], conditions:['urgency','conflict','mechanical issues','competition','physical effort']},
  jupiter:{verbs:['expands','advises on','approves','opens an opportunity around','raises expectations about'], conditions:['guidance','law','education','opportunity','judgment']},
  saturn:{verbs:['delays','restricts','formalizes','requires proof for','makes you wait on'], conditions:['obligation','rules','time','maintenance','bureaucracy']},
  rahu:{verbs:['amplifies','complicates through novelty','introduces an unfamiliar element into','makes unusually compelling'], conditions:['foreignness','technology','ambition','novelty','exaggeration']},
  ketu:{verbs:['separates from','cuts short','reduces interest in','specializes'], conditions:['detachment','ending','precision','withdrawal']},
  uranus:{verbs:['disrupts','changes suddenly','reroutes','introduces an unexpected technical factor into'], conditions:['surprise','technology','instability','independence']},
  neptune:{verbs:['blurs','idealizes','confuses','sensitizes'], conditions:['uncertainty','misreading','inspiration','unclear boundaries']},
  pluto:{verbs:['intensifies','exposes','forces a deeper change in','reveals what was hidden in'], conditions:['control','secrecy','power','transformation']}
};

const NAKSHATRA_MODIFIERS = {
  Ashwini:['quick start','rapid intervention','healing or repair','something beginning suddenly'], Bharani:['pressure to carry or finish something','consequence','containment','a difficult obligation'], Krittika:['cutting away what is unnecessary','correction','heat','a decisive separation'], Rohini:['growth','comfort','attraction','material development'], Mrigashira:['searching','questioning','changing direction','looking for something or someone'], Ardra:['disruption','stormy emotion','breakdown before correction','intense information'], Punarvasu:['return','restoration','second chance','getting back on course'], Pushya:['support','care','instruction','nourishment'], Ashlesha:['entanglement','persuasion','hidden motives','binding conditions'], Magha:['status','ancestry','authority','recognition'], 'Purva Phalguni':['pleasure','social contact','agreement','relaxation'], 'Uttara Phalguni':['contract','commitment','assistance','formal agreement'], Hasta:['skill','handling an object','fixing or arranging something','manual precision'], Chitra:['design','repair','appearance','construction or visible correction'], Swati:['independence','trade','wind or movement','negotiation'], Vishakha:['goal pressure','competition','choosing between paths','achievement'], Anuradha:['alliance','friendship','cooperation','devotion'], Jyeshtha:['seniority','protection','control','responsibility'], Mula:['root cause','removal','investigation','starting over'], 'Purva Ashadha':['assertion','persuasion','victory effort','declaration'], 'Uttara Ashadha':['final decision','lasting result','responsibility','institutional authority'], Shravana:['listening','message','instruction','learning from what is heard'], Dhanishta:['timing','group activity','money or resource rhythm','public coordination'], Shatabhisha:['diagnosis','technology','isolation','repair or healing'], 'Purva Bhadrapada':['intensity','extreme commitment','sacrifice','serious turn'], 'Uttara Bhadrapada':['stability after difficulty','depth','endurance','settlement'], Revati:['completion','safe passage','guidance','final adjustment before arrival']
};

const ASPECT_WEIGHT={Conjunction:1.2,Opposition:1.05,Square:1,Trine:.86,Sextile:.72,Quincunx:.74};
const PHASE_WEIGHT={applying:.25,exact:.35,'exact/static':.28,separating:-.08};
const PRIORITY_WEIGHT={1:.45,3:.6,7:.65,9:.5};
const BENEFIC = new Set(['jupiter','venus']);
const CHALLENGING = new Set(['mars','saturn','rahu','ketu']);
const uniq=a=>[...new Set((a||[]).filter(Boolean))];
const cap=s=>{const v=String(s||'').trim();return v?v[0].toUpperCase()+v.slice(1):''};
function normalizeEntries(v){return Array.isArray(v)?v.map(x=>typeof x==='string'?{term:x,weight:.65}:x).filter(x=>x&&x.term):[]}
function highest(entries,n=3){return normalizeEntries(entries).sort((a,b)=>(Number(b.weight)||0)-(Number(a.weight)||0)).slice(0,n).map(x=>x.term)}
function hash(s){let h=2166136261;for(let i=0;i<String(s).length;i++){h^=String(s).charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function choose(arr,seed){const a=uniq(arr);return a.length?a[hash(seed)%a.length]:''}
function phase(a){return a?.phase||a?.aspect?.phase||''}
function asp(a){return a?.aspect||a||{}}
function scoreAspect(a,extra=0){const z=asp(a);return (ASPECT_WEIGHT[z.type]||.5)+(PHASE_WEIGHT[z.phase]||0)+extra-Math.min(Number(z.orb)||6,6)*.055}

function dispositorState(body,planet){
  if(!planet?.sign)return null;
  const lordId=SIGN_LORDS[planet.sign];
  if(!lordId)return null;
  const ruler=(body.planets||[]).find(p=>p.id===lordId)||null;
  return {lordId,ruler,selfRuled:planet.id===lordId};
}

function terminologyFor(vocab,planetId,house){
  const bank=vocab?.[planetId]||{};
  const model=HOUSE_EVENT_MODEL[house]||HOUSE_EVENT_MODEL[1];
  return {
    people:uniq([...highest(bank.people,3),...model.actors]).slice(0,6),
    events:uniq([...highest(bank.events,3),...model.actions]).slice(0,6),
    places:uniq([...highest(bank.places,2),...model.places]).slice(0,4),
    objects:uniq([...highest(bank.objects,3),...model.objects]).slice(0,6),
    qualities:highest(bank.qualities,3)
  };
}

function makeCandidate({body,vocab,planet,house,aspect,kind='house',context=null,priorityExtra=0,label=''}){
  if(!planet||!house)return null;
  const model=HOUSE_EVENT_MODEL[house]||HOUSE_EVENT_MODEL[1];
  const terminology=terminologyFor(vocab,planet.id,house);
  const pfunc=PLANET_FUNCTION[planet.id]||{verbs:['affects'],conditions:[]};
  const nak=context?.nakshatra||planet.nakshatra;
  const nakMods=NAKSHATRA_MODIFIERS[nak]||[];
  const disp=dispositorState(body,planet);
  const score=scoreAspect(aspect,(PRIORITY_WEIGHT[house]||0)+priorityExtra)+(kind==='destination'?.35:kind==='moon'?.3:0);
  const seed=`${planet.id}|${house}|${asp(aspect).type}|${nak}|${kind}`;
  const actor=choose(highest(vocab?.[planet.id]?.people,3),seed+'|actor')||choose(model.actors,seed+'|actor');
  const object=choose(highest(vocab?.[planet.id]?.objects,3),seed+'|object')||choose(model.objects,seed+'|object');
  const place=choose(highest(vocab?.[planet.id]?.places,2),seed+'|place')||choose(model.places,seed+'|place');
  const terminologyEvent=choose(highest(vocab?.[planet.id]?.events,4),seed+'|tevent');
  const action=choose(model.actions,seed+'|action');
  const modifier=choose(nakMods,seed+'|nak');
  const condition=choose(pfunc.conditions,seed+'|condition');
  const verb=choose(pfunc.verbs,seed+'|verb');
  const tone=BENEFIC.has(planet.id)?'constructive':CHALLENGING.has(planet.id)?'challenging':'mixed';
  const dispCondition=disp?.ruler&&disp.ruler.id!==planet.id?choose(PLANET_FUNCTION[disp.ruler.id]?.conditions||[],seed+'|dispositor'):'';
  return {id:seed,kind,category:house===1?'mindset':house===3||house===9?'journey':house===7?'people':kind==='destination'?'destination':'general',planetId:planet.id,planetName:planet.name,house,aspect:asp(aspect),score,tone,actor,action,object,place,modifier,condition,verb,terminologyEvent,dispositor:disp,dispositorCondition:dispCondition,label,context,terminology};
}

function collectCandidates(body,vocab){
  const ev=body.formulaEvidence||{};const out=[];
  for(const x of ev.transitToNatalHouses||[]){
    const h=Number(x.house);if(!PRIORITY_HOUSES.includes(h)&&Number(x.aspect?.orb)>2.25)continue;
    const c=makeCandidate({body,vocab,planet:x.transit,house:h,aspect:x.aspect,kind:'house',context:x.houseContext,priorityExtra:PRIORITY_HOUSES.includes(h)?.2:0,label:`Transit to natal House ${h}`});if(c)out.push(c);
  }
  for(const chain of ev.routeLordChains||[]){
    const h=Number(chain.house);for(const hit of (chain.aspectsToNatalLord||[]).slice(0,4)){
      const c=makeCandidate({body,vocab,planet:hit.transit,house:h,aspect:hit.aspect,kind:'lord',context:{nakshatra:chain.natalLord?.natalNakshatra},priorityExtra:.35,label:`Contact to natal House ${h} lord`});if(c)out.push(c);
    }
  }
  for(const x of (ev.destination?.aspects||[]).slice(0,7)){
    const h=Number(ev.destination?.field?.house)||7;const c=makeCandidate({body,vocab,planet:x.planet,house:h,aspect:x.aspect,kind:'destination',context:ev.destination?.field,priorityExtra:.2,label:'Destination field contact'});if(c)out.push(c);
  }
  for(const transition of (ev.route?.fieldAspects||[])){
    const field=transition?.field||{};
    const h=Number(field.house)||3;
    for(const x of (transition?.aspects||[]).slice(0,5)){
      const c=makeCandidate({body,vocab,planet:x.planet,house:h,aspect:x.aspect,kind:'route-field',context:field,priorityExtra:.16,label:`Route field ${Number(transition.index)+1} contact`});if(c)out.push(c);
    }
  }
  const m=ev.moon;
  if(m?.transitMoon&&m?.moonToNatalMoon){const h=Number(m.transitMoon.house)||1;const c=makeCandidate({body,vocab,planet:m.transitMoon,house:h,aspect:m.moonToNatalMoon,kind:'moon',context:{nakshatra:m.transitMoon.nakshatra},priorityExtra:.25,label:'Transit Moon to natal Moon'});if(c)out.push(c)}
  for(const x of m?.moonToPriorityLords||[]){for(const h of x.houses||[]){const c=makeCandidate({body,vocab,planet:m.transitMoon,house:Number(h),aspect:x.aspect,kind:'moon',context:{nakshatra:m.transitMoon.nakshatra},priorityExtra:.25,label:`Moon contact to House ${h} lord`});if(c)out.push(c)}}
  return out.sort((a,b)=>b.score-a.score);
}

function clusterCandidates(cands){
  const groups={mindset:[],journey:[],people:[],destination:[],general:[]};
  for(const c of cands){(groups[c.category]||groups.general).push(c)}
  for(const k of Object.keys(groups))groups[k]=groups[k].slice(0,5);
  return groups;
}

function predictionSentence(c){
  if(!c)return'';
  const actor=cap(c.actor||'another person');
  const object=c.object||'an important detail';
  const place=c.place?` near ${c.place}`:'';
  const concrete=c.terminologyEvent?` A concrete form of this could be ${c.terminologyEvent}.`:'';
  const modifier=c.modifier?` ${cap(c.modifier)} may describe how it develops.`:'';
  const dispositor=c.dispositorCondition?` The trigger may involve ${c.dispositorCondition}.`:'';
  if(c.tone==='challenging')return `${actor} may become involved in a situation concerning ${object}${place}. The matter is more likely to require correction, negotiation, patience, or immediate action than to resolve by itself; ${c.condition||'pressure'} is the main complicating factor.${modifier}${dispositor}${concrete}`;
  if(c.tone==='constructive')return `${actor} may become important through ${object}${place}. The situation has a better chance of producing help, agreement, useful information, or an opening if you respond to it directly; ${c.condition||'cooperation'} is the main supportive factor.${modifier}${dispositor}${concrete}`;
  return `${actor} may bring ${object}${place} to your attention. A response, clarification, or change of plan may be needed, with ${c.condition||'changing circumstances'} shaping how it develops.${modifier}${dispositor}${concrete}`;
}

function moonMindsetProse(body,clusters){
  const m=body.formulaEvidence?.moon;const c=clusters.mindset?.[0];
  if(!m?.transitMoon||!m?.natalMoon)return c?predictionSentence(c):'No unusually concentrated Moon/self testimony is active.';
  const t=m.transitMoon,n=m.natalMoon;
  const toneMap={Conjunction:'more personally immediate',Square:'more reactive and easily pressured',Opposition:'more dependent on what other people do',Trine:'more instinctively confident',Sextile:'more receptive to useful information',Quincunx:'more likely to require emotional adjustment'};
  const tone=toneMap[m.moonToNatalMoon?.type]||'more sensitive to immediate circumstances';
  const nak=choose(NAKSHATRA_MODIFIERS[t.nakshatra]||[],`${t.nakshatra}|moon`);
  let text=`Your attention is likely to be ${tone}.`;
  if(nak)text+=` ${cap(nak)} may shape what catches your attention first and how quickly you react.`;
  if(c)text+=` ${predictionSentence(c)}`;
  return text;
}

function destinationProse(body,clusters){
  const field=body.formulaEvidence?.destination?.field;const top=clusters.destination?.[0]||clusters.people?.[0]||clusters.general?.[0];
  if(!field&&!top)return'No unusually concentrated destination testimony is active.';
  let text='';
  if(top)text=predictionSentence(top,'dest');
  if(field?.nakshatra){const mod=choose(NAKSHATRA_MODIFIERS[field.nakshatra]||[],`${field.nakshatra}|dest`);if(mod)text+=` On arrival, ${mod} is the strongest nakshatra modifier.`}
  return text||'The destination does not show a single dominant event signature in the current evidence set.';
}

function overallProse(groups){
  const ranked=[...(groups.people||[]),...(groups.journey||[]),...(groups.mindset||[]),...(groups.destination||[]),...(groups.general||[])].sort((a,b)=>b.score-a.score);
  const first=ranked[0],second=ranked.find(x=>x!==first&&x.house!==first?.house);
  if(!first)return'The current chart does not produce a sufficiently concentrated event signature to justify a specific forecast.';
  let text=predictionSentence(first,'overall');
  if(second)text+=` ${predictionSentence(second,'secondary')}`;
  return text;
}

function manifestations(groups){
  const top=[...groups.mindset,...groups.journey,...groups.people,...groups.destination,...groups.general].sort((a,b)=>b.score-a.score).slice(0,8);
  return {
    events:uniq(top.flatMap(c=>[c.terminologyEvent,c.action,c.modifier])).slice(0,8),
    people:uniq(top.map(c=>c.actor)).slice(0,8),
    places:uniq(top.map(c=>c.place)).slice(0,6),
    objects:uniq(top.map(c=>c.object)).slice(0,8)
  };
}

function basisLines(body,cands){
  return cands.slice(0,10).map(c=>{
    const p=phase(c.aspect);const ctx=c.context||{};
    const disp=c.dispositor?.ruler?`; dispositor ${c.dispositor.ruler.name} in ${c.dispositor.ruler.sign} House ${c.dispositor.ruler.house}`:c.dispositor?.selfRuled?'; self-disposed':'';
    return `${c.planetName} ${String(c.aspect?.type||'aspect').toLowerCase()} ${c.label} (${Number(c.aspect?.orb||0).toFixed(2)}°${p?`, ${p}`:''})${ctx.sign?`; ${ctx.sign}`:''}${ctx.nakshatra?` / ${ctx.nakshatra}`:''}${disp}.`;
  });
}


function fallbackPlanetCandidate(body,vocab,planet){
  if(!planet)return null;
  const destinationHouse=Number(body.formulaEvidence?.destination?.field?.house);
  const house=Number.isFinite(destinationHouse)&&destinationHouse>=1&&destinationHouse<=12?destinationHouse:Number(planet.house)||1;
  return makeCandidate({
    body,vocab,planet,house,
    aspect:{type:'Placement',orb:0,phase:'current'},
    kind:'route-placement',
    context:body.formulaEvidence?.destination?.field||{nakshatra:planet.nakshatra,sign:planet.sign},
    priorityExtra:.08,
    label:`${planet.name} route placement`
  });
}

function planetRoutePredictions(body,vocab,candidates){
  return (body.planets||[]).map(planet=>{
    let own=candidates.filter(c=>c.planetId===planet.id).sort((a,b)=>b.score-a.score);
    if(!own.length){const fallback=fallbackPlanetCandidate(body,vocab,planet);if(fallback)own=[fallback]}
    const top=own[0];
    const support=own[1];
    const destinationHit=own.find(c=>c.kind==='destination');
    let prose=top?predictionSentence(top):`${planet.name} does not produce a concentrated route event signature in the current evidence set.`;
    if(support&&support.house!==top?.house)prose+=` ${predictionSentence(support)}`;
    if(destinationHit&&destinationHit!==top&&destinationHit!==support)prose+=` Near the destination, ${predictionSentence(destinationHit).replace(/^./,m=>m.toLowerCase())}`;
    return {
      planetId:planet.id,planetName:planet.name,glyph:planet.glyph||'',sign:planet.sign,degree:planet.degree,house:planet.house,nakshatra:planet.nakshatra,pada:planet.pada,retrograde:planet.retrograde,
      score:Number((top?.score||0).toFixed(2)),
      prose,
      manifestations:{
        events:uniq(own.slice(0,4).flatMap(c=>[c.terminologyEvent,c.action,c.modifier])).slice(0,5),
        people:uniq(own.slice(0,4).map(c=>c.actor)).slice(0,4),
        places:uniq(own.slice(0,4).map(c=>c.place)).slice(0,3),
        objects:uniq(own.slice(0,4).map(c=>c.object)).slice(0,4)
      },
      basis:basisLines(body,own).slice(0,5)
    };
  });
}

export function buildEventDrivenPrediction(body,vocab){
  const candidates=collectCandidates(body,vocab);const groups=clusterCandidates(candidates);
  return {
    overallProse:overallProse(groups),
    planetPredictions:planetRoutePredictions(body,vocab,candidates),
    sections:{
      mindsetActions:moonMindsetProse(body,groups),
      developmentsEnRoute:groups.journey?.length?groups.journey.slice(0,2).map(c=>predictionSentence(c)).join(' '):'No unusually concentrated journey-specific event signature is active.',
      peopleEncounters:groups.people?.length?groups.people.slice(0,2).map(c=>predictionSentence(c)).join(' '):'No unusually concentrated encounter signature is active.',
      destinationConditions:destinationProse(body,groups)
    },
    manifestations:manifestations(groups),
    basis:basisLines(body,candidates),
    terminologyRule:'Private terminology is used only after the Vedic evidence establishes an event category. It supplies concrete people, objects, places and event forms; it does not create the astrological conclusion.',
    candidates:candidates.slice(0,12).map(c=>({category:c.category,planet:c.planetName,house:c.house,score:Number(c.score.toFixed(2)),actor:c.actor,action:c.action,object:c.object,place:c.place,modifier:c.modifier,terminologyEvent:c.terminologyEvent}))
  };
}
