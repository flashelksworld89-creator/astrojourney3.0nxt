import { useEffect, useMemo, useRef, useState } from 'react';

const NAKSHATRA_COLORS = [
  '#ef4444','#f97316','#fb923c','#f59e0b','#eab308','#84cc16','#22c55e','#10b981','#14b8a6',
  '#06b6d4','#0ea5e9','#3b82f6','#6366f1','#8b5cf6','#a855f7','#c026d3','#db2777','#e11d48',
  '#dc2626','#ea580c','#ca8a04','#65a30d','#16a34a','#0d9488','#0284c7','#4f46e5','#9333ea'
];

const norm=n=>((Number(n)%360)+360)%360;
const signedAngle=(target,heading)=>((norm(target)-norm(heading)+540)%360)-180;
const cardinal=b=>['N','NE','E','SE','S','SW','W','NW'][Math.round(norm(b)/45)%8];


function shortestDelta(target,current){return ((norm(target)-norm(current)+540)%360)-180;}
function useSmoothedAngle(target,active=true){
  const [value,setValue]=useState(()=>norm(target));
  const valueRef=useRef(norm(target));
  const frameRef=useRef(0);
  const targetRef=useRef(norm(target));
  useEffect(()=>{targetRef.current=norm(target);},[target]);
  useEffect(()=>{
    if(!active)return;
    let last=performance.now();
    const tick=now=>{
      const dt=Math.min(48,Math.max(1,now-last));last=now;
      const current=valueRef.current;
      const delta=shortestDelta(targetRef.current,current);
      const ease=1-Math.exp(-dt/115);
      const next=norm(current+delta*ease);
      valueRef.current=Math.abs(delta)<.03?targetRef.current:next;
      setValue(valueRef.current);
      frameRef.current=requestAnimationFrame(tick);
    };
    frameRef.current=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(frameRef.current);
  },[active]);
  return value;
}

function hexToRgba(hex,a){
  const h=String(hex||'#ffffff').replace('#','');
  const n=parseInt(h.length===3?h.split('').map(x=>x+x).join(''):h,16);
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
}

export default function StreetGameOverlay({
  active,
  heading=0,
  currentZone,
  followedPlanet,
  followedBearing,
  followedZone,
  onStopFollowing
}){
  const smoothHeading=useSmoothedAngle(heading,active);
  const activeNak=currentZone?.nakshatra||followedZone?.nakshatra||null;
  const activeIndex=Math.max(0,Math.min(26,Number(activeNak?.index??activeNak?.number-1??0)));
  const color=NAKSHATRA_COLORS[activeIndex]||'#22c55e';
  const relative=Number.isFinite(Number(followedBearing))?signedAngle(followedBearing,smoothHeading):0;
  const beaconX=Math.max(12,Math.min(88,50+(relative/75)*38));
  const visibleAhead=Math.abs(relative)<=92;
  const lineAngle=Math.max(-36,Math.min(36,relative*.42));
  const laneName=activeNak?.name||'Current Nakshatra';
  const planetNak=followedPlanet?.nakshatra||followedZone?.nakshatra||null;

  const vars=useMemo(()=>({
    '--nak-color':color,
    '--nak-soft':hexToRgba(color,.18),
    '--nak-mid':hexToRgba(color,.42),
    '--nak-strong':hexToRgba(color,.82),
    '--beacon-x':`${beaconX}%`,
    '--route-angle':`${lineAngle}deg`
  }),[color,beaconX,lineAngle]);

  if(!active)return null;

  return <div className="street-game-overlay" style={vars} aria-hidden="true">
    <div className="street-sky-vignette"/>
    <div className="street-ground-tint"/>
    <div className="street-digital-city street-digital-city-left" aria-hidden="true"><span/><span/><span/><span/></div>
    <div className="street-digital-city street-digital-city-right" aria-hidden="true"><span/><span/><span/><span/></div>
    <div className="street-digital-cars" aria-hidden="true"><i className="car car-a"/><i className="car car-b"/><i className="car car-c"/></div>
    <div className="street-digital-people" aria-hidden="true"><i className="person person-a"/><i className="person person-b"/><i className="person person-c"/></div>
    <div className="street-perspective-field">
      <div className="street-lane-fill"/>
      <div className="street-boundary street-boundary-left"/>
      <div className="street-boundary street-boundary-right"/>
      <div className="street-route-line"/>
      <div className="street-route-pulse street-route-pulse-a"/>
      <div className="street-route-pulse street-route-pulse-b"/>
      <div className="street-route-label">
        <strong>{laneName}</strong>
        <span>HOUSE {currentZone?.house||'—'} · {cardinal(smoothHeading)} {norm(smoothHeading).toFixed(0)}°</span>
      </div>
      <div className="street-road-data">
        {followedPlanet?<>
          <b>{followedPlanet.glyph} {followedPlanet.name}</b>
          <span>HOUSE {followedPlanet.house||followedZone?.house||'—'}</span>
          <span>{planetNak?.name||'—'}{planetNak?.pada?` · PADA ${planetNak.pada}`:''}</span>
          <span>{followedPlanet.sign} {Number(followedPlanet.degree||0).toFixed(1)}°</span>
        </>:<><b>SELECT A PLANET</b><span>Tap a transit glyph to create a guidance line.</span></>}
      </div>
    </div>

    {followedPlanet&&<div className={`street-planet-beacon ${visibleAhead?'is-ahead':'is-offscreen'}`}>
      <div className="street-beacon-stem"/>
      <div className="street-beacon-orb"><span>{followedPlanet.glyph}</span></div>
      <div className="street-beacon-card">
        <b>{followedPlanet.name}</b>
        <span>{Number(followedBearing).toFixed(0)}° {cardinal(followedBearing)}</span>
        {!visibleAhead&&<small>{relative>0?'Turn right':'Turn left'} {Math.abs(relative).toFixed(0)}°</small>}
      </div>
    </div>}

    <div className="street-game-hud" aria-hidden="false">
      <div><small>Current field</small><b>{laneName}</b></div>
      <div><small>Mode</small><b>Digitized Street</b></div>
      <div><small>Travel house</small><b>House {currentZone?.house||'—'}</b></div>
      <div><small>Following</small><b>{followedPlanet?`${followedPlanet.glyph} ${followedPlanet.name}`:'No planet selected'}</b></div>
      {followedPlanet&&<button type="button" onClick={onStopFollowing}>Stop</button>}
    </div>
  </div>;
}
