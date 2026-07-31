import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api, ApiError } from "../lib/api";
import { formatDate, toLocalInput } from "../lib/format";
import { AcademicTaskStatus, AcademicTaskType, TaskPriority, type AcademicTask, type Course } from "../types";
import { Icon } from "../components/Icon";
import { Modal } from "../components/Modal";
import { EmptyState, LoadingState } from "../components/PageState";
import { useToast } from "../context/ToastContext";
import { showTaskCompletionCelebration } from "../utils/taskCompletionCelebration";

const statusLabels = ["Başlanmadı", "Devam Ediyor", "Tamamlandı", "Teslim Edildi"];
const typeLabels = ["Ödev", "Proje / Sınav", "Sunum", "Quiz", "Kişisel Görev"];
const priorityLabels = ["Düşük", "Orta", "Yüksek", "Acil"];
const initial = { title:"", description:"", type:0, status:0, priority:1, startDate:"", dueDate:"", progress:0, notes:"", courseId:"" };

export function TasksPage() {
  const [tasks,setTasks]=useState<AcademicTask[]>([]); const [courses,setCourses]=useState<Course[]>([]); const [loading,setLoading]=useState(true);
  const [open,setOpen]=useState(false); const [editing,setEditing]=useState<AcademicTask|null>(null); const [form,setForm]=useState(initial); const [error,setError]=useState("");
  const [statusFilter,setStatusFilter]=useState("all"); const [search,setSearch]=useState(""); const [togglingTaskId,setTogglingTaskId]=useState<string|null>(null); const {showToast}=useToast();
  const load=()=>Promise.all([api<AcademicTask[]>("/tasks"),api<Course[]>("/courses")]).then(([t,c])=>{setTasks(t);setCourses(c)}).finally(()=>setLoading(false));
  useEffect(()=>{load().catch((e:Error)=>setError(e.message))},[]);
  const filtered=useMemo(()=>tasks.filter(t=>(statusFilter==="all"||t.status===Number(statusFilter))&&t.title.toLowerCase().includes(search.toLowerCase())),[tasks,statusFilter,search]);
  function create(){setEditing(null);setForm({...initial,dueDate:toLocalInput(new Date(Date.now()+86400000*7).toISOString())});setError("");setOpen(true)}
  function edit(t:AcademicTask){setEditing(t);setForm({title:t.title,description:t.description,type:t.type,status:t.status,priority:t.priority,startDate:toLocalInput(t.startDate),dueDate:toLocalInput(t.dueDate),progress:t.progress,notes:t.notes,courseId:t.courseId??""});setError("");setOpen(true)}
  async function submit(e:FormEvent){e.preventDefault();setError("");const body={...form,type:Number(form.type),status:Number(form.status),priority:Number(form.priority),progress:Number(form.progress),startDate:form.startDate?new Date(form.startDate).toISOString():null,dueDate:new Date(form.dueDate).toISOString(),courseId:form.courseId||null};try{editing?await api(`/tasks/${editing.id}`,{method:"PUT",body:JSON.stringify(body)}):await api("/tasks",{method:"POST",body:JSON.stringify(body)});setOpen(false);await load();showToast(editing?"Görev güncellendi.":"Görev eklendi.")}catch(err){setError(err instanceof ApiError?err.message:"İşlem tamamlanamadı.")}}
  async function remove(t:AcademicTask){if(!confirm(`“${t.title}” görevini silmek istiyor musun?`))return;try{await api(`/tasks/${t.id}`,{method:"DELETE"});await load();showToast("Görev silindi.","info")}catch(e){showToast(e instanceof Error?e.message:"Silinemedi.","error")}}
  async function toggleComplete(t:AcademicTask){
    const wasCompleted=t.status===AcademicTaskStatus.Completed;
    const body={
      title:t.title,
      description:t.description,
      type:t.type,
      status:wasCompleted?AcademicTaskStatus.NotStarted:AcademicTaskStatus.Completed,
      priority:t.priority,
      startDate:t.startDate,
      dueDate:t.dueDate,
      progress:wasCompleted?0:100,
      notes:t.notes,
      courseId:t.courseId
    };

    setTogglingTaskId(t.id);

    try{
      const updated=await api<AcademicTask>(`/tasks/${t.id}`,{
        method:"PUT",
        body:JSON.stringify(body)
      });

      setTasks(current=>current.map(item=>item.id===updated.id?updated:item));
      if(!wasCompleted){showTaskCompletionCelebration();}
      showToast(wasCompleted?"Görev yeniden açıldı.":"Görev tamamlandı! ✿",wasCompleted?"info":"success");
    }catch(err){
      showToast(err instanceof Error?err.message:"Görev durumu değiştirilemedi.","error");
    }finally{
      setTogglingTaskId(null);
    }
  }
  if(loading)return <LoadingState label="Görevlerin sıralanıyor..."/>;
  return <div className="standard-page"><div className="page-heading"><div><span className="eyebrow">Akademik görevler</span><h1>Görevlerim</h1><p>Ödev, proje, sınav ve kişisel işlerini tek akışta takip et.</p></div><button className="primary-button" onClick={create}><Icon name="plus"/> Yeni Görev</button></div>
    <div className="toolbar"><label className="search-box"><Icon name="search" size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Görev ara..."/></label><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">Tüm durumlar</option>{statusLabels.map((x,i)=><option value={i} key={x}>{x}</option>)}</select></div>
    {filtered.length===0?<EmptyState title="Görev bulunamadı" description="Filtreyi değiştir veya yeni bir görev ekle."/>:<div className="task-list">{filtered.map(t=><article className={`task-card ${t.isOverdue?"overdue":""}`} key={t.id}><span className="task-color" style={{background:t.courseColor??"#f1a8b8"}}/><button
  type="button"
  className={`task-check ${t.status===AcademicTaskStatus.Completed?"done":""}`}
  onClick={()=>toggleComplete(t)}
  aria-label={t.status===AcademicTaskStatus.Completed?"Görevi yeniden aç":"Görevi tamamla"}
  aria-pressed={t.status===AcademicTaskStatus.Completed}
  title={t.status===AcademicTaskStatus.Completed?"Tamamlanmayı geri al":"Görevi tamamla"}
  disabled={togglingTaskId===t.id}
>
  {t.status===AcademicTaskStatus.Completed&&<Icon className="task-check-icon" name="check" size={14} strokeWidth={2.4}/>}
</button><div className="task-main"><div className="task-title-row"><h3>{t.title}</h3><span className={`priority priority-${t.priority}`}>{priorityLabels[t.priority]}</span></div><p>{t.description||"Açıklama eklenmedi."}</p><div className="task-tags"><span>{typeLabels[t.type]}</span>{t.courseName&&<span>{t.courseName}</span>}<span>{statusLabels[t.status]}</span></div><div className="progress"><div style={{width:`${t.progress}%`}}/><small>%{t.progress}</small></div></div><div className="task-side"><time className={t.isOverdue?"danger-text":""}>{t.isOverdue?"Gecikti · ":""}{formatDate(t.dueDate,{day:"2-digit",month:"long"})}</time><div><button className="icon-button" onClick={()=>edit(t)}><Icon name="edit" size={17}/></button><button className="icon-button danger" onClick={()=>remove(t)}><Icon name="trash" size={17}/></button></div></div></article>)}</div>}
    <Modal open={open} onClose={()=>setOpen(false)} title={editing?"Görevi Düzenle":"Yeni Görev"} wide><form className="modal-form" onSubmit={submit}><label>Başlık<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/></label><label>Açıklama<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3}/></label><div className="form-grid three"><label>Tür<select value={form.type} onChange={e=>setForm({...form,type:Number(e.target.value)})}>{typeLabels.map((x,i)=><option value={i} key={x}>{x}</option>)}</select></label><label>Durum<select value={form.status} onChange={e=>setForm({...form,status:Number(e.target.value)})}>{statusLabels.map((x,i)=><option value={i} key={x}>{x}</option>)}</select></label><label>Öncelik<select value={form.priority} onChange={e=>setForm({...form,priority:Number(e.target.value)})}>{priorityLabels.map((x,i)=><option value={i} key={x}>{x}</option>)}</select></label></div><div className="form-grid"><label>Başlangıç<input type="datetime-local" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/></label><label>Teslim<input type="datetime-local" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} required/></label><label>Ders<select value={form.courseId} onChange={e=>setForm({...form,courseId:e.target.value})}><option value="">Kişisel görev</option>{courses.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label><label>İlerleme: %{form.progress}<input type="range" min="0" max="100" step="5" value={form.progress} onChange={e=>setForm({...form,progress:Number(e.target.value)})}/></label></div><label>Ek notlar<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2}/></label>{error&&<div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="soft-button" onClick={()=>setOpen(false)}>Vazgeç</button><button className="primary-button">Kaydet</button></div></form></Modal>
  </div>
}
