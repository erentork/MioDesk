import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { api } from "../lib/api";
import { dayNames, formatDate, formatRelative, minutesToText, workDays } from "../lib/format";
import type { Dashboard, ScheduleEntry } from "../types";
import { useAuth } from "../context/AuthContext";
import { Icon } from "../components/Icon";
import { LoadingState } from "../components/PageState";
import { DashboardInteractiveMascot } from "../components/DashboardInteractiveMascot";

const hours = Array.from({ length: 11 }, (_, i) => 8 + i);

function positionFor(entry: ScheduleEntry) {
  const [sh, sm] = entry.startTime.split(":").map(Number);
  const [eh, em] = entry.endTime.split(":").map(Number);
  const start = (sh - 8) * 58 + sm * (58 / 60);
  const height = Math.max(42, ((eh * 60 + em) - (sh * 60 + sm)) * (58 / 60) - 6);
  return { top: `${start}px`, height: `${height}px` };
}

function MiniCalendar() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7;
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: startOffset + days }, (_, i) => i < startOffset ? null : i - startOffset + 1);
  return <div className="mini-calendar"><div className="mini-calendar-title">{new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(now)}</div><div className="mini-weekdays">{["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"].map(x=><span key={x}>{x}</span>)}</div><div className="mini-days">{cells.map((day,i)=><span key={i} className={day===now.getDate()?"today":""}>{day}</span>)}</div></div>;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { api<Dashboard>("/dashboard").then(setData).catch((e: Error) => setError(e.message)); }, []);
  const grouped = useMemo(() => {
    const map: Record<number, ScheduleEntry[]> = {};
    data?.weeklySchedule.forEach((entry) => (map[entry.dayOfWeek] ??= []).push(entry));
    return map;
  }, [data]);

  if (!data && !error) return <LoadingState label="Masan hazırlanıyor..." />;
  if (error) return <div className="error-card"><h2>Bağlantı kurulamadı</h2><p>{error}</p><p>Backend'i <code>http://localhost:5088</code> adresinde çalıştırdığından emin ol.</p></div>;
  if (!data) return null;

  const statCards = [
    { label: "Toplam Görev", value: data.stats.totalTasks, note: "tümü", icon: "tasks", tone: "pink" },
    { label: "Bu Hafta", value: data.stats.dueThisWeek, note: "görev kaldı", icon: "calendar", tone: "coral" },
    { label: "Tamamlananlar", value: data.stats.completedTasks, note: "tamamlandı", icon: "check", tone: "green" },
    { label: "Odak Süresi", value: minutesToText(data.stats.focusMinutesThisWeek), note: "bu hafta", icon: "focus", tone: "purple" },
  ];

  return (
    <div className="dashboard-page">
      <div className="welcome-row"><div><h1>Hoş geldin, {user?.fullName.split(" ")[0]}! <span>✿</span></h1><p>Küçük adımlar büyük başarılar getirir. Bugünün planı hazır.</p></div><DashboardInteractiveMascot /></div>
      <div className="stats-grid">{statCards.map((card)=><article className="stat-card" key={card.label}><div className={`stat-icon tone-${card.tone}`}><Icon name={card.icon}/></div><div><span>{card.label}</span><strong>{card.value}</strong><small>{card.note}</small></div></article>)}</div>

      <div className="dashboard-grid">
        <section className="panel schedule-panel">
          <div className="panel-heading"><div><span className="panel-flower">✿</span><h2>Haftalık Ders Programı</h2></div><button className="soft-button">Bugün</button></div>
          <div className="schedule-board">
            <div className="time-column"><div className="schedule-head-space"/>{hours.map(h=><div key={h} className="time-label">{String(h).padStart(2,"0")}:00</div>)}</div>
            {workDays.map((day)=><div className="day-column" key={day}><div className="day-heading">{dayNames[day]}</div><div className="day-body">{hours.map(h=><div key={h} className="hour-line"/>)}{(grouped[day]??[]).map(entry=><div className="schedule-event" key={entry.id} style={{...positionFor(entry), background: `${entry.courseColor}b8`, borderColor: entry.courseColor}}><strong>{entry.courseName}</strong><span>{entry.room}</span></div>)}</div></div>)}
          </div>
        </section>

        <aside className="dashboard-side">
          <section
            className={`panel upcoming-panel ${
              data.upcomingTasks.length === 0 ? "is-empty" : ""
            }`}
          ><div className="panel-heading"><div><Icon name="tasks"/><h2>Yaklaşan Teslimler</h2></div><a href="/tasks">Tümünü Gör</a></div><div className="upcoming-list">{data.upcomingTasks.map(task=><a href="/tasks" className="upcoming-item" key={task.id} style={{"--course-color":task.courseColor??"#f59aae"} as CSSProperties}><span className="upcoming-dot"/><div><strong>{task.title}</strong><small>{task.description}</small></div><time>{formatDate(task.dueDate,{day:"2-digit",month:"short"})}</time></a>)}</div></section>
          <div className="side-two"><section className="panel"><MiniCalendar/></section><section className="panel today-panel"><div className="panel-heading"><h2>Bugünkü Dersler</h2></div>{data.todaySchedule.length===0?<p className="muted">Bugün ders görünmüyor.</p>:data.todaySchedule.map(entry=><div className="today-item" key={entry.id}><time>{entry.startTime}</time><span style={{background:entry.courseColor}}/><div><strong>{entry.courseName}</strong><small>{entry.room}</small></div></div>)}</section></div>
          <section className="panel notifications-panel"><div className="panel-heading"><div><Icon name="bell"/><h2>Bildirimler</h2></div></div>{data.notifications.map(n=><div className="notification-row" key={n.id}><span className={`notification-kind kind-${n.kind}`}>✿</span><div><strong>{n.title}</strong><small>{n.message}</small></div><time>{formatRelative(n.createdAt)}</time></div>)}</section>
        </aside>
      </div>

            <section className="panel notebook-panel">
        <div className="notebook-rings">
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} />
          ))}
        </div>

        <div className="panel-heading">
          <div>
            <Icon name="notes" />
            <h2>Önemli Notlar</h2>
          </div>

          <a
            className="primary-button small-button notebook-new-note-button"
            href="/notes"
          >
            <span className="important-notes-button-mark" aria-hidden="true">
              !
            </span>
            Notları Seç
          </a>
        </div>

        <div className="notebook-lines">
          {data.notes.filter((note) => note.isImportant).slice(0, 3)
            .length === 0 ? (
            <a className="important-notes-empty" href="/notes">
              Notlar sayfasındaki ünlem işaretinden en fazla 3 not seçebilirsin.
            </a>
          ) : (
            data.notes
              .filter((note) => note.isImportant)
              .slice(0, 3)
              .map((note) => (
                <div className="notebook-note" key={note.id}>
                  <strong>{note.title}</strong>
                  <span title={note.content}>{note.content}</span>
                </div>
              ))
          )}
        </div>
      </section>
    </div>
  );
}
