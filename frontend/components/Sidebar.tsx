"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard", icon: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></> },
  { href: "/problem", label: "Problem", icon: <><path d="M12 3a9 9 0 019 9c0 3-2 5-2 7H5c0-2-2-4-2-7a9 9 0 019-9z" /><path d="M9 21h6" /><path d="M12 8v4l2 1" /></> },
  { href: "/twin", label: "Digital Twin", icon: <><circle cx="5" cy="6" r="2.2" /><circle cx="19" cy="6" r="2.2" /><circle cx="12" cy="18" r="2.2" /><path d="M7 7l4 9m6-9l-4 9" /></> },
  { href: "/optimization", label: "Optimization", badge: "AI", icon: <path d="M4 20V10m5 10V4m5 16v-7m5 7V8" /> },
];
const WORK = [
  { href: "/simulation", label: "Simulation", icon: <path d="M3 12h4l3 8 4-16 3 8h4" /> },
  { href: "/reports", label: "Reports", icon: <><path d="M6 3h9l4 4v14a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></> },
];

export default function Sidebar() {
  const path = usePathname();
  const item = (n: (typeof NAV)[number]) => {
    const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
    return (
      <Link key={n.href} href={n.href} className={"nav-item" + (active ? " active" : "")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>{n.icon}</svg>
        {n.label}
        {n.badge && <span className="badge">{n.badge}</span>}
      </Link>
    );
  };
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6.5v11L12 22l8-4.5v-11L12 2z" stroke="#C9A86A" strokeWidth={1.4} strokeLinejoin="round" /><path d="M12 7l4 2.3v4.4L12 16l-4-2.3V9.3L12 7z" fill="#C9A86A" fillOpacity="0.25" stroke="#E3C892" strokeWidth={1.2} strokeLinejoin="round" /><circle cx="12" cy="11.5" r="1.4" fill="#E3C892" /></svg>
        </div>
        <div>
          <div className="name">Opti<b>Twin</b></div>
          <div className="sub">Studio</div>
        </div>
      </div>
      <nav>
        {NAV.map(item)}
        <div className="nav-label">Workspace</div>
        {WORK.map(item)}
      </nav>
      <div className="spacer" />
      <div className="user-card">
        <div className="avatar">JK</div>
        <div style={{ minWidth: 0 }}>
          <div className="u-name">Karthik</div>
          <div className="u-mail">nexvista.com</div>
        </div>
      </div>
    </aside>
  );
}
