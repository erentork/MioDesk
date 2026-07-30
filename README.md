# MioDesk

MioDesk; ders programı, akademik görevler, post-it notlar, bildirimler, odak oturumları ve ilerleme istatistiklerini tek bir çalışma masasında birleştiren Türkçe bir öğrenci planlama uygulamasıdır.

Bu depo hazır bir tema ya da UI kiti kullanmaz. Arayüz bileşenleri, SVG ikonları, kedi maskotu, sakura efektleri ve tasarım sistemi proje için özgün olarak yazılmıştır.

## Özellikler

- JWT tabanlı kayıt, giriş ve oturum doğrulama
- Ders ekleme, düzenleme ve silme
- Haftalık ders programı yönetimi
- Ödev, proje, sınav, sunum, quiz ve kişisel görev takibi
- Durum, öncelik, ilerleme ve gecikme hesaplaması
- Renkli ve sabitlenebilir post-it notları
- Pomodoro/odak zamanlayıcısı ve oturum geçmişi
- Dashboard özetleri, bildirimler ve istatistikler
- Masaüstü, tablet ve mobil ekranlara uyumlu tasarım
- PostgreSQL veritabanı ve Swagger API belgeleri

## Teknolojiler

### Backend

- ASP.NET Core 8 Web API
- Entity Framework Core 8
- PostgreSQL 16 (Docker)
- JWT Authentication
- Katmanlı Repository / Service yapısı
- Global exception middleware
- Swagger / OpenAPI

### Frontend

- React + TypeScript
- Vite
- React Router
- Fetch tabanlı özel API istemcisi
- Hazır bileşen veya ikon paketi içermeyen özgün CSS/SVG tasarımı

## Hızlı kurulum

PowerShell'i normal kullanıcı olarak açın ve proje klasöründe çalıştırın:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup.ps1
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Uygulama adresleri:

- Web: `http://localhost:5173`
- Swagger: `http://localhost:5088/swagger`
- API sağlık kontrolü: `http://localhost:5088/health`
- PostgreSQL: `localhost:5434`

## Demo hesap

İlk açılışta örnek dersler, görevler, notlar ve programla birlikte aşağıdaki yerel hesap oluşturulur:

```text
E-posta: demo@miodesk.local
Şifre:   Demo123!
```

Kayıt ekranından kendi hesabınızı da oluşturabilirsiniz.

## Komut dosyaları

- `setup.ps1`: Araçları kontrol eder, PostgreSQL'i başlatır, .NET ve npm paketlerini kurar.
- `start.ps1`: API ve frontend'i ayrı PowerShell pencerelerinde başlatır.
- `stop.ps1`: 5088 ve 5173 portlarındaki MioDesk süreçlerini ve veritabanını durdurur.
- `reset-data.ps1`: Docker veritabanı hacmini silip temiz bir başlangıç yapar.

## Proje yapısı

```text
MioDesk/
├── backend/MioDesk.API/
│   ├── Controllers/
│   ├── Data/
│   ├── DTOs/
│   ├── Entities/
│   ├── Middleware/
│   ├── Repositories/
│   └── Services/
├── frontend/src/
│   ├── components/
│   ├── context/
│   ├── lib/
│   ├── pages/
│   └── types/
├── docker-compose.yml
├── setup.ps1
├── start.ps1
├── stop.ps1
└── reset-data.ps1
```

## Veritabanı notu

Geliştirme sürümü ilk açılışta `EnsureCreatedAsync` kullanarak şemayı otomatik oluşturur. Veri modelinde kapsamlı bir değişiklik yapıldığında yerel hacmi `reset-data.ps1` ile temizleyebilirsiniz. Üretim ortamına geçerken EF Core migrations kullanılması önerilir.

## Güvenlik notu

`appsettings.json` içindeki JWT anahtarı ve Docker parolası yalnızca yerel geliştirme içindir. Uygulamayı internete açmadan önce bunları environment variable veya güvenli secret yönetimiyle değiştirin.
