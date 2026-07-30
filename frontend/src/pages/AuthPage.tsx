import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import { Mascot } from "../components/Mascot";
import { SakuraBackground } from "../components/SakuraBackground";

export function AuthPage() {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [major, setMajor] = useState("Bilgisayar Mühendisliği");
  const [email, setEmail] = useState("demo@miodesk.local");
  const [password, setPassword] = useState("Demo123!");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(""); setSubmitting(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(fullName, email, password, major);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Bağlantı kurulamadı. API'nin çalıştığından emin olun.");
    } finally { setSubmitting(false); }
  }

  return (
    <div className="auth-page">
      <SakuraBackground />
      <section className="auth-visual">
        <div className="brand auth-brand"><span className="brand-flower">✿</span><span>MioDesk</span></div>
        <div className="auth-copy"><span className="eyebrow">Akademik hayatın, tek masada</span><h1>Derslerini ve hedeflerini tatlı bir düzenle yönet.</h1><p>Haftalık program, teslimler, post-it notlar, odak oturumları ve ilerleme istatistikleri bir arada.</p></div>
        <Mascot />
        <div className="auth-note">Bugün küçük bir adım at. Mio gerisini seninle planlasın. ♡</div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <span className="eyebrow">Hoş geldin</span>
          <h2>{mode === "login" ? "Masan seni bekliyor" : "Yeni masanı hazırlayalım"}</h2>
          <p>{mode === "login" ? "Devam etmek için hesabına giriş yap." : "Birkaç bilgiyle kişisel çalışma alanını oluştur."}</p>
          <div className="auth-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Giriş Yap</button><button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Kayıt Ol</button></div>
          <form onSubmit={submit}>
            {mode === "register" && <><label>Ad soyad<input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ayşe Yılmaz" required /></label><label>Bölüm<input value={major} onChange={(e) => setMajor(e.target.value)} required /></label></>}
            <label>E-posta<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            <label>Şifre<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required /></label>
            {error && <div className="form-error">{error}</div>}
            <button className="primary-button full-button" disabled={submitting}>{submitting ? "Hazırlanıyor..." : mode === "login" ? "Masama Git" : "MioDesk'i Oluştur"}</button>
          </form>
          <div className="demo-hint"><strong>Demo hesap</strong><span>demo@miodesk.local</span><span>Demo123!</span></div>
        </div>
      </section>
    </div>
  );
}
