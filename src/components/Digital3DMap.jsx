import { useEffect, useMemo, useRef, useState } from 'react';
import { loadGoogleMaps } from '../lib/googleMaps';

const NAKSHATRA_COLORS = [
  '#ef4444','#f97316','#fb923c','#f59e0b','#eab308','#84cc16','#22c55e','#10b981','#14b8a6',
  '#06b6d4','#0ea5e9','#3b82f6','#6366f1','#8b5cf6','#a855f7','#c026d3','#db2777','#e11d48',
  '#dc2626','#ea580c','#ca8a04','#65a30d','#16a34a','#0d9488','#0284c7','#4f46e5','#9333ea'
];

const toRad=d=>d*Math.PI/180;
const toDeg=r=>r*180/Math.PI;
const norm=d=>((Number(d)%360)+360)%360;

function rgba(hex,alpha){
  const h=String(hex||'#22c55e').replace('#','');
  const n=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h,16);
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${alpha})`;
}

function destinationPoint(origin,bearingDeg,distanceMeters){
  const R=6371008.8;
  const d=distanceMeters/R;
  const br=toRad(bearingDeg);
  const lat1=toRad(origin.lat),lon1=toRad(origin.lng);
  const lat2=Math.asin(Math.sin(lat1)*Math.cos(d)+Math.cos(lat1)*Math.sin(d)*Math.cos(br));
  const lon2=lon1+Math.atan2(Math.sin(br)*Math.sin(d)*Math.cos(lat1),Math.cos(d)-Math.sin(lat1)*Math.sin(lat2));
  return {lat:toDeg(lat2),lng:((toDeg(lon2)+540)%360)-180};
}

function wedgePath(center,centerBearing,radiusMeters,steps=12){
  const half=13.3333333333/2;
  const out=[];
  out.push({lat:center.lat,lng:center.lng});
  for(let i=0;i<=steps;i++){
    const b=centerBearing-half+(i/steps)*(half*2);
    out.push(destinationPoint(center,b,radiusMeters));
  }
  return out;
}

function cameraRange(){ return 240; }

export default function Digital3DMap({
  active,
  location,
  destination,
  cityCenter,
  cityRadiusMeters,
  currentZone,
  currentBearing,
  followedPlanet,
  followedBearing
}){
  const hostRef=useRef(null),map3dRef=useRef(null),overlayRefs=useRef([]);
  const [error,setError]=useState('');

  const activeNak=currentZone?.nakshatra||followedPlanet?.nakshatra||null;
  const activeIndex=Math.max(0,Math.min(26,Number(activeNak?.index??activeNak?.number-1??0)));
  const color=NAKSHATRA_COLORS[activeIndex]||'#22c55e';
  const center=cityCenter||location;
  const radius=Math.max(1000,Number(cityRadiusMeters)||5000);
  const zoneBearing=Number.isFinite(Number(currentBearing))?Number(currentBearing):(Number(followedBearing)||0);

  const camera=useMemo(()=>({
    center:{lat:Number(location?.lat||center?.lat||0),lng:Number(location?.lng||center?.lng||0),altitude:4},
    range:cameraRange(),
    heading:norm(Number(followedBearing)||0),
    tilt:78
  }),[location?.lat,location?.lng,center?.lat,center?.lng,radius,followedBearing]);

  useEffect(()=>{
    if(!active||!hostRef.current)return;
    let cancelled=false;
    (async()=>{
      try{
        setError('');
        await loadGoogleMaps();
        const lib=await window.google.maps.importLibrary('maps3d');
        if(cancelled||!hostRef.current)return;
        const {Map3DElement}=lib;
        const map3d=new Map3DElement({
          center:camera.center,
          range:camera.range,
          tilt:camera.tilt,
          heading:camera.heading,
          mode:'HYBRID',
          gestureHandling:'GREEDY',
          defaultUIHidden:true
        });
        map3d.className='digital-3d-map-element';
        hostRef.current.replaceChildren(map3d);
        map3dRef.current=map3d;
      }catch(e){
        if(!cancelled)setError(e?.message||'Digital 3D map could not be started.');
      }
    })();
    return()=>{cancelled=true;map3dRef.current=null;if(hostRef.current)hostRef.current.replaceChildren();};
  },[active]);

  useEffect(()=>{
    const map3d=map3dRef.current;
    if(!active||!map3d)return;
    map3d.center=camera.center;
    map3d.range=camera.range;
    map3d.tilt=camera.tilt;
    map3d.heading=camera.heading;
  },[active,camera.center.lat,camera.center.lng,camera.range,camera.tilt,camera.heading]);

  useEffect(()=>{
    const map3d=map3dRef.current;
    if(!active||!map3d||!center||!location)return;
    let cancelled=false;
    (async()=>{
      try{
        const lib=await window.google.maps.importLibrary('maps3d');
        if(cancelled)return;
        const {Polygon3DElement,Polyline3DElement,Marker3DElement,AltitudeMode}=lib;
        overlayRefs.current.forEach(el=>{try{el.remove()}catch{}});
        overlayRefs.current=[];

        // Current nakshatra geography: a true 13°20′ terrestrial wedge from city center to rim.
        const wedge=new Polygon3DElement({
          path:wedgePath(center,zoneBearing,radius,18),
          fillColor:rgba(color,.28),
          strokeColor:rgba(color,.95),
          strokeWidth:3,
          altitudeMode:AltitudeMode?.CLAMP_TO_GROUND||'CLAMP_TO_GROUND',
          drawsOccludedSegments:true,
          zIndex:10
        });
        map3d.append(wedge);overlayRefs.current.push(wedge);

        // Selected planet line: directional line, not a destination endpoint.
        if(followedPlanet&&Number.isFinite(Number(followedBearing))){
          const beaconPoint=destinationPoint(location,Number(followedBearing),Math.min(3000,Math.max(900,radius*.18)));
          const line=new Polyline3DElement({
            path:[location,beaconPoint],
            strokeColor:'#fff7c2',
            strokeWidth:8,
            outerColor:rgba(color,.95),
            outerWidth:15,
            altitudeMode:AltitudeMode?.RELATIVE_TO_GROUND||'RELATIVE_TO_GROUND',
            drawsOccludedSegments:true,
            zIndex:35
          });
          map3d.append(line);overlayRefs.current.push(line);
          const beacon=new Marker3DElement({
            position:{...beaconPoint,altitude:70},
            label:`${followedPlanet.glyph} ${followedPlanet.name}`,
            altitudeMode:AltitudeMode?.RELATIVE_TO_GROUND||'RELATIVE_TO_GROUND',
            extruded:true,
            sizePreserved:true,
            drawsWhenOccluded:true,
            zIndex:60
          });
          map3d.append(beacon);overlayRefs.current.push(beacon);
        }

        const user=new Marker3DElement({
          position:{...location,altitude:8},
          label:'YOU',
          altitudeMode:AltitudeMode?.RELATIVE_TO_GROUND||'RELATIVE_TO_GROUND',
          extruded:true,
          sizePreserved:true,
          drawsWhenOccluded:true,
          zIndex:70
        });
        map3d.append(user);overlayRefs.current.push(user);

        if(destination){
          const dest=new Marker3DElement({
            position:{...destination,altitude:12},
            label:'DESTINATION',
            altitudeMode:AltitudeMode?.RELATIVE_TO_GROUND||'RELATIVE_TO_GROUND',
            extruded:true,
            sizePreserved:true,
            drawsWhenOccluded:true,
            zIndex:55
          });
          map3d.append(dest);overlayRefs.current.push(dest);
        }
      }catch(e){
        if(!cancelled)setError(e?.message||'Digital 3D overlays could not be drawn.');
      }
    })();
    return()=>{cancelled=true;};
  },[active,center?.lat,center?.lng,location?.lat,location?.lng,destination?.lat,destination?.lng,radius,zoneBearing,color,followedPlanet?.id,followedBearing]);

  if(!active)return null;
  return <div className="digital-3d-shell">
    <div ref={hostRef} className="digital-3d-host"/>
    <div className="digital-3d-grade" aria-hidden="true"/>
    <div className="digital-3d-grid" aria-hidden="true"/>
    <div className="digital-3d-hud">
      <div><small>Mode</small><b>Digital 3D</b></div>
      <div><small>Nakshatra field</small><b>{activeNak?.name||'—'}</b></div>
      <div><small>Following</small><b>{followedPlanet?`${followedPlanet.glyph} ${followedPlanet.name}`:'No planet selected'}</b></div>
    </div>
    {error&&<div className="digital-3d-error"><b>Digital 3D unavailable</b><span>{error}</span><span>Check that 3D Maps is enabled for the same Google Maps project.</span></div>}
  </div>;
}
