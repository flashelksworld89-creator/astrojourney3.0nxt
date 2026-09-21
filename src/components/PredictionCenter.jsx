import { Sparkles, Loader2 } from 'lucide-react';

function Chips({title,items=[]}){
  if(!items.length)return null;
  return <div className="prediction-center-manifest-group"><b>{title}</b><div>{items.map((x,i)=><span key={`${x}-${i}`}>{x}</span>)}</div></div>;
}

function PlanetPredictionCard({item,active,onSelect}){
  return <article className={`planet-route-prediction ${active?'active':''}`}>
    <button className="planet-route-head" type="button" onClick={()=>onSelect?.(item.planetId)}>
      <span className="planet-route-glyph">{item.glyph||'•'}</span>
      <span><b>{item.planetName}</b><small>{item.sign} {Number(item.degree).toFixed(2)}° · H{item.house}{item.nakshatra?` · ${item.nakshatra}`:''}{item.pada?` P${item.pada}`:''}</small></span>
      {item.retrograde&&<em>R</em>}
    </button>
    <p>{item.prose}</p>
    <div className="planet-route-manifest-row">
      <Chips title="Events" items={item.manifestations?.events}/>
      <Chips title="People" items={item.manifestations?.people}/>
      <Chips title="Objects" items={item.manifestations?.objects}/>
      <Chips title="Places" items={item.manifestations?.places}/>
    </div>
    {!!item.basis?.length&&<details className="prediction-center-basis"><summary>Astrological basis</summary><ul>{item.basis.map((x,i)=><li key={i}>{x}</li>)}</ul></details>}
  </article>;
}

export default function PredictionCenter({data,busy,selectedPlanet,onPlanetSelect}){
  const forecasts=data?.planetPredictions||[];
  return <section className="card prediction-center" aria-label="Planet-by-planet route predictions">
    <div className="prediction-center-header">
      <div><small>VEDIC ROUTE FORECASTS</small><div className="section-title"><Sparkles size={14}/> Planet-by-planet predictions <span>{forecasts.length||0} PLANETS</span></div></div>
      {busy&&<div className="prediction-center-busy"><Loader2 className="spin" size={14}/> Updating</div>}
    </div>
    {!data?<p className="prediction-center-empty">Planet forecasts will appear after the natal chart, transit chart, and destination are ready.</p>:<>
      <p className="prediction-center-intro">Each planet is interpreted separately against the natal chart, route lords, Moon testimony, route fields, destination field, nakshatra modifiers, dispositors, and your private terminology.</p>
      <div className="planet-route-prediction-grid">
        {forecasts.map(item=><PlanetPredictionCard key={item.planetId} item={item} active={selectedPlanet?.id===item.planetId} onSelect={onPlanetSelect}/>)}
      </div>
    </>}
  </section>;
}
