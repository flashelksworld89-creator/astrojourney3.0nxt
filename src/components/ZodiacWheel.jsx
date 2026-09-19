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
  travelBearing = null,
  compact = false,
  overlay = false,
  radiusMeters = null,
  distanceUnit = 'ft'
}) {
  const ref = useRef(null);
  const size = 760;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !chart) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) / 2 - 58;
    const rotation = 90 - chart.asc;
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
      let textRotation = rad(screen);
      if (screen > 90 && screen < 270) textRotation += Math.PI;
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
      // Dark halo first so aspect geometry remains visible over streets.
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'rgba(2,6,23,.86)';
      ctx.globalAlpha = 1;
      ctx.lineWidth = aspect.orb < 1 ? 4.2 : 3.2;
      ctx.setLineDash(style[1]);
      ctx.stroke();
      // Bright aspect line on top.
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = style[0];
      ctx.globalAlpha = overlay ? .96 : 1;
      ctx.lineWidth = aspect.orb < 1 ? 2.35 : 1.65;
      ctx.setLineDash(style[1]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    });

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
      const a = rad(bearing - 90);
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


    // User-selected travel direction. This is a map-navigation bearing only; it
    // does not change sidereal longitudes, houses, or the destination calculation.
    if (Number.isFinite(Number(travelBearing))) {
      const bearing = norm(Number(travelBearing));
      const a = rad(bearing - 90);
      const arrowR = houseInner - 54;
      const ex = cx + arrowR * Math.cos(a);
      const ey = cy + arrowR * Math.sin(a);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = 'rgba(125,211,252,.94)';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([8,5]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(a + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0,-10);ctx.lineTo(7,6);ctx.lineTo(-7,6);ctx.closePath();
      ctx.fillStyle='#7DD3FC';ctx.fill();
      ctx.strokeStyle='rgba(2,6,23,.95)';ctx.lineWidth=1.2;ctx.stroke();
      ctx.restore();
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
  }, [chart, natalAsc, planets, selectedPlanet, selectedHouse, destinationBearing, travelBearing, compact, overlay, radiusMeters, distanceUnit]);

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
    const lon = norm(screen - (90 - chart.asc));

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
    <div className={overlay ? 'clean-wheel overlay-wheel compass-v31 compass-v33' : 'clean-wheel compass-v31 compass-v33'}>
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
