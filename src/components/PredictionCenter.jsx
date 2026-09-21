import { Sparkles, Loader2 } from 'lucide-react';

function Chips({title,items=[]}){
  if(!items.length)return null;
  return <div className="prediction-center-manifest-group"><b>{title}</b><div>{items.map((x,i)=><span key={`${x}-${i}`}>{x}</span>)}</div></div>;
}

export default function PredictionCenter({data,busy,selectedPlanet,selectedHouse,destinationZone}){
  const focus=selectedPlanet?`${selectedPlanet.glyph||''} ${selectedPlanet.name}`:selectedHouse?`House ${selectedHouse}`:'Overall journey';
  return <section className="card prediction-center" aria-label="Prediction center">
    <div className="prediction-center-header">
      <div><small>ONE SYNTHESIS ENGINE</small><div className="section-title"><Sparkles size={14}/> Prediction Center <span>{focus}</span></div></div>
      {busy&&<div className="prediction-center-busy"><Loader2 className="spin" size={14}/> Updating</div>}
    </div>
    {!data?<p className="prediction-center-empty">The prediction will appear here after the natal chart, transit chart, and destination field are ready.</p>:<>
      <p className="prediction-center-prose">{data.overallProse}</p>
      <div className="prediction-center-sections">
        <div><b>Mindset & Actions</b><p>{data.sections?.mindsetActions||'No strong Moon/self testimony is active in the current evidence set.'}</p></div>
        <div><b>Developments En Route</b><p>{data.sections?.developmentsEnRoute||'No unusually concentrated route testimony is active.'}</p></div>
        <div><b>People & Encounters</b><p>{data.sections?.peopleEncounters||'No unusually concentrated 7th-house or destination-person testimony is active.'}</p></div>
        <div><b>Destination Conditions</b><p>{data.sections?.destinationConditions||`Destination field${destinationZone?.house?` is House ${destinationZone.house}`:''}.`}</p></div>
      </div>
      <div className="prediction-center-manifestations">
        <small>Possible concrete manifestations</small>
        <div className="prediction-center-manifest-grid">
          <Chips title="Events" items={data.manifestations?.events}/>
          <Chips title="People" items={data.manifestations?.people}/>
          <Chips title="Places" items={data.manifestations?.places}/>
          <Chips title="Objects" items={data.manifestations?.objects}/>
        </div>
      </div>
      {!!data.basis?.length&&<details className="prediction-center-basis"><summary>Astrological basis</summary><ul>{data.basis.map((x,i)=><li key={i}>{x}</li>)}</ul><p className="small-note">{data.terminologyRule}</p></details>}
    </>}
  </section>;
}
