import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../lib/api";
import type { Course, Note } from "../types";
import { Icon } from "../components/Icon";
import { Modal } from "../components/Modal";
import { EmptyState, LoadingState } from "../components/PageState";
import { useToast } from "../context/ToastContext";
import { NotesBoardTruck } from "../components/NotesBoardTruck";

const colors=["#FFF1A8","#FFD1DC","#CDEAF6","#D9F2E6","#E7D7F5","#FFE0C2"];
const initial={title:"",content:"",color:colors[0],isPinned:false,isImportant:false,sortOrder:0,courseId:""};

export function NotesPage(){
  const[notes,setNotes]=useState<Note[]>([]);const[courses,setCourses]=useState<Course[]>([]);const[loading,setLoading]=useState(true);const[open,setOpen]=useState(false);const[editing,setEditing]=useState<Note|null>(null);const[form,setForm]=useState(initial);const[error,setError]=useState("");const{showToast}=useToast();
  const load=()=>Promise.all([api<Note[]>("/notes"),api<Course[]>("/courses")]).then(([n,c])=>{setNotes(n);setCourses(c)}).finally(()=>setLoading(false));
  useEffect(()=>{load().catch((e:Error)=>setError(e.message))},[]);
  function create(){setEditing(null);setForm(initial);setError("");setOpen(true)}
  function edit(n:Note){setEditing(n);setForm({title:n.title,content:n.content,color:n.color,isPinned:n.isPinned,isImportant:n.isImportant,sortOrder:n.sortOrder,courseId:n.courseId??""});setError("");setOpen(true)}
  async function submit(e:FormEvent){e.preventDefault();const body={...form,courseId:form.courseId||null};try{editing?await api(`/notes/${editing.id}`,{method:"PUT",body:JSON.stringify(body)}):await api("/notes",{method:"POST",body:JSON.stringify(body)});setOpen(false);await load();showToast(editing?"Not güncellendi.":"Not eklendi.")}catch(err){setError(err instanceof ApiError?err.message:"İşlem tamamlanamadı.")}}
  async function remove(n: Note) {
    if (!confirm(`“${n.title}” notunu silmek istiyor musun?`)) {
      return;
    }

    /*
     * Silinen not önemli olmasa bile backend sıralama/yenileme sırasında
     * diğer önemli işaretlerini değiştirmesin diye mevcut seçim korunur.
     */
    const importantSnapshotBeforeDelete = notes.filter(
      (item) => item.id !== n.id && item.isImportant,
    );

    try {
      await api(`/notes/${n.id}`, {
        method: "DELETE",
      });

      let refreshedNotes = await api<Note[]>("/notes");

      const importantIdsBeforeDelete = new Set(
        importantSnapshotBeforeDelete.map((item) => item.id),
      );

      const unexpectedlyClearedNotes = refreshedNotes.filter(
        (item) =>
          importantIdsBeforeDelete.has(item.id) &&
          !item.isImportant,
      );

      if (unexpectedlyClearedNotes.length > 0) {
        await Promise.all(
          unexpectedlyClearedNotes.map((item) =>
            api(`/notes/${item.id}`, {
              method: "PUT",
              body: JSON.stringify({
                title: item.title,
                content: item.content,
                color: item.color,
                isPinned: item.isPinned,
                isImportant: true,
                sortOrder: item.sortOrder,
                courseId: item.courseId ?? null,
              }),
            }),
          ),
        );

        refreshedNotes = await api<Note[]>("/notes");
      }

      setNotes(refreshedNotes);
      showToast("Not silindi.", "info");
    } catch (removeError) {
      showToast(
        removeError instanceof Error
          ? removeError.message
          : "Not silinemedi.",
        "error",
      );
    }
  }
  async function toggleImportant(note: Note) {
    const selectedCount = notes.filter((item) => item.isImportant).length;

    if (!note.isImportant && selectedCount >= 3) {
      showToast("3'ten fazla not seçilemez!", "error");
      return;
    }

    const nextImportant = !note.isImportant;
    const body = {
      title: note.title,
      content: note.content,
      color: note.color,
      isPinned: note.isPinned,
      isImportant: nextImportant,
      sortOrder: note.sortOrder,
      courseId: note.courseId ?? null,
    };

    try {
      await api(`/notes/${note.id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });

      setNotes((current) =>
        current.map((item) =>
          item.id === note.id
            ? { ...item, isImportant: nextImportant }
            : item,
        ),
      );

      showToast(
        nextImportant
          ? "Not önemli notlara eklendi."
          : "Not önemli notlardan çıkarıldı.",
        nextImportant ? "success" : "info",
      );
    } catch (toggleError) {
      showToast(
        toggleError instanceof ApiError
          ? toggleError.message
          : "Not seçimi güncellenemedi.",
        "error",
      );
    }
  }
  if(loading)return <LoadingState label="Not defterin açılıyor..."/>;
  return <div className="standard-page">
    <NotesBoardTruck /><div className="page-heading"><div><span className="eyebrow">Post-it panosu</span><h1>Not Defterim</h1><p>Derslerden kalan önemli detayları renkli kartlarla masanda tut.</p></div><button className="primary-button" onClick={create}><Icon name="plus"/> Yeni Not</button></div>
    {error&&<div className="form-error">{error}</div>}{notes.length===0?<EmptyState title="Defterin boş" description="İlk post-it notunu ekleyerek önemli detayları yakala."/>:<div className="notes-board">{notes.map((n,i)=><article key={n.id} className={`postit-card tilt-${i%5}${n.isImportant ? " is-important" : ""}`} style={{background:n.color}}><span className="tape"/>{n.isPinned&&<span className="pin-mark">📌</span>}<div className="postit-head"><span>{n.courseName??"Kişisel"}</span><div>
  <button
    type="button"
    className={`icon-button note-important-button${n.isImportant ? " active" : ""}`}
    onClick={() => toggleImportant(n)}
    aria-pressed={n.isImportant}
    aria-label={
      n.isImportant
        ? "Önemli notlardan çıkar"
        : "Önemli notlara ekle"
    }
    title={
      n.isImportant
        ? "Önemli notlardan çıkar"
        : "Önemli notlara ekle"
    }
  >
    <span aria-hidden="true">!</span>
  </button>
  <button className="icon-button" onClick={() => edit(n)}>
    <Icon name="edit" size={16} />
  </button>
  <button
    className="icon-button danger"
    onClick={() => remove(n)}
  >
    <Icon name="trash" size={16} />
  </button>
</div></div><h2>{n.title}</h2><p>{n.content}</p></article>)}</div>}
    <Modal open={open} onClose={()=>setOpen(false)} title={editing?"Notu Düzenle":"Yeni Post-it"}><form className="modal-form" onSubmit={submit}><label>Başlık<input value={form.title} onChange={e=>setForm({...form,title:e.target.value.slice(0,60)})} maxLength={60} required/><small className="note-title-character-counter">{form.title.length}/60</small></label><label>Not<textarea rows={5} value={form.content} onChange={e=>setForm({...form,content:e.target.value.slice(0,240)})} maxLength={240} required/><small className="note-content-character-counter">{form.content.length}/240</small></label><label>Ders<select value={form.courseId} onChange={e=>setForm({...form,courseId:e.target.value})}><option value="">Kişisel not</option>{courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Renk<div className="color-picker">{colors.map(c=><button key={c} type="button" className={form.color===c?"selected":""} style={{background:c}} onClick={()=>setForm({...form,color:c})}/>)}</div></label><div className="checkbox-row"><label><input type="checkbox" checked={form.isPinned} onChange={e=>setForm({...form,isPinned:e.target.checked})}/> Sabitle</label></div>{error&&<div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="soft-button" onClick={()=>setOpen(false)}>Vazgeç</button><button className="primary-button">Kaydet</button></div></form></Modal>
  </div>
}
