const DIRECTIONS = [
  ['N',0],['NE',45],['E',90],['SE',135],['S',180],['SW',225],['W',270],['NW',315]
];
const norm=n=>((Number(n)%360)+360)%360;

export default function MapDirectionControls({bearing=0,routeBearing=0,onChange}){
  const current=norm(bearing);
  return <div className="map-direction-panel" aria-label="Travel direction control">
    <div className="direction-topline"><strong>Travel direction</strong><span>{Math.round(current)}°</span></div>
    <div className="direction-buttons">
      {DIRECTIONS.map(([label,value])=><button type="button" key={label} className={Math.abs((((current-value)+540)%360)-180)<10?'active':''} onClick={()=>onChange(value)}>{label}</button>)}
    </div>
    <div className="direction-actions">
      <button type="button" onClick={()=>onChange(norm(routeBearing))}>Use destination bearing</button>
      <input aria-label="Travel direction degrees" type="range" min="0" max="359" step="1" value={Math.round(current)} onChange={e=>onChange(Number(e.target.value))}/>
    </div>
  </div>;
}
