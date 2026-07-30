import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { api } from "../lib/api";
import { getAchievementOwnerKey } from "../lib/achievements";
import type { Course } from "../types";
import { Modal } from "../components/Modal";
import { EmptyState, LoadingState } from "../components/PageState";
import { useToast } from "../context/ToastContext";
import { unlockAchievement } from "../lib/achievements";

type AttendanceEntry = {
  date: string;
  createdAt: string;
};

type AttendanceSlot = AttendanceEntry | null;
type AttendanceSlots = [AttendanceSlot, AttendanceSlot, AttendanceSlot];
type AttendanceState = Record<string, AttendanceSlots>;

type SelectedSlot = {
  courseId: string;
  courseName: string;
  slotIndex: number;
} | null;

const STORAGE_PREFIX = "miodesk_attendance_v1";

function emptySlots(): AttendanceSlots {
  return [null, null, null];
}

function normalizeSlots(value: unknown): AttendanceSlots {
  if (!Array.isArray(value)) return emptySlots();

  const normalized = value.slice(0, 3).map((item) => {
    if (
      item &&
      typeof item === "object" &&
      typeof (item as AttendanceEntry).date === "string"
    ) {
      const entry = item as AttendanceEntry;

      return {
        date: entry.date,
        createdAt:
          typeof entry.createdAt === "string"
            ? entry.createdAt
            : new Date().toISOString(),
      };
    }

    return null;
  });

  while (normalized.length < 3) {
    normalized.push(null);
  }

  return normalized as AttendanceSlots;
}

function storageKey(ownerKey: string) {
  return `${STORAGE_PREFIX}:${ownerKey}`;
}

function readAttendance(ownerKey: string): AttendanceState {
  try {
    const raw = window.localStorage.getItem(storageKey(ownerKey));

    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next: AttendanceState = {};

    for (const [courseId, slots] of Object.entries(parsed ?? {})) {
      next[courseId] = normalizeSlots(slots);
    }

    return next;
  } catch {
    return {};
  }
}

function writeAttendance(ownerKey: string, state: AttendanceState) {
  window.localStorage.setItem(
    storageKey(ownerKey),
    JSON.stringify(state),
  );
}

function todayInputValue() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatAttendanceDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return value;

  return new Date(year, month - 1, day).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function courseText(course: Course, key: "code" | "instructor" | "room") {
  const value = (course as Course & Record<string, unknown>)[key];

  return typeof value === "string" ? value.trim() : "";
}

function courseColor(course: Course) {
  const value = (course as Course & { color?: unknown }).color;

  return typeof value === "string" && value.trim()
    ? value
    : "#f28cac";
}

export function AttendancePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ownerKey, setOwnerKey] = useState(() =>
    getAchievementOwnerKey(),
  );
  const [attendance, setAttendance] = useState<AttendanceState>(() =>
    readAttendance(getAchievementOwnerKey()),
  );
  const [selectedSlot, setSelectedSlot] =
    useState<SelectedSlot>(null);
  const [selectedDate, setSelectedDate] = useState(
    todayInputValue(),
  );
  const [attendanceLimitCourseName, setAttendanceLimitCourseName] =
    useState("");
  const attendanceLimitTimerRef = useRef<number | null>(null);
  const ownerKeyRef = useRef(ownerKey);
  const { showToast } = useToast();

  useEffect(() => {
    api<Course[]>("/courses")
      .then(setCourses)
      .catch((loadError: Error) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const syncAccount = () => {
      const nextOwnerKey = getAchievementOwnerKey();

      if (nextOwnerKey !== ownerKeyRef.current) {
        ownerKeyRef.current = nextOwnerKey;
        setOwnerKey(nextOwnerKey);
        setAttendance(readAttendance(nextOwnerKey));
        setSelectedSlot(null);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey(ownerKeyRef.current)) {
        setAttendance(readAttendance(ownerKeyRef.current));
      }
    };

    const intervalId = window.setInterval(syncAccount, 600);

    window.addEventListener("storage", handleStorage);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (attendanceLimitTimerRef.current !== null) {
        window.clearTimeout(attendanceLimitTimerRef.current);
      }
    };
  }, []);

  function showAttendanceLimitAlert(courseName: string) {
    unlockAchievement("attendance_limit_dog");
    if (attendanceLimitTimerRef.current !== null) {
      window.clearTimeout(attendanceLimitTimerRef.current);
    }

    setAttendanceLimitCourseName(courseName);

    attendanceLimitTimerRef.current = window.setTimeout(() => {
      setAttendanceLimitCourseName("");
      attendanceLimitTimerRef.current = null;
    }, 3000);
  }
  const totalUsed = useMemo(
    () =>
      courses.reduce(
        (sum, course) =>
          sum +
          (attendance[course.id] ?? emptySlots()).filter(Boolean)
            .length,
        0,
      ),
    [attendance, courses],
  );

  const fullCourses = useMemo(
    () =>
      courses.filter(
        (course) =>
          (attendance[course.id] ?? emptySlots()).filter(Boolean)
            .length === 3,
      ).length,
    [attendance, courses],
  );

  function openSlot(course: Course, slotIndex: number) {
    const slots = attendance[course.id] ?? emptySlots();
    const current = slots[slotIndex];

    setSelectedSlot({
      courseId: course.id,
      courseName: course.name,
      slotIndex,
    });
    setSelectedDate(current?.date ?? todayInputValue());
    setError("");
  }

  function saveState(next: AttendanceState) {
    setAttendance(next);
    writeAttendance(ownerKey, next);
  }

  function submitAttendance(event: FormEvent) {
    event.preventDefault();

    if (!selectedSlot || !selectedDate) return;

    if (selectedDate > todayInputValue()) {
      setError("Gelecek bir tarih devamsızlık olarak kaydedilemez.");
      return;
    }

    const currentSlots =
      attendance[selectedSlot.courseId] ?? emptySlots();

    const duplicateDate = currentSlots.some(
      (slot, index) =>
        index !== selectedSlot.slotIndex &&
        slot?.date === selectedDate,
    );

    if (duplicateDate) {
      setError("Bu tarih bu ders için zaten kaydedilmiş.");
      return;
    }

    const nextSlots: AttendanceSlots = [...currentSlots] as AttendanceSlots;

    nextSlots[selectedSlot.slotIndex] = {
      date: selectedDate,
      createdAt: new Date().toISOString(),
    };

    const next = {
      ...attendance,
      [selectedSlot.courseId]: nextSlots,
    };

    const reachedAttendanceLimit =
      currentSlots.filter(Boolean).length < 3 &&
      nextSlots.filter(Boolean).length === 3;

    saveState(next);
    setSelectedSlot(null);

    if (reachedAttendanceLimit) {
      showAttendanceLimitAlert(selectedSlot.courseName);
    }

    showToast("Devamsızlık kaydedildi.");
  }

  function removeAttendance() {
    if (!selectedSlot) return;

    const currentSlots =
      attendance[selectedSlot.courseId] ?? emptySlots();
    const nextSlots: AttendanceSlots = [...currentSlots] as AttendanceSlots;

    nextSlots[selectedSlot.slotIndex] = null;

    const next = {
      ...attendance,
      [selectedSlot.courseId]: nextSlots,
    };

    saveState(next);
    setSelectedSlot(null);
    showToast("Devamsızlık kaydı kaldırıldı.", "info");
  }

  const selectedExisting =
    selectedSlot &&
    (attendance[selectedSlot.courseId] ?? emptySlots())[
      selectedSlot.slotIndex
    ];

  if (loading) {
    return <LoadingState label="Devamsızlık bilgileri hazırlanıyor..." />;
  }

  return (
    <div className="standard-page attendance-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Ders kontrolü</span>
          <h1>Devamsızlık Takibi</h1>
          <p>
            Her ders için üç devamsızlık hakkını ve tarihlerini tek
            ekrandan takip et.
          </p>
        </div>
      </div>

      {error && !selectedSlot ? (
        <div className="form-error">{error}</div>
      ) : null}

      <section className="attendance-summary-grid">
        <article className="attendance-summary-card">
          <span>Toplam Ders</span>
          <strong>{courses.length}</strong>
          <small>takip edilen</small>
        </article>

        <article className="attendance-summary-card">
          <span>Kullanılan Hak</span>
          <strong>{totalUsed}</strong>
          <small>devamsızlık</small>
        </article>

        <article
          className={`attendance-summary-card ${
            fullCourses > 0 ? "is-danger" : ""
          }`}
        >
          <span>Hakkı Dolan</span>
          <strong>{fullCourses}</strong>
          <small>ders</small>
        </article>
      </section>

      {courses.length === 0 ? (
        <EmptyState
          title="Henüz ders yok"
          description="Dersler sayfasından bir ders eklediğinde burada otomatik olarak görünecek."
        />
      ) : (
        <section className="attendance-course-list">
          {courses.map((course) => {
            const slots =
              attendance[course.id] ?? emptySlots();
            const usedCount = slots.filter(Boolean).length;
            const details = [
              courseText(course, "code"),
              courseText(course, "instructor"),
              courseText(course, "room"),
            ].filter(Boolean);

            return (
              <article
                className={`attendance-course-card ${
                  usedCount === 3 ? "is-full" : ""
                }`}
                key={course.id}
                style={
                  {
                    "--attendance-course-color": courseColor(course),
                  } as React.CSSProperties
                }
              >
                <div className="attendance-course-accent" />

                <div className="attendance-course-info">
                  <div className="attendance-course-title-row">
                    <div>
                      <h2>{course.name}</h2>
                      <p>
                        {details.length > 0
                          ? details.join(" • ")
                          : "Ders bilgisi"}
                      </p>
                    </div>

                    <span
                      className={`attendance-course-status ${
                        usedCount === 3 ? "is-danger" : ""
                      }`}
                    >
                      {usedCount}/3 kullanıldı
                    </span>
                  </div>

                  <div className="attendance-slots">
                    {slots.map((slot, index) => (
                      <div className="attendance-slot-wrap" key={index}>
                        <button
                          type="button"
                          className={`attendance-slot ${
                            slot ? "is-used" : ""
                          }`}
                          onClick={() => openSlot(course, index)}
                          aria-label={
                            slot
                              ? `${index + 1}. devamsızlık: ${formatAttendanceDate(
                                  slot.date,
                                )}`
                              : `${index + 1}. devamsızlık hakkını kaydet`
                          }
                        >
                          {slot ? <span aria-hidden="true">×</span> : null}
                        </button>

                        <small>
                          {slot
                            ? formatAttendanceDate(slot.date)
                            : `${index + 1}. hak`}
                        </small>
                      </div>
                    ))}
                  </div>

                  <div className="attendance-progress">
                    <div
                      style={{
                        width: `${(usedCount / 3) * 100}%`,
                      }}
                    />
                  </div>

                  <p className="attendance-course-note">
                    {usedCount === 3
                      ? "Devamsızlık hakkı doldu."
                      : `${3 - usedCount} devamsızlık hakkı kaldı.`}
                  </p>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {attendanceLimitCourseName ? (
        <div
          className="attendance-limit-overlay"
          role="alert"
          aria-live="assertive"
        >
          <div className="attendance-limit-alert-card">
            <img
              src="/assets/attendance-limit-dog.png"
              alt=""
              aria-hidden="true"
            />
            <strong>Devamsızlık hakkın kalmadı.</strong>
            <span>{attendanceLimitCourseName}</span>
          </div>
        </div>
      ) : null}
      <Modal
        open={selectedSlot !== null}
        onClose={() => {
          setSelectedSlot(null);
          setError("");
        }}
        title="Devamsızlık tarihini girin."
      >
        <form className="modal-form" onSubmit={submitAttendance}>
          <div className="attendance-modal-course">
            <span>Ders</span>
            <strong>{selectedSlot?.courseName}</strong>
            <small>
              {selectedSlot
                ? `${selectedSlot.slotIndex + 1}. devamsızlık hakkı`
                : ""}
            </small>
          </div>

          <label>
            Devamsızlık tarihi
            <input
              type="date"
              max={todayInputValue()}
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setError("");
              }}
              required
              autoFocus
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            {selectedExisting ? (
              <button
                type="button"
                className="danger-button"
                onClick={removeAttendance}
              >
                Devamsızlığı Sil
              </button>
            ) : null}

            <button
              type="button"
              className="soft-button"
              onClick={() => {
                setSelectedSlot(null);
                setError("");
              }}
            >
              Vazgeç
            </button>

            <button className="primary-button">Kaydet</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
