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
    {item.experience&&<details className="prediction-center-experience"><summary>Experience sequence</summary><div className="experience-sequence-grid"><div><b>Notice</b><p>{item.experience.notice}</p></div><div><b>Recognize</b><p>{item.experience.recognize}</p></div><div><b>Decide</b><p>{item.experience.decide}</p></div>{item.experience.speak&&<div><b>Speech</b><p>{item.experience.speak}</p></div>}<div><b>Action</b><p>{item.experience.act}</p></div></div></details>}
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
      <p className="prediction-center-intro"><b>{data?.forecastLabel||'Daily overview'}:</b> Each planet is interpreted against the natal chart, scenario-priority houses and lords, Moon testimony, Bhavat Bhavam, route fields, destination field, nakshatra modifiers, dispositors, and your controlled terminology.</p>{(['neighbors','home'].includes(data?.forecastMode)&&data?.moonNeighborhoodFactor?.prose)&&<div className="success">{data.moonNeighborhoodFactor.prose}</div>}
      <div className="planet-route-prediction-grid">
        {forecasts.map(item=><PlanetPredictionCard key={item.planetId} item={item} active={selectedPlanet?.id===item.planetId} onSelect={onPlanetSelect}/>)}
      </div>
    </>}
  </section>;
}
