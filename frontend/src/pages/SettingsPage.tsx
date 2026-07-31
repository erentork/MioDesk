import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { SettingsEasterEgg } from "../components/SettingsEasterEgg";
import { AchievementsPanel } from "../components/AchievementsPanel";

type ThemeName = "sakura" | "lavender" | "mint";

export function SettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [petals, setPetals] = useState(() => localStorage.getItem("miodesk_petals") !== "false");
  const [compact, setCompact] = useState(() => localStorage.getItem("miodesk_compact") === "true");
  const [theme, setTheme] = useState<ThemeName>(() => (localStorage.getItem("miodesk_theme") as ThemeName) || "sakura");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.classList.toggle("hide-petals", !petals);
    document.body.classList.toggle("compact-mode", compact);
  }, [theme, petals, compact]);

  function save() {
    localStorage.setItem("miodesk_theme", theme);
    localStorage.setItem("miodesk_petals", String(petals));
    localStorage.setItem("miodesk_compact", String(compact));
    showToast("Görünüm tercihleri kaydedildi.");
  }

  return (
    <div className="standard-page">
    <SettingsEasterEgg />
      <div className="page-heading">
        <div><span className="eyebrow">Kişiselleştirme</span><h1>Ayarlar</h1><p>MioDesk görünümünü ve yerel tercihlerini düzenle.</p></div>
      </div>
      <div className="settings-grid">
        <section className="panel profile-settings">
          <ProfileAvatar fullName={user?.fullName ?? "MioDesk kullanıcısı"} size="large" />
          <div><span className="eyebrow">Profil</span><h2>{user?.fullName}</h2><p>{user?.email}</p><small>{user?.major}</small></div>
          
        </section>
        <section className="panel settings-list">
          <h2>Görünüm</h2>
          <label className="toggle-row"><div><strong>Sakura yaprakları</strong><small>Arka plandaki yumuşak yaprak animasyonları</small></div><input type="checkbox" checked={petals} onChange={e => setPetals(e.target.checked)} /><span /></label>
          
          <div className="theme-preview">
            <button className={theme === "sakura" ? "active" : ""} onClick={() => setTheme("sakura")}>Sakura</button>
            <button className={theme === "lavender" ? "active" : ""} onClick={() => setTheme("lavender")}>Lavanta</button>
            <button className={theme === "mint" ? "active" : ""} onClick={() => setTheme("mint")}>Nane</button>
          </div>
          <button className="primary-button" onClick={save}>Tercihleri Kaydet</button>
        </section>
        <section className="panel settings-list">
          <h2>Hakkında</h2>
          <p>MioDesk v1.0 — akademik planlama, görev takibi ve odak yönetimi.</p>
          <p className="muted">Tasarım sistemi, ikonlar ve maskot bu proje için özgün olarak hazırlanmıştır.</p>
        </section>
      </div>
          <AchievementsPanel />
    </div>
  );
}
