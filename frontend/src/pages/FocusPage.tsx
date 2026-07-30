import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";
import type { FocusSession } from "../types";
import { Icon } from "../components/Icon";
import { useToast } from "../context/ToastContext";

const presets=[25,45,60];
export function FocusPage(){
 const[minutes,setMinutes]=useState(25);const[secondsLeft,setSecondsLeft]=useState(25*60);const[running,setRunning]=useState(false);const[sessions,setSessions]=useState<FocusSession[]>([]);const startedAt=useRef<Date|null>(null);const{showToast}=useToast();
 useEffect(()=>{api<FocusSession[]>("/focus").then(setSessions).catch(()=>undefined)},[]);
 useEffect(()=>{if(!running)return;const id=window.setInterval(()=>setSecondsLeft(s=>{if(s<=1){window.clearInterval(id);setRunning(false);finish();return 0}return s-1}),1000);return()=>window.clearInterval(id)},[running]);
 function choose(value:number){if(running)return;setMinutes(value);setSecondsLeft(value*60)}
 function start(){if(secondsLeft===0)setSecondsLeft(minutes*60);startedAt.current=new Date();setRunning(true)}
 function pause(){setRunning(false)}
 function reset(){setRunning(false);setSecondsLeft(minutes*60);startedAt.current=null}
 async function finish(){const start=startedAt.current??new Date(Date.now()-minutes*60000);const end=new Date();try{const result=await api<FocusSession>("/focus",{method:"POST",body:JSON.stringify({startedAt:start.toISOString(),endedAt:end.toISOString()})});setSessions(s=>[result,...s]);showToast("Odak oturumu kaydedildi! ✿")}catch{showToast("Oturum kaydedilemedi.","error")}startedAt.current=null}
 const m=Math.floor(secondsLeft/60).toString().padStart(2,"0"),s=(secondsLeft%60).toString().padStart(2,"0");const progress=1-secondsLeft/(minutes*60);
 return <div className="standard-page"><div className="page-heading"><div><span className="eyebrow">Pomodoro ve derin çalışma</span><h1>Odak Alanı</h1><p>Telefonu sessize al, tek bir hedef seç ve Mio ile birlikte başla.</p></div></div><div className="focus-layout"><section className="panel focus-card"><div className="focus-ring" style={{background:`conic-gradient(#f58da8 ${progress*360}deg,#f6e5e5 0deg)`}}><div><span>{m}:{s}</span><small>{running?"odaklanıyorsun":"hazır"}</small></div></div><div className="preset-row">{presets.map(p=><button className={minutes===p?"active":""} onClick={()=>choose(p)} key={p}>{p} dk</button>)}</div><div className="focus-actions">{!running?<button className="primary-button" onClick={start}><Icon name="focus"/> Başlat</button>:<button className="soft-button" onClick={pause}>Duraklat</button>}<button className="soft-button" onClick={reset}>Sıfırla</button></div><div className="focus-tip">✿ Bu oturumda yalnızca tek bir göreve odaklan.</div></section><section className="panel session-history"><div className="panel-heading"><h2>Son Oturumlar</h2></div>{sessions.length===0?<p className="muted">Henüz kayıtlı odak oturumu yok.</p>:sessions.map(item=><div className="session-row" key={item.id}><span><Icon name="focus"/></span><div><strong>{item.durationMinutes} dakika</strong><small>{formatDate(item.startedAt,{day:"2-digit",month:"long",hour:"2-digit",minute:"2-digit"})}</small></div></div>)}</section></div></div>
}
