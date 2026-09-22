const MODES=[
  ['daily','Daily overview'],
  ['personal','Personal'],
  ['short_travel','Short-distance travel'],
  ['long_travel','Long-distance travel'],
  ['home','Home environment'],
  ['work','Work environment'],
  ['recreation','Recreational activity'],
  ['earning','Earning ability'],
  ['neighbors','Neighborhood / neighbors']
];

export default function ForecastModeSelector({value='daily',onChange}){
  return <section className="card forecast-mode-selector">
    <div className="section-title">Forecast scenario</div>
    <p className="small-note">Choose what the prediction engine should prioritize. The same natal and transit chart is reused; only the relevant houses, lords, Moon testimony, route fields, and terminology are emphasized.</p>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      {MODES.map(([id,label])=><button key={id} type="button" className={value===id?'primary':'secondary'} onClick={()=>onChange?.(id)}>{label}</button>)}
    </div>
  </section>;
}
