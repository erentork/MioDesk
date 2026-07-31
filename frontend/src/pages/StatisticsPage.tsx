import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Statistics } from "../types";
import { LoadingState } from "../components/PageState";
import { minutesToText } from "../lib/format";
const statusName:Record<string,string>={NotStarted:"Başlanmadı",InProgress:"Devam Ediyor",Completed:"Tamamlandı",Submitted:"Teslim Edildi"};
export function StatisticsPage(){const[data,setData]=useState<Statistics|null>(null);useEffect(()=>{api<Statistics>("/dashboard/statistics").then(setData)},[]);if(!data)return <LoadingState label="İstatistikler hesaplanıyor..."/>;const courseValues = Object.values(data.tasksByCourse) as number[]; const focusValues = Object.values(data.focusMinutesByDay) as number[]; const maxCourse=Math.max(1,...courseValues);
const maxFocus=Math.max(1,...focusValues);
const statusColors:Record<string,string>={
  Completed:"#f27f9f",
  NotStarted:"#eadfdb",
  InProgress:"#a98bd7",
  Submitted:"#76afd5"
};
const statusOrder=["Completed","InProgress","NotStarted","Submitted"];
const statusEntries=statusOrder
  .filter((name)=>Object.prototype.hasOwnProperty.call(data.tasksByStatus,name))
  .map((name)=>[name,data.tasksByStatus[name]??0] as [string,number]);
const statusLegendOrder=["Completed","NotStarted","InProgress","Submitted"];
const statusLegendEntries=statusLegendOrder
  .filter((name)=>Object.prototype.hasOwnProperty.call(data.tasksByStatus,name))
  .map((name)=>[name,data.tasksByStatus[name]??0] as [string,number]);
const statusTotal=statusEntries.reduce((sum,[,value])=>sum+value,0);
let statusCursor=0;
const statusSegments=statusEntries.map(([name,value])=>{
  const start=statusCursor;
  statusCursor+=statusTotal>0?(value/statusTotal)*360:0;
  return `${statusColors[name]??"#cdb4db"} ${start}deg ${statusCursor}deg`;
});
const statusGradient=statusTotal>0
  ?`conic-gradient(${statusSegments.join(",")})`
  :"conic-gradient(#efe4e2 0deg 360deg)";
return <div className="standard-page statistics-page"><div className="page-heading"><div><span className="eyebrow">İlerleme özeti</span><h1>İstatistikler</h1><p>Çalışma düzenini sayılarla gör ve bir sonraki haftayı daha iyi planla.</p></div></div><div className="analytics-cards"><article><span>Tamamlanma Oranı</span><strong>%{data.completionRate}</strong><div className="progress large"><div style={{width:`${data.completionRate}%`}}/></div></article><article><span>Tamamlanan</span><strong>{data.completedTasks}</strong><small>{data.totalTasks} görev içinden</small></article><article><span>Geciken</span><strong>{data.overdueTasks}</strong><small>öncelik bekliyor</small></article></div><div className="analytics-grid"><section className="panel chart-panel"><div className="panel-heading"><h2>Derslere Göre Görevler</h2></div><div className="bar-chart">{(Object.entries(data.tasksByCourse) as [string, number][]).map(([name,value])=><div className="bar-row" key={name}><span>{name}</span><div><i style={{width:`${value/maxCourse*100}%`}}/></div><strong>{value}</strong></div>)}</div></section><section className="panel chart-panel"><div className="panel-heading"><h2>Görev Durumları</h2></div><div className="donut-wrap"><div
  className="donut"
  style={{background:statusGradient}}
>
  <span>%{data.completionRate}</span>
</div>
<div className="legend">
  {statusLegendEntries.map(([name,value])=>(
    <div key={name} data-status={name}>
      <span style={{background:statusColors[name]??"#cdb4db"}}/>
      <b>{statusName[name]??name}</b>
      <small>{value}</small>
    </div>
  ))}
</div></div></section><section className="panel chart-panel focus-chart"><div className="panel-heading"><h2>Son 7 Gün Odak Süresi</h2></div><div className="column-chart">{(Object.entries(data.focusMinutesByDay) as [string, number][]).map(([date,value])=><div key={date}><span className="column-value">{value?minutesToText(value):"0"}</span><i style={{height:`${Math.max(4,value/maxFocus*140)}px`}}/><small>{new Intl.DateTimeFormat("tr-TR",{weekday:"short"}).format(new Date(date))}</small></div>)}</div></section></div></div>}
