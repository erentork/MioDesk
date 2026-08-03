import { useEffect, useState, type FormEvent } from "react";
import { AchievementsPanel } from "../components/AchievementsPanel";
import { Icon } from "../components/Icon";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { SettingsEasterEgg } from "../components/SettingsEasterEgg";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ApiError, authApi, tokenStore } from "../lib/api";

type ThemeName = "sakura" | "lavender" | "mint";

function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "İşlem tamamlanamadı. Lütfen tekrar dene.";
}

export function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [petals, setPetals] = useState(() => localStorage.getItem("miodesk_petals") !== "false");
  const [compact, setCompact] = useState(() => localStorage.getItem("miodesk_compact") === "true");
  const [theme, setTheme] = useState<ThemeName>(() => (localStorage.getItem("miodesk_theme") as ThemeName) || "sakura");

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [major, setMajor] = useState(user?.major ?? "");
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [email, setEmail] = useState(user?.email ?? "");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.classList.toggle("hide-petals", !petals);
    document.body.classList.toggle("compact-mode", compact);
  }, [theme, petals, compact]);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName);
    setMajor(user.major);
    setEmail(user.email);
  }, [user]);

  function saveAppearance() {
    localStorage.setItem("miodesk_theme", theme);
    localStorage.setItem("miodesk_petals", String(petals));
    localStorage.setItem("miodesk_compact", String(compact));
    showToast("Görünüm tercihleri kaydedildi.");
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setProfileError("");
    setSavingProfile(true);

    try {
      const result = await authApi.updateProfile(fullName, major);
      tokenStore.set(result.token);
      updateUser(result.user);
      showToast("Profil bilgilerin güncellendi.");
    } catch (error) {
      setProfileError(errorMessage(error));
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveEmail(event: FormEvent) {
    event.preventDefault();
    setEmailError("");
    setSavingEmail(true);

    try {
      const result = await authApi.changeEmail(email, emailPassword);
      tokenStore.set(result.token);
      updateUser(result.user);
      setEmailPassword("");
      showToast("E-posta adresin güncellendi.");
    } catch (error) {
      setEmailError(errorMessage(error));
    } finally {
      setSavingEmail(false);
    }
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Yeni şifreler birbiriyle eşleşmiyor.");
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Şifren başarıyla değiştirildi.");
    } catch (error) {
      setPasswordError(errorMessage(error));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="standard-page settings-page">
      <SettingsEasterEgg />
      <div className="page-heading">
        <div>
          <span className="eyebrow">Kişiselleştirme ve hesap</span>
          <h1>Ayarlar</h1>
          <p>Profil bilgilerini, güvenliğini ve MioDesk görünümünü tek yerden yönet.</p>
        </div>
      </div>

      <div className="settings-grid">
        <section className="panel profile-settings">
          <ProfileAvatar fullName={user?.fullName ?? "MioDesk kullanıcısı"} size="large" />
          <div>
            <span className="eyebrow">Profil</span>
            <h2>{user?.fullName}</h2>
            <p>{user?.email}</p>
            <small>{user?.major}</small>
            <span className="profile-avatar-hint">Avatarını değiştirmek için fotoğrafa dokun.</span>
          </div>
        </section>

        <section className="panel settings-list appearance-settings">
          <h2>Görünüm</h2>
          <label className="toggle-row">
            <div><strong>Sakura yaprakları</strong><small>Arka plandaki yumuşak yaprak animasyonları</small></div>
            <input type="checkbox" checked={petals} onChange={(event) => setPetals(event.target.checked)} />
            <span />
          </label>
          <label className="toggle-row">
            <div><strong>Kompakt görünüm</strong><small>Kartlar arasındaki boşlukları azaltır</small></div>
            <input type="checkbox" checked={compact} onChange={(event) => setCompact(event.target.checked)} />
            <span />
          </label>
          <div className="theme-preview" aria-label="Tema seçimi">
            <button type="button" className={theme === "sakura" ? "active" : ""} onClick={() => setTheme("sakura")}>Sakura</button>
            <button type="button" className={theme === "lavender" ? "active" : ""} onClick={() => setTheme("lavender")}>Lavanta</button>
            <button type="button" className={theme === "mint" ? "active" : ""} onClick={() => setTheme("mint")}>Nane</button>
          </div>
          <button type="button" className="primary-button" onClick={saveAppearance}>Tercihleri Kaydet</button>
        </section>
      </div>

      <section className="panel account-settings">
        <div className="account-settings-heading">
          <div>
            <span className="eyebrow">Hesabın</span>
            <h2>Profil ve güvenlik</h2>
            <p>Kimlik bilgilerini güncel tut, hesabını güçlü bir şifreyle koru.</p>
          </div>
          <span className="account-status"><i /> Hesap aktif</span>
        </div>

        <div className="account-settings-grid">
          <article className="account-card">
            <header>
              <span className="account-card-icon"><Icon name="user" /></span>
              <div><h3>Profil bilgileri</h3><p>Sitede görünen bilgilerin</p></div>
            </header>
            <form onSubmit={saveProfile}>
              <label>Ad soyad<input value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={2} maxLength={120} autoComplete="name" required /></label>
              <label>Bölüm<input value={major} onChange={(event) => setMajor(event.target.value)} minLength={2} maxLength={160} autoComplete="organization-title" required /></label>
              {profileError && <div className="form-error" role="alert">{profileError}</div>}
              <button className="soft-button account-submit" disabled={savingProfile}>{savingProfile ? "Kaydediliyor..." : "Profili Güncelle"}</button>
            </form>
          </article>

          <article className="account-card">
            <header>
              <span className="account-card-icon"><Icon name="mail" /></span>
              <div><h3>E-posta adresi</h3><p>Giriş yaptığın adres</p></div>
            </header>
            <form onSubmit={saveEmail}>
              <label>Yeni e-posta<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={180} autoComplete="email" required /></label>
              <label>Mevcut şifre<input type="password" value={emailPassword} onChange={(event) => setEmailPassword(event.target.value)} autoComplete="current-password" required /></label>
              {emailError && <div className="form-error" role="alert">{emailError}</div>}
              <button className="soft-button account-submit" disabled={savingEmail}>{savingEmail ? "Değiştiriliyor..." : "E-postayı Değiştir"}</button>
            </form>
          </article>

          <article className="account-card">
            <header>
              <span className="account-card-icon"><Icon name="lock" /></span>
              <div><h3>Şifre</h3><p>En az 8 karakter, harf ve rakam</p></div>
            </header>
            <form onSubmit={savePassword}>
              <label>Mevcut şifre<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required /></label>
              <div className="password-fields">
                <label>Yeni şifre<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} autoComplete="new-password" required /></label>
                <label>Yeni şifre tekrar<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} autoComplete="new-password" required /></label>
              </div>
              {passwordError && <div className="form-error" role="alert">{passwordError}</div>}
              <button className="soft-button account-submit" disabled={savingPassword}>{savingPassword ? "Değiştiriliyor..." : "Şifreyi Değiştir"}</button>
            </form>
          </article>
        </div>
      </section>

      <AchievementsPanel />
    </div>
  );
}
