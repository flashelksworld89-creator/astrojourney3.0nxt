import { useEffect, useRef } from 'react';
import {
  ZODIAC_GLYPHS,
  NAKSHATRAS,
  calculateAspects,
  formatDistance,
  destinationZoneFromBearing,
  getSignData
} from '../lib/astro';

const GOLD = '#F4C842';
const PALE_GOLD = '#FFE9A6';
const BLUE = '#60A5FA';
const NATAL = '#E879F9';
const WHITE = '#F8FAFC';
const norm = n => ((n % 360) + 360) % 360;
const rad = d => d * Math.PI / 180;

const ASPECT_STYLE = {
  Conjunction: ['rgba(250,204,21,.74)', []],
  Sextile: ['rgba(45,212,191,.66)', [3, 4]],
  Square: ['rgba(248,113,113,.72)', []],
  Trine: ['rgba(96,165,250,.70)', []],
  Quincunx: ['rgba(192,132,252,.64)', [4, 4]],
  Opposition: ['rgba(251,146,60,.72)', []]
};


const NAKSHATRA_COLORS = [
  '#EF4444','#F97316','#F59E0B','#EAB308','#84CC16','#22C55E','#10B981','#14B8A6','#06B6D4',
  '#0EA5E9','#3B82F6','#6366F1','#8B5CF6','#A855F7','#D946EF','#EC4899','#F43F5E','#FB7185',
  '#FDBA74','#FDE047','#A3E635','#4ADE80','#2DD4BF','#22D3EE','#60A5FA','#818CF8','#C084FC'
];

function hexToRgba(hex, alpha = 1) {
  const h = hex.replace('#','');
  const n = parseInt(h,16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

const COMPASS_POINTS = [
  ['N', 0], ['NE', 45], ['E', 90], ['SE', 135],
  ['S', 180], ['SW', 225], ['W', 270], ['NW', 315]
];

function shortNakshatra(name) {
  return name
    .replace('Purva ', 'P. ')
    .replace('Uttara ', 'U. ')
    .replace('Bhadrapada', 'Bhadra')
    .replace('Phalguni', 'Phalg.')
    .replace('Ashadha', 'Ash.')
    .replace('Ashwini', 'Ashwini')
    .slice(0, 10);
}

export default function ZodiacWheel({
  chart,
  natalAsc = null,
  planets = [],
  selectedPlanet,
  onSelectPlanet,
  selectedHouse,
  onSelectHouse,
  destinationBearing = null,
  compact = false,
  overlay = false,
  radiusMeters = null,
  distanceUnit = 'ft',
  displayHeading = 0,
  followingPlanetId = null,
  flatMode = false,
  travelBearing = null
}) {
  const ref = useRef(null);
  const size = 760;

  const drawFlatTravelField = (ctx, dims) => {
    const {W,H,cx,cy,R,rotation,point,houseInner,nakOuter,nakInner,destinationZone,travelZone} = dims;
    const followedPlanet = planets.find(p => p.id === followingPlanetId);
    const horizonY = cy - R * .58;
    const originY = cy + R * .46;
    const roadTopHalf = R * .16;
    const roadBottomHalf = R * .58;

    // Ground veil: preserve Street View while giving the meridian field enough contrast.
    const ground = ctx.createLinearGradient(0,horizonY,0,originY+R*.16);
    ground.addColorStop(0,'rgba(2,6,23,.06)');
    ground.addColorStop(.48,'rgba(2,6,23,.14)');
    ground.addColorStop(1,'rgba(2,6,23,.28)');
    ctx.beginPath();
    ctx.moveTo(cx-roadTopHalf,horizonY);
    ctx.lineTo(cx+roadTopHalf,horizonY);
    ctx.lineTo(cx+roadBottomHalf,originY);
    ctx.lineTo(cx-roadBottomHalf,originY);
    ctx.closePath();
    ctx.fillStyle=ground;ctx.fill();

    // Nakshatra meridian lanes: 27 spokes are projected into a forward field.
    // The camera-facing travel zone is brought to center so the user feels inside it.
    const activeNak = travelZone?.nakshatra?.index ?? followedPlanet?.nakshatra?.index ?? 0;
    const activeCenter = activeNak + .5;
    const laneScale = R * .038;

    // Colored nakshatra field. Each visible lane has its own color, while the
    // active lane surrounds the traveler with a stronger translucent wash.
    for(let offset=-5; offset<=5; offset++){
      const idx=(activeNak+offset+27)%27;
      const leftDelta=offset-.5;
      const rightDelta=offset+.5;
      const farLeft=cx+leftDelta*laneScale;
      const farRight=cx+rightDelta*laneScale;
      const nearLeft=cx+leftDelta*laneScale*4.6;
      const nearRight=cx+rightDelta*laneScale*4.6;
      ctx.beginPath();
      ctx.moveTo(farLeft,horizonY);ctx.lineTo(farRight,horizonY);
      ctx.lineTo(nearRight,originY);ctx.lineTo(nearLeft,originY);ctx.closePath();
      const alpha=offset===0?.34:Math.max(.055,.16-Math.abs(offset)*.02);
      ctx.fillStyle=hexToRgba(NAKSHATRA_COLORS[idx],alpha);ctx.fill();
    }

    for(let i=0;i<=27;i++){
      let delta=i-activeCenter;
      while(delta>13.5) delta-=27;
      while(delta<-13.5) delta+=27;
      const farX=cx+delta*laneScale;
      const nearX=cx+delta*laneScale*4.6;
      const isActiveEdge=i===activeNak || i===activeNak+1;
      ctx.beginPath();ctx.moveTo(farX,horizonY);ctx.lineTo(nearX,originY);
      ctx.strokeStyle=isActiveEdge?'rgba(255,255,255,.98)':'rgba(255,255,255,.30)';
      ctx.lineWidth=isActiveEdge?3.2:1.0;ctx.stroke();
    }

    // House meridians: stronger structural divisions, expanding toward the user.
    for(let h=0;h<12;h++){
      const cusp=chart.houseCusps[h];
      const screen=norm(cusp+rotation);
      let rel=((screen-90+540)%360)-180;
      const normRel=Math.max(-1,Math.min(1,rel/100));
      const farX=cx+normRel*R*.23;
      const nearX=cx+normRel*R*.74;
      ctx.beginPath();ctx.moveTo(farX,horizonY);ctx.lineTo(nearX,originY);
      ctx.strokeStyle=h%3===0?'rgba(255,233,166,.78)':'rgba(248,250,252,.38)';
      ctx.lineWidth=h%3===0?2:1.1;ctx.stroke();
    }

    // Depth cross-lines turn the field into a traversable road/grid rather than a tilted disk.
    for(let j=1;j<=6;j++){
      const t=j/7;
      const y=horizonY+(originY-horizonY)*(t*t);
      const half=roadTopHalf+(roadBottomHalf-roadTopHalf)*(t*t);
      ctx.beginPath();ctx.moveTo(cx-half,y);ctx.lineTo(cx+half,y);
      ctx.strokeStyle=j===5?'rgba(255,233,166,.46)':'rgba(255,255,255,.15)';
      ctx.lineWidth=j===5?1.5:.7;ctx.stroke();
    }

    // Lane names near the traveler make the nakshatra field read like named roads.
    for(let offset=-4; offset<=4; offset++){
      const idx=(activeNak+offset+27)%27;
      const delta=offset;
      const x=cx+delta*laneScale*4.1;
      const y=originY-R*.055-Math.abs(offset)*3;
      ctx.save();ctx.translate(x,y);ctx.rotate(-Math.PI/2);
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.shadowColor='rgba(0,0,0,.95)';ctx.shadowBlur=3;
      ctx.fillStyle=offset===0?'rgba(255,247,194,.98)':'rgba(248,250,252,.62)';
      ctx.font=offset===0?'800 12px Inter, sans-serif':'700 8px Inter, sans-serif';
      ctx.fillText(shortNakshatra(NAKSHATRAS[idx]),0,0);
      ctx.restore();
    }

    // House numbers sit across the travel field as larger meridian-zone markers.
    for(let h=0;h<12;h++){
      const cusp=chart.houseCusps[h];
      const screen=norm(cusp+rotation);
      const rel=((screen-90+540)%360)-180;
      if(Math.abs(rel)>100) continue;
      const x=cx+(rel/100)*R*.66;
      const y=originY-R*.16;
      ctx.font='800 10px Inter, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillStyle='rgba(255,233,166,.72)';ctx.shadowColor='rgba(0,0,0,.9)';ctx.shadowBlur=3;
      ctx.fillText(`H${h+1}`,x,y);ctx.shadowBlur=0;
    }

    // Active nakshatra corridor fill.
    const activeDeltaLeft=(activeNak-activeCenter)*laneScale;
    const activeDeltaRight=(activeNak+1-activeCenter)*laneScale;
    ctx.beginPath();
    ctx.moveTo(cx+activeDeltaLeft,horizonY);
    ctx.lineTo(cx+activeDeltaRight,horizonY);
    ctx.lineTo(cx+activeDeltaRight*4.6,originY);
    ctx.lineTo(cx+activeDeltaLeft*4.6,originY);
    ctx.closePath();
    const corridor=ctx.createLinearGradient(0,horizonY,0,originY);
    const activeColor=NAKSHATRA_COLORS[activeNak];
    corridor.addColorStop(0,hexToRgba(activeColor,.20));
    corridor.addColorStop(.55,hexToRgba(activeColor,.38));
    corridor.addColorStop(1,hexToRgba(activeColor,.24));
    ctx.fillStyle=corridor;ctx.fill();

    // Current nakshatra + house label becomes part of the road surface.
    const nakName=travelZone?.nakshatra?.name || followedPlanet?.nakshatra?.name || 'Nakshatra';
    const houseNo=travelZone?.house || followedPlanet?.house || '—';
    ctx.save();
    ctx.translate(cx,cy+R*.12);
    ctx.rotate(-Math.PI/2);
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor='rgba(0,0,0,.95)';ctx.shadowBlur=5;
    ctx.fillStyle='rgba(255,247,194,.96)';ctx.font='800 18px Inter, sans-serif';
    ctx.fillText(`${nakName} · HOUSE ${houseNo}`,0,0);
    ctx.fillStyle='rgba(248,250,252,.82)';ctx.font='700 11px Inter, sans-serif';
    ctx.fillText('ASTROLOGICAL TRAVEL CORRIDOR',0,24);
    ctx.restore();

    // Selected planet line is the road centerline, not a finite destination.
    if(followedPlanet){
      const absoluteBearing=norm(followedPlanet.siderealLon+90-chart.asc);
      const cameraRel=((absoluteBearing-(Number(displayHeading)||0)+540)%360)-180;
      const xShift=Math.max(-R*.28,Math.min(R*.28,(cameraRel/70)*R*.28));
      const farX=cx+xShift*.24;
      const nearX=cx+xShift;
      ctx.beginPath();ctx.moveTo(farX,horizonY);ctx.lineTo(nearX,originY+R*.06);
      ctx.strokeStyle='rgba(2,6,23,.92)';ctx.lineWidth=14;ctx.stroke();
      ctx.beginPath();ctx.moveTo(farX,horizonY);ctx.lineTo(nearX,originY+R*.06);
      ctx.strokeStyle=hexToRgba(NAKSHATRA_COLORS[activeNak],.98);ctx.lineWidth=7;ctx.stroke();
      ctx.beginPath();ctx.moveTo(farX,horizonY);ctx.lineTo(nearX,originY+R*.06);ctx.strokeStyle='rgba(255,247,194,.96)';ctx.lineWidth=2.4;ctx.stroke();

      // Repeating guide marks imply continuation; the user never reaches the planet.
      for(let k=1;k<=5;k++){
        const t=k/6;
        const y=horizonY+(originY-horizonY)*(t*t);
        const x=farX+(nearX-farX)*(t*t);
        ctx.beginPath();ctx.arc(x,y,3.4,0,Math.PI*2);ctx.fillStyle='rgba(255,247,194,.92)';ctx.fill();
      }

      // Raised planet beacon above the horizon.
      const beaconBaseY=horizonY+10;
      const beaconTopY=horizonY-R*.25;
      ctx.beginPath();ctx.moveTo(farX,beaconBaseY);ctx.lineTo(farX,beaconTopY);
      ctx.strokeStyle='rgba(255,233,166,.82)';ctx.lineWidth=2.4;ctx.stroke();
      const glow=ctx.createRadialGradient(farX,beaconTopY,2,farX,beaconTopY,34);
      glow.addColorStop(0,'rgba(255,247,194,.42)');glow.addColorStop(1,'rgba(244,200,66,0)');
      ctx.beginPath();ctx.arc(farX,beaconTopY,34,0,Math.PI*2);ctx.fillStyle=glow;ctx.fill();
      ctx.beginPath();ctx.arc(farX,beaconTopY,19,0,Math.PI*2);ctx.fillStyle='rgba(2,6,23,.90)';ctx.fill();ctx.strokeStyle='#FFF7C2';ctx.lineWidth=2.4;ctx.stroke();
      ctx.font='28px Georgia, serif';ctx.fillStyle='#FFF7C2';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(followedPlanet.glyph,farX,beaconTopY+1);
      ctx.font='800 10px Inter, sans-serif';ctx.fillStyle='#FFF7C2';ctx.fillText(`${followedPlanet.name.toUpperCase()} · ${Math.round(absoluteBearing)}°`,farX,beaconTopY-32);

      // Road label follows the selected planet corridor.
      ctx.save();ctx.translate((farX+nearX)/2,(horizonY+originY)/2);
      const ang=Math.atan2(originY-horizonY,nearX-farX);ctx.rotate(ang);
      ctx.font='800 11px Inter, sans-serif';ctx.fillStyle='rgba(255,247,194,.95)';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.shadowColor='rgba(0,0,0,.95)';ctx.shadowBlur=4;
      const pn=followedPlanet.nakshatra?.name||'—';
      ctx.fillText(`${followedPlanet.glyph} ${followedPlanet.name} · ${pn} · H${followedPlanet.house} · ${followedPlanet.sign} ${followedPlanet.degree}°`,0,-7);
      ctx.restore();
    }

    // User origin mark anchors the field.
    ctx.beginPath();ctx.arc(cx,originY,9,0,Math.PI*2);ctx.fillStyle='#60A5FA';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2.2;ctx.stroke();
    ctx.font='800 9px Inter, sans-serif';ctx.fillStyle='#BFDBFE';ctx.textAlign='center';ctx.fillText('YOU',cx,originY+19);
  };

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !chart) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) / 2 - 58;
    const headingOffset = Number.isFinite(Number(displayHeading)) ? Number(displayHeading) : 0;
    const rotation = 90 - chart.asc - headingOffset;
    const opacity = 1;

    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const point = (lon, radius) => {
      const a = rad(norm(lon + rotation) - 90);
      return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
    };

    const circle = (r, stroke, width = 1, fill = null) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.stroke();
    };

    // Flat mode is a dedicated travel-field renderer, not a tilted circular chart.
    const earlyDestinationZone = destinationZoneFromBearing(chart, Number(destinationBearing));
    const earlyTravelZone = destinationZoneFromBearing(chart, Number(travelBearing));
    if (flatMode) {
      drawFlatTravelField(ctx,{W,H,cx,cy,R,rotation,point,houseInner:R*.515,nakOuter:R*.852,nakInner:R*.685,destinationZone:earlyDestinationZone,travelZone:earlyTravelZone});
      return;
    }

    // Transparent navigation glass. The map remains readable below it.
    const glass = ctx.createRadialGradient(cx, cy, R * .08, cx, cy, R);
    glass.addColorStop(0, overlay ? 'rgba(2,6,23,.10)' : 'rgba(2,6,23,.50)');
    glass.addColorStop(.52, overlay ? 'rgba(2,6,23,.15)' : 'rgba(2,6,23,.58)');
    glass.addColorStop(1, overlay ? 'rgba(2,6,23,.24)' : 'rgba(2,6,23,.76)');
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = glass;
    ctx.fill();

    // Precision compass bezel: subtle double rim + one-degree ticks.
    circle(R, `rgba(244,200,66,${.92 * opacity})`, 1.35);
    circle(R - 7, `rgba(255,233,166,${.26 * opacity})`, .55);
    circle(R - 19, `rgba(244,200,66,${.18 * opacity})`, .45);

    for (let d = 0; d < 360; d += 1) {
      const major = d % 30 === 0;
      const ten = d % 10 === 0;
      const five = d % 5 === 0;
      const outer = R - 2;
      const len = major ? 16 : ten ? 11 : five ? 7 : 3.5;
      const inner = outer - len;
      const a = rad(d - 90);
      ctx.beginPath();
      ctx.moveTo(cx + inner * Math.cos(a), cy + inner * Math.sin(a));
      ctx.lineTo(cx + outer * Math.cos(a), cy + outer * Math.sin(a));
      ctx.strokeStyle = major
        ? `rgba(255,233,166,${.82 * opacity})`
        : ten
          ? `rgba(244,200,66,${.52 * opacity})`
          : `rgba(244,200,66,${(five ? .30 : .16) * opacity})`;
      ctx.lineWidth = major ? 1.2 : .45;
      ctx.stroke();
    }

    // Zodiac ring — small sign glyphs, never reused for planets.
    const zodiacOuter = R - 23;
    const zodiacInner = R * .855;
    for (let i = 0; i < 12; i++) {
      const s = rad(i * 30 + rotation - 90);
      const e = rad((i + 1) * 30 + rotation - 90);
      ctx.beginPath();
      ctx.arc(cx, cy, zodiacOuter, s, e);
      ctx.arc(cx, cy, zodiacInner, e, s, true);
      ctx.closePath();
      ctx.fillStyle = overlay
        ? (i % 2 ? 'rgba(5,8,24,.20)' : 'rgba(5,8,24,.11)')
        : (i % 2 ? 'rgba(15,23,42,.32)' : 'rgba(2,6,23,.20)');
      ctx.fill();
      ctx.strokeStyle = `rgba(244,200,66,${.62 * opacity})`;
      ctx.lineWidth = .9;
      ctx.stroke();

      const [x, y] = point(i * 30 + 15, (zodiacOuter + zodiacInner) / 2);
      ctx.font = compact ? '15px Georgia, serif' : '18px Georgia, serif';
      ctx.fillStyle = `rgba(255,233,166,${.96 * opacity})`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ZODIAC_GLYPHS[i], x, y);
    }

    // Nakshatra ring — all 27 names visible.
    const nakOuter = zodiacInner - 3;
    const nakInner = R * .685;
    const nakStep = 360 / 27;
    for (let i = 0; i < 27; i++) {
      const s = rad(i * nakStep + rotation - 90);
      const e = rad((i + 1) * nakStep + rotation - 90);
      ctx.beginPath();
      ctx.arc(cx, cy, nakOuter, s, e);
      ctx.arc(cx, cy, nakInner, e, s, true);
      ctx.closePath();
      ctx.fillStyle = overlay
        ? (i % 2 ? 'rgba(15,23,42,.30)' : 'rgba(68,52,16,.20)')
        : (i % 2 ? 'rgba(255,255,255,.014)' : 'rgba(244,200,66,.011)');
      ctx.fill();
      ctx.strokeStyle = `rgba(255,233,166,${.48 * opacity})`;
      ctx.lineWidth = .8;
      ctx.stroke();

      const lon = i * nakStep + nakStep / 2;
      const [x, y] = point(lon, (nakOuter + nakInner) / 2);
      ctx.save();
      ctx.translate(x, y);
      const screen = norm(lon + rotation);
      // Radial text: each nakshatra name follows its pizza-slice spoke toward the center.
      let textRotation = rad(screen - 90);
      if (screen > 180) textRotation += Math.PI;
      ctx.rotate(textRotation);
      ctx.font = compact ? '700 8px Inter, sans-serif' : '700 9.5px Inter, sans-serif';
      ctx.fillStyle = `rgba(255,255,255,${.98 * opacity})`;
      ctx.shadowColor = 'rgba(0,0,0,.95)';
      ctx.shadowBlur = 3;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(shortNakshatra(NAKSHATRAS[i]), 0, 0);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // House / navigation ring.
    const houseOuter = nakInner - 3;
    const houseInner = R * .515;
    const destinationZone = destinationZoneFromBearing(chart, Number(destinationBearing));
    const travelZone = destinationZoneFromBearing(chart, Number(travelBearing));

    for (let h = 0; h < 12; h++) {
      const cusp = chart.houseCusps[h];
      let nextCusp = chart.houseCusps[(h + 1) % 12];
      if (nextCusp <= cusp) nextCusp += 360;
      const span = nextCusp - cusp;
      const s = rad(cusp + rotation - 90);
      const e = rad(nextCusp + rotation - 90);
      const active = selectedHouse === h + 1 || destinationZone?.house === h + 1;
      ctx.beginPath();
      ctx.arc(cx, cy, houseOuter, s, e);
      ctx.arc(cx, cy, houseInner, e, s, true);
      ctx.closePath();
      ctx.fillStyle = active
        ? `rgba(244,200,66,${overlay ? .16 : .14})`
        : overlay ? 'rgba(2,6,23,.18)' : 'rgba(255,255,255,.012)';
      ctx.fill();
      ctx.strokeStyle = active
        ? `rgba(255,233,166,${.96 * opacity})`
        : `rgba(255,255,255,${.44 * opacity})`;
      ctx.lineWidth = active ? 1.8 : 1.0;
      ctx.stroke();

      const [x, y] = point(cusp + span / 2, (houseOuter + houseInner) / 2);
      ctx.font = compact ? '800 10px Inter, sans-serif' : '800 12px Inter, sans-serif';
      ctx.fillStyle = active ? PALE_GOLD : `rgba(248,250,252,${.76 * opacity})`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(h + 1), x, y);
    }

    // Explicit house cusp spokes: these are intentionally stronger than the map beneath.
    for (let h = 0; h < 12; h++) {
      const cusp = chart.houseCusps[h];
      const [x1, y1] = point(cusp, houseInner);
      const [x2, y2] = point(cusp, houseOuter);
      const angular = h % 3 === 0;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = angular ? 'rgba(255,233,166,.96)' : 'rgba(248,250,252,.64)';
      ctx.lineWidth = angular ? 2.0 : 1.25;
      ctx.stroke();
    }

    circle(houseOuter, 'rgba(255,233,166,.72)', 1.1);
    circle(houseInner, 'rgba(255,233,166,.72)', 1.1);
    circle(nakOuter, 'rgba(255,233,166,.58)', .9);
    circle(nakInner, 'rgba(255,233,166,.58)', .9);

    // Inner aspect field.
    circle(houseInner - 1, `rgba(244,200,66,${.36 * opacity})`, .8, overlay ? 'rgba(2,6,23,.08)' : 'rgba(2,6,23,.20)');

    const aspectRadius = houseInner - 34;
    const byId = new Map(planets.map(p => [p.id, p]));
    calculateAspects(planets).forEach(aspect => {
      const a = byId.get(aspect.aId);
      const b = byId.get(aspect.bId);
      if (!a || !b) return;
      const [x1, y1] = point(a.siderealLon, aspectRadius);
      const [x2, y2] = point(b.siderealLon, aspectRadius);
      const style = ASPECT_STYLE[aspect.type] || ASPECT_STYLE.Sextile;
      // Dark halo first, then the colored aspect so lines remain visible over streets.
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'rgba(2,6,23,.82)';
      ctx.globalAlpha = 1;
      ctx.lineWidth = aspect.orb < 1 ? 4.2 : 3.1;
      ctx.setLineDash(style[1]);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = style[0];
      ctx.globalAlpha = overlay ? .96 : 1;
      ctx.lineWidth = aspect.orb < 1 ? 2.4 : 1.65;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    });


    // Follow-planet navigation beam. This is a compass projection of the
    // planet's astrological position relative to the live Ascendant; it is
    // not a claim that the physical planet is located along the street.
    const followedPlanet = planets.find(p => p.id === followingPlanetId);
    if (followedPlanet && Number.isFinite(followedPlanet.siderealLon)) {
      const absoluteBearing = norm(followedPlanet.siderealLon + 90 - chart.asc);
      const [fx, fy] = point(followedPlanet.siderealLon, R - 13);
      const [px, py] = point(followedPlanet.siderealLon, houseInner - 4);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(fx, fy);
      ctx.strokeStyle = 'rgba(2,6,23,.92)';
      ctx.lineWidth = 10;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(fx, fy);
      ctx.strokeStyle = 'rgba(255,233,166,.98)';
      ctx.lineWidth = 4.2;
      ctx.stroke();

      const ang = Math.atan2(fy - cy, fx - cx);
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(ang + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.lineTo(8, 7);
      ctx.lineTo(-8, 7);
      ctx.closePath();
      ctx.fillStyle = '#FFF7C2';
      ctx.fill();
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(px, py, 17, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(244,200,66,.18)';
      ctx.fill();
      ctx.strokeStyle = '#FFF7C2';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      if (!compact) {
        const labels = ['N','NE','E','SE','S','SW','W','NW'];
        const dir = labels[Math.round(absoluteBearing / 45) % 8];
        ctx.font = '800 10px Inter, sans-serif';
        ctx.fillStyle = '#FFF7C2';
        ctx.textAlign = 'center';
        ctx.fillText(`FOLLOW ${followedPlanet.glyph} ${followedPlanet.name} · ${absoluteBearing.toFixed(0)}° ${dir}`, cx, cy + 22);
      }

      if (flatMode) {
        const nk = followedPlanet.nakshatra;
        const signDegree = Number(followedPlanet.degree);
        const nkDegree = Number(nk?.degreeInNakshatra);
        const midX = cx + (fx - cx) * .55;
        const midY = cy + (fy - cy) * .55;
        const label = `${followedPlanet.glyph} ${followedPlanet.name}  ·  H${followedPlanet.house}  ·  ${nk?.name || '—'}  ·  ${followedPlanet.sign} ${Number.isFinite(signDegree)?signDegree.toFixed(1):followedPlanet.degree}°`;
        ctx.save();
        ctx.font = '800 10px Inter, sans-serif';
        const tw = Math.min(310, ctx.measureText(label).width + 20);
        const bx = Math.max(12, Math.min(W - tw - 12, midX - tw / 2));
        const by = Math.max(12, Math.min(H - 36, midY - 14));
        ctx.fillStyle = 'rgba(2,6,23,.90)';
        ctx.strokeStyle = 'rgba(255,233,166,.86)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, tw, 28, 8); else ctx.rect(bx, by, tw, 28);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFF7C2';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, bx + tw / 2, by + 10);
        if (Number.isFinite(nkDegree)) {
          ctx.font = '700 8px Inter, sans-serif';
          ctx.fillStyle = '#F4C842';
          ctx.fillText(`Nakshatra degree ${nkDegree.toFixed(2)}°`, bx + tw / 2, by + 20);
        }
        ctx.restore();
      }
    }

    // True planet glyphs at exact sidereal longitudes. Crowded bodies step inward.
    const planetBaseRadius = houseInner - 8;
    const placed = [];
    planets.forEach(p => {
      if (!Number.isFinite(p.siderealLon)) return;
      const closeCount = placed.filter(lon => Math.abs(((lon - p.siderealLon + 540) % 360) - 180) < 4.2).length;
      const ring = planetBaseRadius - closeCount * 21;
      placed.push(p.siderealLon);
      const [x, y] = point(p.siderealLon, ring);
      const selected = selectedPlanet?.id === p.id;

      ctx.beginPath();
      ctx.arc(x, y, selected ? 14 : 11.5, 0, Math.PI * 2);
      ctx.fillStyle = selected
        ? 'rgba(244,200,66,.22)'
        : overlay ? 'rgba(3,7,18,.43)' : 'rgba(3,7,18,.72)';
      ctx.fill();
      ctx.strokeStyle = selected ? 'rgba(255,233,166,.95)' : 'rgba(244,200,66,.35)';
      ctx.lineWidth = selected ? 1.1 : .55;
      ctx.stroke();

      ctx.font = selected ? '22px Georgia, serif' : '18px Georgia, serif';
      ctx.fillStyle = selected ? '#FFFBEA' : GOLD;
      ctx.shadowColor = 'rgba(0,0,0,.9)';
      ctx.shadowBlur = 2;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.glyph || '•', x, y + .5);
      ctx.shadowBlur = 0;
    });

    // Eight compass bearings outside the astrological rings.
    // These labels need to remain readable over a detailed street map, so each
    // gets a dark translucent badge and the cardinal directions are larger.
    COMPASS_POINTS.forEach(([label, bearing]) => {
      const a = rad(norm(bearing - headingOffset) - 90);
      const cardinal = label.length === 1;
      const rr = R + (cardinal ? 35 : 33);
      const x = cx + rr * Math.cos(a);
      const y = cy + rr * Math.sin(a);
      const isEast = label === 'E';
      const badgeW = cardinal ? 34 : 38;
      const badgeH = cardinal ? 28 : 22;

      ctx.save();
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x - badgeW / 2, y - badgeH / 2, badgeW, badgeH, cardinal ? 9 : 7);
      } else {
        ctx.rect(x - badgeW / 2, y - badgeH / 2, badgeW, badgeH);
      }
      ctx.fillStyle = isEast ? 'rgba(67,52,12,.92)' : 'rgba(2,6,23,.86)';
      ctx.fill();
      ctx.strokeStyle = isEast ? 'rgba(255,233,166,.98)' : 'rgba(244,200,66,.78)';
      ctx.lineWidth = isEast ? 1.8 : 1.2;
      ctx.stroke();

      ctx.font = cardinal ? '800 17px Inter, sans-serif' : '750 10px Inter, sans-serif';
      ctx.fillStyle = isEast ? '#FFF7C2' : cardinal ? '#FFE9A6' : '#F8E7A0';
      ctx.shadowColor = 'rgba(0,0,0,.95)';
      ctx.shadowBlur = 3;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y + .5);
      ctx.restore();
    });

    // Live / transit Ascendant. Wheel rotation locks it to East.
    const ascRadius = houseOuter + 6;
    const [tx, ty] = point(chart.asc, ascRadius);
    ctx.beginPath();
    ctx.arc(tx, ty, compact ? 5.8 : 7, 0, Math.PI * 2);
    ctx.fillStyle = BLUE;
    ctx.fill();
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 1.25;
    ctx.stroke();
    if (!compact) {
      ctx.font = '700 8.5px Inter, sans-serif';
      ctx.fillStyle = '#BFDBFE';
      ctx.textAlign = 'left';
      ctx.fillText(`TRANSIT ASC · ${getSignData(chart.asc).label}`, tx + 11, ty - 1);
    }

    // Natal Ascendant as a separate fixed zodiac-degree marker.
    if (Number.isFinite(Number(natalAsc))) {
      const na = Number(natalAsc);
      const [nx, ny] = point(na, ascRadius - 21);
      const sd = getSignData(na);
      const angle = rad(norm(na + rotation) - 90);
      ctx.save();
      ctx.translate(nx, ny);
      ctx.rotate(angle + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(6.5, 6);
      ctx.lineTo(-6.5, 6);
      ctx.closePath();
      ctx.fillStyle = NATAL;
      ctx.fill();
      ctx.strokeStyle = WHITE;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      if (!compact) {
        ctx.font = '700 8px Inter, sans-serif';
        ctx.fillStyle = '#F5D0FE';
        ctx.textAlign = nx >= cx ? 'left' : 'right';
        ctx.fillText(`NATAL ASC · ${sd.label}`, nx + (nx >= cx ? 11 : -11), ny - 1);
      }
    }

    // Destination marker uses the actual map bearing and destination house zone.
    if (destinationZone) {
      const [dx, dy] = point(destinationZone.longitude, houseInner - 3);
      ctx.beginPath();
      ctx.arc(dx, dy, compact ? 5.4 : 6.6, 0, Math.PI * 2);
      ctx.fillStyle = GOLD;
      ctx.fill();
      ctx.strokeStyle = WHITE;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(dx, dy);
      ctx.strokeStyle = 'rgba(244,200,66,.38)';
      ctx.lineWidth = .8;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Minimal central locator reticle; avoids blocking streets beneath the wheel.
    ctx.beginPath();
    ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(96,165,250,.70)';
    ctx.lineWidth = .75;
    ctx.stroke();

    if (overlay && Number.isFinite(radiusMeters)) {
      ctx.font = '700 8.5px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,.88)';
      ctx.textAlign = 'center';
      ctx.fillText(`MAP RADIUS · ${formatDistance(radiusMeters / 1000, distanceUnit).toUpperCase()}`, cx, H - 13);
    }
  }, [chart, natalAsc, planets, selectedPlanet, selectedHouse, destinationBearing, compact, overlay, radiusMeters, distanceUnit, displayHeading, followingPlanetId, flatMode, travelBearing]);

  const handleClick = e => {
    if (!chart) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (ref.current.width / rect.width);
    const y = (e.clientY - rect.top) * (ref.current.height / rect.height);
    const cx = ref.current.width / 2;
    const cy = ref.current.height / 2;
    const R = Math.min(ref.current.width, ref.current.height) / 2 - 58;
    const dist = Math.hypot(x - cx, y - cy);
    const screen = norm(Math.atan2(y - cy, x - cx) * 180 / Math.PI + 90);
    const lon = norm(screen - (90 - chart.asc - (Number.isFinite(Number(displayHeading)) ? Number(displayHeading) : 0)));

    // Planet hit area is intentionally generous for mobile use.
    if (dist < R * .56) {
      let nearest = null;
      let gap = 999;
      for (const p of planets) {
        const d = Math.abs(((p.siderealLon - lon + 540) % 360) - 180);
        if (d < gap) { gap = d; nearest = p; }
      }
      if (nearest && gap < 10) {
        onSelectPlanet?.(nearest);
        return;
      }
    }

    if (dist >= R * .515 && dist <= R * .685) {
      const house = Math.floor(norm(lon - chart.asc) / 30) + 1;
      onSelectHouse?.(house);
    }
  };

  return (
    <div className={overlay ? 'clean-wheel overlay-wheel compass-v31' : 'clean-wheel compass-v31'}>
      <canvas
        ref={ref}
        width={size}
        height={size}
        onClick={handleClick}
        className={compact ? 'wheel-canvas compact' : 'wheel-canvas'}
        aria-label="Interactive sidereal navigation compass. Zodiac symbols are in the outer ring; gold inner glyphs are the actual transit planets. Blue circle is current transit Ascendant, pink triangle is natal Ascendant, and gold destination marker follows the real route bearing."
      />
      {!compact && (
        <div className="wheel-key">
          <span><i className="transit-asc-dot"/>Transit ASC</span>
          <span><i className="natal-asc-dot"/>Natal ASC</span>
          <span><i className="dest-dot"/>Destination zone</span>
          <span>Gold inner symbols = transit planets</span>
        </div>
      )}
    </div>
  );
}
