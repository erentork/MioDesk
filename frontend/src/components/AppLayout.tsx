import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { formatRelative } from "../lib/format";
import type { AcademicTask, Course, Note, Notification } from "../types";
import { Icon } from "./Icon";
import { SakuraBackground } from "./SakuraBackground";
import { SidebarMoodCard } from "./SidebarMoodCard";
import { ProfileAvatar } from "./ProfileAvatar";
import { AchievementWatcher } from "./AchievementWatcher";
import { AchievementToast } from "./AchievementToast";
const navItems = [
  { to: "/", label: "Ana Sayfa", icon: "home" },
  { to: "/calendar", label: "Takvim", icon: "calendar" },
  { to: "/tasks", label: "Görevler", icon: "tasks" },
  { to: "/courses", label: "Dersler", icon: "courses" },
  { to: "/attendance", label: "Devamsızlık", icon: "calendar" },
  { to: "/notes", label: "Notlar", icon: "notes" },
  { to: "/focus", label: "Odak", icon: "focus" },
  { to: "/statistics", label: "İstatistikler", icon: "chart" },
  { to: "/settings", label: "Ayarlar", icon: "settings" },
];

const titles: Record<string, string> = {
  "/": "Ana Sayfa",
  "/calendar": "Takvim",
  "/tasks": "Görevler",
  "/courses": "Dersler",
  "/attendance": "Devamsızlık Takibi",
  "/notes": "Notlar",
  "/focus": "Odak Alanı",
  "/statistics": "İstatistikler",
  "/settings": "Ayarlar",
};

type SearchData = {
  courses: Course[];
  tasks: AcademicTask[];
  notes: Note[];
};

type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  category: "Ders" | "Görev" | "Not";
  icon: "courses" | "tasks" | "notes";
  path: string;
};

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchData, setSearchData] = useState<SearchData | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationError, setNotificationError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  async function loadNotifications() {
    setNotificationsLoading(true);
    setNotificationError("");

    try {
      setNotifications(await api<Notification[]>("/notifications"));
    } catch (error) {
      setNotificationError(error instanceof Error ? error.message : "Bildirimler alınamadı.");
    } finally {
      setNotificationsLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  useEffect(() => {
    function closeDropdowns(event: MouseEvent) {
      const target = event.target as Node;

      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchOpen(false);
      }

      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setNotificationOpen(false);
      }
    }

    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setNotificationOpen(false);
      }
    }

    document.addEventListener("mousedown", closeDropdowns);
    document.addEventListener("keydown", closeWithEscape);

    return () => {
      document.removeEventListener("mousedown", closeDropdowns);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, []);

  useEffect(() => {
    setSearchOpen(false);
    setNotificationOpen(false);
  }, [location.pathname]);

  async function ensureSearchData() {
    if (searchData || searchLoading) return;

    setSearchLoading(true);
    setSearchError("");

    try {
      const [courses, tasks, notes] = await Promise.all([
        api<Course[]>("/courses"),
        api<AcademicTask[]>("/tasks"),
        api<Note[]>("/notes"),
      ]);

      setSearchData({ courses, tasks, notes });
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Arama verileri alınamadı.");
    } finally {
      setSearchLoading(false);
    }
  }

  const normalizedQuery = normalizeText(searchTerm);

  const searchResults = useMemo<SearchResult[]>(() => {
    if (!searchData || normalizedQuery.length < 2) return [];

    const matches = (values: Array<string | null | undefined>) =>
      normalizeText(values.filter(Boolean).join(" ")).includes(normalizedQuery);

    const courseResults: SearchResult[] = searchData.courses
      .filter((course) => matches([course.name, course.code, course.instructor, course.room]))
      .map((course) => ({
        id: course.id,
        title: course.name,
        subtitle: [course.code, course.instructor].filter(Boolean).join(" • ") || "Ders",
        category: "Ders",
        icon: "courses",
        path: "/courses",
      }));

    const taskResults: SearchResult[] = searchData.tasks
      .filter((task) => matches([task.title, task.description, task.notes, task.courseName]))
      .map((task) => ({
        id: task.id,
        title: task.title,
        subtitle: task.courseName || task.description || "Akademik görev",
        category: "Görev",
        icon: "tasks",
        path: "/tasks",
      }));

    const noteResults: SearchResult[] = searchData.notes
      .filter((note) => matches([note.title, note.content, note.courseName]))
      .map((note) => ({
        id: note.id,
        title: note.title,
        subtitle: note.courseName || note.content || "Not",
        category: "Not",
        icon: "notes",
        path: "/notes",
      }));

    return [...courseResults, ...taskResults, ...noteResults].slice(0, 8);
  }, [normalizedQuery, searchData]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  function goToSearchResult(result: SearchResult) {
    setSearchOpen(false);
    setSearchTerm("");
    navigate(result.path);
  }

  async function openNotification(notification: Notification) {
    try {
      if (!notification.isRead) {
        await api<void>(`/notifications/${notification.id}/read`, { method: "PATCH" });
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, isRead: true } : item,
          ),
        );
      }

      setNotificationOpen(false);

      if (notification.actionUrl) {
        navigate(notification.actionUrl);
      }
    } catch (error) {
      setNotificationError(error instanceof Error ? error.message : "Bildirim güncellenemedi.");
    }
  }

  async function markAllAsRead() {
    const unreadNotifications = notifications.filter((notification) => !notification.isRead);
    if (unreadNotifications.length === 0 || markingAll) return;

    setMarkingAll(true);
    setNotificationError("");

    try {
      await Promise.all(
        unreadNotifications.map((notification) =>
          api<void>(`/notifications/${notification.id}/read`, { method: "PATCH" }),
        ),
      );

      setNotifications((current) =>
        current.map((notification) => ({ ...notification, isRead: true })),
      );
    } catch (error) {
      setNotificationError(error instanceof Error ? error.message : "Bildirimler güncellenemedi.");
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="app-shell">
      <AchievementWatcher />
<AchievementToast />
      <SakuraBackground />
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand"><span className="brand-flower">✿</span><span>MioDesk</span></div>
        <nav>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"} onClick={() => setSidebarOpen(false)} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              <Icon name={item.icon} /><span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <SidebarMoodCard />
      </aside>
      {sidebarOpen && <button className="mobile-overlay" onClick={() => setSidebarOpen(false)} aria-label="Menüyü kapat" />}

      <main className="main-area">
        <header className="topbar">
          <button className="menu-button" onClick={() => setSidebarOpen(true)} aria-label="Menüyü aç"><Icon name="menu" /></button>
          <div className="topbar-title"><span className="eyebrow">{titles[location.pathname] ?? "MioDesk"}</span><strong>Planla, odaklan, motorunla arkadaşlarını dehşete düşür.</strong></div>

          <div className="topbar-actions">
            <div className="topbar-search-wrap" ref={searchRef}>
              <label className="search-box topbar-search-box">
                <Icon name="search" size={18} />
                <input
                  value={searchTerm}
                  onFocus={() => {
                    setSearchOpen(true);
                    void ensureSearchData();
                  }}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setSearchOpen(true);
                    void ensureSearchData();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && searchResults[0]) {
                      event.preventDefault();
                      goToSearchResult(searchResults[0]);
                    }
                  }}
                  placeholder="Ara (ders, görev, not...)"
                  aria-label="Ders, görev veya not ara"
                  aria-expanded={searchOpen}
                  aria-controls="global-search-results"
                  autoComplete="off"
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="search-clear-button"
                    onClick={() => setSearchTerm("")}
                    aria-label="Aramayı temizle"
                  >
                    <Icon name="close" size={15} />
                  </button>
                )}
              </label>

              {searchOpen && (
                <div className="topbar-dropdown search-dropdown" id="global-search-results">
                  <div className="dropdown-heading">
                    <strong>Hızlı Arama</strong>
                    <small>Ders, görev ve notlar</small>
                  </div>

                  {searchLoading && <div className="dropdown-state">Arama verileri hazırlanıyor...</div>}
                  {!searchLoading && searchError && <div className="dropdown-state dropdown-error">{searchError}</div>}
                  {!searchLoading && !searchError && normalizedQuery.length < 2 && (
                    <div className="dropdown-state">Aramak için en az 2 karakter yaz.</div>
                  )}
                  {!searchLoading && !searchError && normalizedQuery.length >= 2 && searchResults.length === 0 && (
                    <div className="dropdown-state">“{searchTerm.trim()}” için sonuç bulunamadı.</div>
                  )}

                  {!searchLoading && searchResults.length > 0 && (
                    <div className="search-result-list">
                      {searchResults.map((result) => (
                        <button
                          type="button"
                          className="search-result"
                          key={`${result.category}-${result.id}`}
                          onClick={() => goToSearchResult(result)}
                        >
                          <span className="search-result-icon"><Icon name={result.icon} size={17} /></span>
                          <span className="search-result-copy">
                            <strong>{result.title}</strong>
                            <small>{result.subtitle}</small>
                          </span>
                          <span className="search-result-category">{result.category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="notification-wrap" ref={notificationRef}>
              <button
                className={`notification-button ${notificationOpen ? "active" : ""}`}
                onClick={() => setNotificationOpen((current) => !current)}
                aria-label="Bildirimleri aç"
                aria-expanded={notificationOpen}
                aria-controls="notification-dropdown"
              >
                <Icon name="bell" />
                {unreadCount > 0 && <span>{unreadCount > 9 ? "9+" : unreadCount}</span>}
              </button>

              {notificationOpen && (
                <div className="topbar-dropdown notification-dropdown" id="notification-dropdown">
                  <div className="notification-dropdown-heading">
                    <div>
                      <strong>Bildirimler</strong>
                      <small>{unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : "Yeni bildirimin yok"}</small>
                    </div>
                    {unreadCount > 0 && (
                      <button type="button" onClick={() => void markAllAsRead()} disabled={markingAll}>
                        {markingAll ? "İşleniyor..." : "Tümünü okundu yap"}
                      </button>
                    )}
                  </div>

                  {notificationsLoading && <div className="dropdown-state">Bildirimler yükleniyor...</div>}
                  {!notificationsLoading && notificationError && <div className="dropdown-state dropdown-error">{notificationError}</div>}
                  {!notificationsLoading && !notificationError && notifications.length === 0 && (
                    <div className="dropdown-state">Henüz bildirim bulunmuyor.</div>
                  )}

                  {!notificationsLoading && notifications.length > 0 && (
                    <div className="notification-list">
                      {notifications.slice(0, 8).map((notification) => (
                        <button
                          type="button"
                          className={`notification-dropdown-item ${notification.isRead ? "read" : "unread"}`}
                          key={notification.id}
                          onClick={() => void openNotification(notification)}
                        >
                          <span className={`notification-dropdown-icon kind-${notification.kind}`}>✿</span>
                          <span className="notification-dropdown-copy">
                            <strong>{notification.title}</strong>
                            <small>{notification.message}</small>
                            <time>{formatRelative(notification.createdAt)}</time>
                          </span>
                          {!notification.isRead && <span className="unread-dot" aria-label="Okunmadı" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="profile-chip">
              <ProfileAvatar fullName={user?.fullName ?? "MioDesk kullanıcısı"} />
              <div><strong>{user?.fullName}</strong><small>{user?.major}</small></div>
            </div>
            <button className="icon-button logout-button" onClick={logout} aria-label="Çıkış yap"><Icon name="logout" /></button>
          </div>
        </header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  );
}
