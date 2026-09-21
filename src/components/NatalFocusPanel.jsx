import { Loader2, Sparkles } from 'lucide-react';
import PredictionFocusSelector from './PredictionFocusSelector';
import { getSignData } from '../lib/astro';

export default function NatalFocusPanel({natalStatus,natalError,natalChart,houseLords,focusHouses,focusLords,onFocusChange,natalAudit}){
  const planets=natalChart?.planets||[];
  const natalSun=planets.find(p=>p.id==='sun');
  const natalMoon=planets.find(p=>p.id==='moon');
  return <section className="card astro-control-panel natal-focus-panel">
    <div className="astro-control-head">
      <div><small>NATAL REFERENCE</small><div className="section-title"><Sparkles size={15}/> Natal chart + prediction focus <span>{natalStatus==='verified'?'ACTIVE':natalStatus==='error'?'ERROR':'CALCULATING'}</span></div></div>
    </div>
    {natalStatus==='calculating'&&<div className="natal-status-line"><Loader2 className="spin" size={15}/> Calculating natal Ascendant, houses and planets…</div>}
    {natalStatus==='error'&&<div className="natal-error"><b>Natal chart was not generated.</b><span>{natalError}</span><span>Return to Setup and verify birth date, exact birth time, birthplace and UTC offset.</span></div>}
    {natalStatus==='verified'&&natalChart&&<>
      <div className="natal-proof-grid compact-natal-proof"><div><small>ASC</small><b>{getSignData(natalChart.asc).label}</b></div><div><small>Sun</small><b>{natalSun?`${natalSun.sign} ${natalSun.degree}°`:'—'}</b></div><div><small>Moon</small><b>{natalMoon?`${natalMoon.sign} ${natalMoon.degree}°`:'—'}</b></div><div><small>Houses</small><b>{natalChart.houseCusps?.length||0}</b></div></div>
      <div className="panel-subhead"><span>Natal positions</span><small>birth chart</small></div>
      <div className="transit-position-grid compact-position-grid natal-position-grid">
        {planets.map(p=><div className="transit-position-row natal-position-row" key={p.id}>
          <div className="transit-planet"><b>{p.glyph} {p.name}</b></div>
          <div className="transit-sign">{p.sign} {Number(p.degree).toFixed(2)}°</div>
          <div className="transit-meta">H{p.house} · {p.nakshatra?.name||'—'}{p.nakshatra?.pada?` P${p.nakshatra.pada}`:''}</div>
        </div>)}
      </div>
      {natalAudit&&<div className="natal-used-audit compact-audit"><b>Prediction evidence</b><span>{natalAudit.transitNatalAspectCount} planet contacts</span><span>{natalAudit.transitNatalHouseAspectCount} house contacts</span></div>}
      <PredictionFocusSelector embedded houseLords={houseLords} focusHouses={focusHouses} focusLords={focusLords} onChange={onFocusChange}/>
    </>}
  </section>;
}
