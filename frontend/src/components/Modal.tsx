import type { ReactNode } from "react";
import { Icon } from "./Icon";

export function Modal({ title, open, onClose, children, wide = false }: { title: string; open: boolean; onClose: () => void; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className={`modal-card ${wide ? "modal-wide" : ""}`} onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <header><div><span className="eyebrow">MioDesk</span><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Kapat"><Icon name="close" /></button></header>
        {children}
      </section>
    </div>
  );
}
