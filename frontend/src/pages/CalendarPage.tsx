import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api, ApiError } from "../lib/api";
import { dayNames, workDays } from "../lib/format";
import type { Course, ScheduleEntry } from "../types";
import { Icon } from "../components/Icon";
import { Modal } from "../components/Modal";
import { EmptyState, LoadingState } from "../components/PageState";
import { useToast } from "../context/ToastContext";

const DAY_START_MINUTES = 8 * 60;
const DAY_END_MINUTES = 18 * 60;
const SLOT_HEIGHT = 64;

const hourLabels = Array.from({ length: 11 }, (_, index) => 8 + index);
const hourRows = Array.from({ length: 11 }, (_, index) => 8 + index);

const initial = {
  courseId: "",
  dayOfWeek: 1,
  startTime: "09:00",
  endTime: "10:00",
  customRoom: "",
};

function timeToMinutes(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);

  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return hour * 60 + minute;
}

function minutesToTime(value: number) {
  const safeValue = Math.max(
    DAY_START_MINUTES,
    Math.min(DAY_END_MINUTES, value),
  );

  const hour = Math.floor(safeValue / 60);
  const minute = safeValue % 60;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function isValidScheduleRange(startTime: string, endTime: string) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  return (
    start !== null &&
    end !== null &&
    start >= DAY_START_MINUTES &&
    end <= DAY_END_MINUTES &&
    end > start
  );
}

function sanitizeEntryForForm(entry: ScheduleEntry) {
  if (isValidScheduleRange(entry.startTime, entry.endTime)) {
    return {
      courseId: entry.courseId,
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      customRoom: entry.room,
    };
  }

  return {
    courseId: entry.courseId,
    dayOfWeek: entry.dayOfWeek,
    startTime: "09:00",
    endTime: "10:00",
    customRoom: entry.room,
  };
}

function positionFor(entry: ScheduleEntry) {
  const start = timeToMinutes(entry.startTime);
  const end = timeToMinutes(entry.endTime);

  if (
    start === null ||
    end === null ||
    start < DAY_START_MINUTES ||
    end > DAY_END_MINUTES ||
    end <= start
  ) {
    return { display: "none" as const };
  }

  const top =
    ((start - DAY_START_MINUTES) / 60) * SLOT_HEIGHT;

  const height = Math.max(
    48,
    ((end - start) / 60) * SLOT_HEIGHT - 6,
  );

  return {
    top: `${top}px`,
    height: `${height}px`,
  };
}

export function CalendarPage() {
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleEntry | null>(null);
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  const load = () =>
    Promise.all([
      api<ScheduleEntry[]>("/schedule"),
      api<Course[]>("/courses"),
    ])
      .then(([scheduleEntries, courseList]) => {
        setEntries(scheduleEntries);
        setCourses(courseList);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    load().catch((loadError: Error) => setError(loadError.message));
  }, []);

  const validEntries = useMemo(
    () =>
      entries.filter((entry) =>
        isValidScheduleRange(entry.startTime, entry.endTime),
      ),
    [entries],
  );

  const invalidEntryCount = entries.length - validEntries.length;

  const grouped = useMemo(() => {
    const map: Record<number, ScheduleEntry[]> = {};

    validEntries.forEach((entry) => {
      (map[entry.dayOfWeek] ??= []).push(entry);
    });

    return map;
  }, [validEntries]);

  function create() {
    setEditing(null);
    setForm({
      ...initial,
      courseId: courses[0]?.id ?? "",
    });
    setError("");
    setOpen(true);
  }

  function edit(entry: ScheduleEntry) {
    setEditing(entry);
    setForm(sanitizeEntryForForm(entry));
    setError("");
    setOpen(true);
  }

  function updateStartTime(value: string) {
    const start = timeToMinutes(value);
    const currentEnd = timeToMinutes(form.endTime);

    let nextEndTime = form.endTime;

    if (
      start !== null &&
      (currentEnd === null || currentEnd <= start)
    ) {
      nextEndTime = minutesToTime(
        Math.min(start + 60, DAY_END_MINUTES),
      );
    }

    setForm({
      ...form,
      startTime: value,
      endTime: nextEndTime,
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const start = timeToMinutes(form.startTime);
    const end = timeToMinutes(form.endTime);

    if (start === null || end === null) {
      setError("Geçerli bir başlangıç ve bitiş saati seçmelisin.");
      return;
    }

    if (
      start < DAY_START_MINUTES ||
      end > DAY_END_MINUTES
    ) {
      setError(
        "Ders programına yalnızca 08:00 ile 18:00 arasında kayıt eklenebilir.",
      );
      return;
    }

    if (end <= start) {
      setError("Bitiş saati başlangıç saatinden sonra olmalıdır.");
      return;
    }

    try {
      if (editing) {
        await api(`/schedule/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
      } else {
        await api("/schedule", {
          method: "POST",
          body: JSON.stringify(form),
        });
      }

      setOpen(false);
      await load();

      showToast(
        editing
          ? "Program güncellendi."
          : "Programa ders eklendi.",
      );
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "İşlem tamamlanamadı.",
      );
    }
  }

  async function remove(entry: ScheduleEntry) {
    if (!confirm(`${entry.courseName} programdan silinsin mi?`)) {
      return;
    }

    await api(`/schedule/${entry.id}`, {
      method: "DELETE",
    });

    await load();
    showToast("Program kaydı silindi.", "info");
  }

  if (loading) {
    return <LoadingState label="Takvim hazırlanıyor..." />;
  }

  return (
    <div className="standard-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Haftalık görünüm</span>
          <h1>Takvim</h1>
          <p>Ders saatlerini haftanın tamamında tek bakışta gör.</p>
        </div>

        <button
          className="primary-button"
          onClick={create}
          disabled={courses.length === 0}
        >
          <Icon name="plus" /> Programa Ekle
        </button>
      </div>

      {courses.length === 0 && (
        <div className="info-card">
          Program oluşturmadan önce en az bir ders eklemelisin.
        </div>
      )}

      {invalidEntryCount > 0 && (
        <div className="info-card">
          08:00–18:00 aralığı dışında kalan {invalidEntryCount} eski
          program kaydı güvenlik için takvimde gösterilmiyor.
        </div>
      )}

      {validEntries.length === 0 ? (
        <EmptyState
          title="Programın boş"
          description="Derslerini haftanın günlerine yerleştirmeye başla."
        />
      ) : (
        <section className="calendar-full panel">
          <div className="calendar-time">
            <div />

            {hourLabels.map((hour) => (
              <span key={hour}>
                {String(hour).padStart(2, "0")}:00
              </span>
            ))}
          </div>

          {workDays.map((day) => (
            <div className="calendar-day" key={day}>
              <header>{dayNames[day]}</header>

              <div className="calendar-day-body">
                {hourRows.map((hour) => (
                  <div key={hour} className="calendar-line" />
                ))}

                {(grouped[day] ?? []).map((entry) => (
                  <button
                    onClick={() => edit(entry)}
                    key={entry.id}
                    className="calendar-event"
                    style={{
                      ...positionFor(entry),
                      background: `${entry.courseColor}cf`,
                      borderColor: entry.courseColor,
                    }}
                  >
                    <strong>{entry.courseName}</strong>
                    <span>
                      {entry.startTime}–{entry.endTime}
                    </span>
                    <small>{entry.room}</small>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={
          editing
            ? "Program Kaydını Düzenle"
            : "Programa Ders Ekle"
        }
      >
        <form className="modal-form" onSubmit={submit}>
          <label>
            Ders
            <select
              value={form.courseId}
              onChange={(event) =>
                setForm({
                  ...form,
                  courseId: event.target.value,
                })
              }
              required
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Gün
            <select
              value={form.dayOfWeek}
              onChange={(event) =>
                setForm({
                  ...form,
                  dayOfWeek: Number(event.target.value),
                })
              }
            >
              {workDays.map((day) => (
                <option key={day} value={day}>
                  {dayNames[day]}
                </option>
              ))}
            </select>
          </label>

          <div className="form-grid">
            <label>
              Başlangıç
              <input
                type="time"
                min="08:00"
                max="17:45"
                step="900"
                value={form.startTime}
                onChange={(event) =>
                  updateStartTime(event.target.value)
                }
                required
              />
            </label>

            <label>
              Bitiş
              <input
                type="time"
                min="08:15"
                max="18:00"
                step="900"
                value={form.endTime}
                onChange={(event) =>
                  setForm({
                    ...form,
                    endTime: event.target.value,
                  })
                }
                required
              />
            </label>
          </div>

          <small className="muted">
            Ders saatleri 08:00–18:00 aralığında olmalıdır.
          </small>

          <label>
            Özel sınıf (isteğe bağlı)
            <input
              value={form.customRoom}
              onChange={(event) =>
                setForm({
                  ...form,
                  customRoom: event.target.value,
                })
              }
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            {editing && (
              <button
                type="button"
                className="danger-button"
                onClick={async () => {
                  await remove(editing);
                  setOpen(false);
                }}
              >
                Kaydı Sil
              </button>
            )}

            <button
              type="button"
              className="soft-button"
              onClick={() => setOpen(false)}
            >
              Vazgeç
            </button>

            <button className="primary-button">
              Kaydet
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
