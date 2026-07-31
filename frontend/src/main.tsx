import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import "./styles.css";


const savedTheme = localStorage.getItem("miodesk_theme") || "sakura";
document.documentElement.dataset.theme = savedTheme;
document.body.classList.toggle("hide-petals", localStorage.getItem("miodesk_petals") === "false");
document.body.classList.toggle("compact-mode", localStorage.getItem("miodesk_compact") === "true");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
