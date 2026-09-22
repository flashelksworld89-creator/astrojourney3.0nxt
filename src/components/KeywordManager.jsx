import { useEffect, useMemo, useState } from 'react';

const PLANETS=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','rahu','ketu'];
const STORAGE_KEY='astrowalk_private_vocab_v2';

function splitCsvLine(line){
  const out=[];let cur='';let quoted=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(ch==='"'){if(quoted&&line[i+1]==='"'){cur+='"';i++;}else quoted=!quoted;}
    else if(ch===','&&!quoted){out.push(cur.trim());cur='';}
    else cur+=ch;
  }
  out.push(cur.trim());
  return out;
}

function parseCsv(text){
  const out={};
  const lines=String(text||'').split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
  lines.forEach((line,i)=>{
    const parts=splitCsvLine(line);
    if(i===0&&parts.some(v=>/planet/i.test(v))&&parts.some(v=>/term/i.test(v)))return;
    if(parts.length<4)return;
    const [planetRaw,termRaw,categoryRaw,weightRaw,requiresRaw='general_context']=parts;
    const planet=String(planetRaw||'').toLowerCase().trim();
    const term=String(termRaw||'').trim();
    const category=String(categoryRaw||'general').toLowerCase().trim().replace(/\s+/g,'_');
    if(!PLANETS.includes(planet)||!term)return;
    const weight=Math.max(0,Math.min(1,Number(weightRaw)||0.65));
    const requires=String(requiresRaw||'general_context').trim()||'general_context';
    out[planet]??={};
    out[planet][category]??=[];
    out[planet][category].push({term,weight,requires,category});
  });
  return out;
}

function countTerms(vocab){
  return Object.values(vocab||{}).reduce((total,bank)=>total+Object.values(bank||{}).reduce((n,list)=>n+(Array.isArray(list)?list.length:0),0),0);
}

export default function KeywordManager(){
  const [csv,setCsv]=useState('Planet,Term,Category,Weight,Requires\n');
  const [status,setStatus]=useState('');
  const vocab=useMemo(()=>parseCsv(csv),[csv]);
  const json=useMemo(()=>JSON.stringify(vocab,null,2),[vocab]);
  const termCount=useMemo(()=>countTerms(vocab),[vocab]);

  useEffect(()=>{
    try{
      const saved=localStorage.getItem(STORAGE_KEY);
      if(saved){
        const parsed=JSON.parse(saved);
        if(parsed?.csv)setCsv(parsed.csv);
      }
    }catch{}
  },[]);

  const save=()=>{
    try{
      localStorage.setItem(STORAGE_KEY,JSON.stringify({csv,vocabulary:vocab,savedAt:new Date().toISOString()}));
      setStatus(`Saved ${termCount} private terms in this browser. Predictions can use them immediately.`);
    }catch{
      setStatus('The browser blocked local storage. Keep this page open and try again.');
    }
  };

  const clear=()=>{
    try{localStorage.removeItem(STORAGE_KEY);}catch{}
    setCsv('Planet,Term,Category,Weight,Requires\n');
    setStatus('Private vocabulary cleared from this browser.');
  };

  const copy=async()=>{
    try{await navigator.clipboard.writeText(json);setStatus('Copied JSON.');}
    catch{setStatus('Copy was blocked. Select the JSON below and copy it manually.')}
  };

  const loadFile=e=>{
    const file=e.target.files?.[0];
    if(!file)return;
    const r=new FileReader();
    r.onload=()=>{setCsv(String(r.result||''));setStatus('File loaded. Click Save Private Vocabulary to activate it.');};
    r.readAsText(file);
  };

  return <div className="setup-page keyword-admin">
    <header className="mission-header"><div><h1>Private Keyword Vault</h1><p>Controlled terminology with activation rules</p></div></header>
    <section className="card">
      <div className="section-title">Private vocabulary CSV</div>
      <p className="small-note">Use columns: Planet, Term, Category, Weight, Requires. A term is considered only when its Requires rule matches the current astrological or route context.</p>
      <input className="input" type="file" accept=".csv,text/csv" onChange={loadFile}/>
      <textarea className="input keyword-textarea" value={csv} onChange={e=>setCsv(e.target.value)}/>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <button className="primary" onClick={save}>Save Private Vocabulary</button>
        <button className="secondary" onClick={copy}>Copy JSON</button>
        <button className="secondary" onClick={clear}>Clear</button>
      </div>
      <p className="small-note">{termCount} terms recognized. The vocabulary stays in this browser and is sent to AstroWalk only when a prediction is requested.</p>
      {status&&<div className="success">{status}</div>}
    </section>
    <section className="card">
      <div className="section-title">Activation preview</div>
      <textarea className="input keyword-json" readOnly value={json}/>
      <p className="small-note">Strict rules such as nakshatra=Mula, sign=Virgo, house=5 and aspect=Opposition are matched exactly. Context rules are filtered again inside the prediction engine.</p>
    </section>
  </div>;
}
