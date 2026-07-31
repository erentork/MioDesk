import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { api, ApiError } from "../lib/api";
import type { Course } from "../types";
import { Icon } from "../components/Icon";
import { Modal } from "../components/Modal";
import { EmptyState, LoadingState } from "../components/PageState";
import { useToast } from "../context/ToastContext";

const emptyForm = { name: "", code: "", instructor: "", room: "", color: "#F7A8BA" };
const colors = ["#F7A8BA", "#BDEBD6", "#FFD2A4", "#DCC8F2", "#BFDDF5", "#FFE69A", "#C9D7B8"];

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  const load = () => api<Course[]>("/courses").then(setCourses).finally(() => setLoading(false));
  useEffect(() => { load().catch((e: Error) => setError(e.message)); }, []);

  function startCreate() { setEditing(null); setForm(emptyForm); setError(""); setOpen(true); }
  function startEdit(course: Course) { setEditing(course); setForm({ name: course.name, code: course.code, instructor: course.instructor, room: course.room, color: course.color }); setError(""); setOpen(true); }

  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    try {
      if (editing) await api(`/courses/${editing.id}`, { method: "PUT", body: JSON.stringify(form) });
      else await api("/courses", { method: "POST", body: JSON.stringify(form) });
      setOpen(false); await load(); showToast(editing ? "Ders güncellendi." : "Ders eklendi.");
    } catch (err) { setError(err instanceof ApiError ? err.message : "İşlem tamamlanamadı."); }
  }

  async function remove(course: Course) {
    if (!confirm(`${course.name} dersini silmek istediğine emin misin?`)) return;
    try { await api(`/courses/${course.id}`, { method: "DELETE" }); await load(); showToast("Ders silindi.", "info"); }
    catch (err) { showToast(err instanceof Error ? err.message : "Ders silinemedi.", "error"); }
  }

  if (loading) return <LoadingState label="Derslerin hazırlanıyor..."/>;

  return <div className="standard-page">
    <div className="page-heading"><div><span className="eyebrow">Ders yönetimi</span><h1>Derslerim</h1><p>Dönem boyunca takip ettiğin dersleri, renklerini ve sınıf bilgilerini yönet.</p></div><button className="primary-button" onClick={startCreate}><Icon name="plus"/> Yeni Ders</button></div>
    {error && <div className="form-error">{error}</div>}
    {courses.length === 0 ? <EmptyState title="Henüz ders yok" description="İlk dersini ekleyerek haftalık programını oluşturmaya başla."/> :
      <div className="course-grid">{courses.map(course => <article className="course-card" key={course.id} style={{"--course-color":course.color} as CSSProperties}>
        <div className="course-color-bar"/><div className="course-card-header"><span className="course-code">{course.code?.trim() ? course.code : (<span className="course-code-sakura" title="Ders kodu girilmedi" aria-label="Ders kodu girilmedi">✿</span>)}</span><div><button className="icon-button" onClick={()=>startEdit(course)}><Icon name="edit" size={17}/></button><button className="icon-button danger" onClick={()=>remove(course)}><Icon name="trash" size={17}/></button></div></div>
        <h2>{course.name}</h2><p>{course.instructor || "Öğretim görevlisi belirtilmedi"}</p><div className="course-meta"><span>📍 {course.room || "Sınıf yok"}</span><span>✿ Aktif ders</span></div>
      </article>)}</div>}

    <Modal open={open} onClose={()=>setOpen(false)} title={editing ? "Dersi Düzenle" : "Yeni Ders Ekle"}>
      <form className="modal-form" onSubmit={submit}>
        <div className="form-grid"><label>Ders adı<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label><label>Ders kodu<input value={form.code} onChange={e=>setForm({...form,code:e.target.value})}/></label><label>Öğretim görevlisi<input value={form.instructor} onChange={e=>setForm({...form,instructor:e.target.value})}/></label><label>Sınıf<input value={form.room} onChange={e=>setForm({...form,room:e.target.value})}/></label></div>
        <label>Ders rengi<div className="color-picker">{colors.map(color=><button type="button" key={color} className={form.color===color?"selected":""} style={{background:color}} onClick={()=>setForm({...form,color})} aria-label={color}/>)}</div></label>
        {error && <div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="soft-button" onClick={()=>setOpen(false)}>Vazgeç</button><button className="primary-button">Kaydet</button></div>
      </form>
    </Modal>
  </div>;
}
