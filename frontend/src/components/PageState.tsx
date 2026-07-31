import { Mascot } from "./Mascot";

export function LoadingState({ label = "Yükleniyor..." }: { label?: string }) {
  return <div className="page-state"><div className="loader"/><p>{label}</p></div>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><Mascot compact/><h3>{title}</h3><p>{description}</p></div>;
}
