import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';

function toLocalInput(date){
  const pad=n=>String(n).padStart(2,'0');
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function fmtDate(date){
  try{return new Intl.DateTimeFormat(undefined,{year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(date)}catch{return String(date||'')}
}

export default function TransitTimeControlPanel({date,onChange,live,onLive,chart}){
  const [now,setNow]=useState(()=>new Date());
  useEffect(()=>{const id=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(id)},[]);
  const shift=ms=>onChange(new Date(date.getTime()+ms));
  const planets=chart?.planets||[];
  const currentTime=now.toLocaleTimeString([], {hour:'numeric',minute:'2-digit',second:'2-digit'});
  const currentDate=now.toLocaleDateString([], {weekday:'short',month:'short',day:'numeric',year:'numeric'});
  const zone=Intl.DateTimeFormat().resolvedOptions().timeZone||'Local time';

  return <section className="card astro-control-panel transit-control-panel">
    <div className="astro-control-head">
      <div><small>LIVE + SELECTED TIME</small><div className="section-title"><Clock3 size={15}/> Transit chart <span>{live?'LIVE':'PAST / FUTURE'}</span></div></div>
      <div className="live-clock-mini"><b>{currentTime}</b><span>{currentDate}</span><small>{zone}</small></div>
    </div>

    <div className="journey-calendar-block">
      <label><CalendarDays size={13}/> Wheel date & time</label>
      <input className="input" type="datetime-local" value={toLocalInput(date)} onChange={e=>onChange(new Date(e.target.value))}/>
      <div className="time-grid compact-time-grid">
        <button onClick={()=>shift(-86400000)}>-1 day</button>
        <button onClick={()=>shift(-3600000)}><ChevronLeft size={15}/></button>
        <button className={live?'active':''} onClick={onLive}>Now</button>
        <button onClick={()=>shift(3600000)}><ChevronRight size={15}/></button>
        <button onClick={()=>shift(86400000)}>+1 day</button>
      </div>
    </div>

    <div className="panel-subhead"><span>Transit positions</span><small>{fmtDate(date)}</small></div>
    {!planets.length?<div className="muted">Transit positions are being calculated…</div>:<div className="transit-position-grid compact-position-grid">
      {planets.map(p=><div className="transit-position-row" key={p.id}>
        <div className="transit-planet"><b>{p.glyph} {p.name}</b>{p.retrograde&&<span className="retrograde-tag">R</span>}</div>
        <div className="transit-sign">{p.sign} {Number(p.degree).toFixed(2)}°</div>
        <div className="transit-meta">H{p.house} · {p.nakshatra?.name||'—'}{p.nakshatra?.pada?` P${p.nakshatra.pada}`:''}</div>
      </div>)}
    </div>}
  </section>;
}
