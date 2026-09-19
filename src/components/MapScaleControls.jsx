const NAKSHATRA_DIAMETER_METERS = 1 * 1609.344;
const NAKSHATRA_RADIUS_METERS = NAKSHATRA_DIAMETER_METERS / 2;

const UNITS = {
  ft: { label:'Feet', toMeters:v=>v*0.3048, fromMeters:m=>m/0.3048, min:100, max:30000, step:50 },
  yd: { label:'Yards', toMeters:v=>v*0.9144, fromMeters:m=>m/0.9144, min:50, max:10000, step:25 },
  mi: { label:'Miles', toMeters:v=>v*1609.344, fromMeters:m=>m/1609.344, min:0.05, max:12, step:0.05 },
  m:  { label:'Meters', toMeters:v=>v, fromMeters:m=>m, min:25, max:12000, step:25 },
  km: { label:'Kilometers', toMeters:v=>v*1000, fromMeters:m=>m/1000, min:0.05, max:20, step:0.05 }
};

const PRESETS = [
  {label:'250 ft', meters:76.2},
  {label:'500 ft', meters:152.4},
  {label:'1,000 ft', meters:304.8},
  {label:'2,500 ft', meters:762},
  {label:'Nakshatra · 1 mi Ø', meters:NAKSHATRA_RADIUS_METERS, primary:true},
  {label:'1 mi radius', meters:1609.344}
];

function pretty(value, unit) {
  if(unit==='mi'||unit==='km') return value<1 ? value.toFixed(2) : value.toFixed(value<10?2:1);
  return Math.round(value).toLocaleString();
}

export default function MapScaleControls({radiusMeters, unit, onUnitChange, onRadiusChange}) {
  const cfg=UNITS[unit]||UNITS.ft;
  const raw=cfg.fromMeters(radiusMeters);
  const value=Math.min(cfg.max,Math.max(cfg.min,raw));
  const atNakshatra=Math.abs(radiusMeters-NAKSHATRA_RADIUS_METERS)<5;

  const setDisplayValue=(next)=>{
    const parsed=Number(next);
    if(!Number.isFinite(parsed))return;
    onRadiusChange(cfg.toMeters(Math.min(cfg.max,Math.max(cfg.min,parsed))));
  };

  return (
    <div className="map-scale-panel" aria-label="Wheel geographic scale">
      <div className="scale-topline">
        <strong>Wheel reach</strong>
        <span>{pretty(raw,unit)} {unit}</span>
      </div>
      <div className="scale-row">
        <input aria-label="Wheel radius" type="range" min={cfg.min} max={cfg.max} step={cfg.step} value={value} onChange={e=>setDisplayValue(e.target.value)}/>
        <select value={unit} onChange={e=>onUnitChange(e.target.value)} aria-label="Distance unit">
          {Object.entries(UNITS).map(([key,item])=><option key={key} value={key}>{item.label}</option>)}
        </select>
      </div>
      <div className="scale-presets">
        {PRESETS.map(p=><button type="button" className={p.primary&&atNakshatra?'active':''} key={p.label} onClick={()=>onRadiusChange(p.meters)}>{p.label}</button>)}
      </div>
      <div className="scale-note"><b>Canonical nakshatra map scale:</b> 1 mile in diameter = 0.5 mile / 2,640 ft from the user to the rim. Changing distance expands or contracts the same 27-slice compass without changing the astrology.</div>
    </div>
  );
}
