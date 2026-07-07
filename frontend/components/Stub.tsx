import Link from "next/link";

export default function Stub({ title, serif, sub, note }: { title: string; serif: string; sub: string; note: string }) {
  return (
    <>
      <div className="page-head stagger">
        <div>
          <div className="page-title">{title} <span className="serif">{serif}</span></div>
          <div className="page-sub">{sub}</div>
        </div>
      </div>
      <div className="card glass card-pad stagger" style={{ textAlign: "center", padding: "70px 30px" }}>
        <div style={{ width: 60, height: 60, borderRadius: 16, margin: "0 auto 18px", display: "grid", placeItems: "center", background: "var(--gold-soft)", color: "var(--gold-hi)" }}>
          <svg viewBox="0 0 24 24" width="28" fill="none" stroke="currentColor" strokeWidth={1.6}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
        </div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Porting this view</div>
        <div className="page-sub" style={{ maxWidth: 460, margin: "8px auto 0" }}>{note}</div>
        <Link className="btn primary" href="/" style={{ marginTop: 22 }}>Back to Dashboard</Link>
      </div>
    </>
  );
}
