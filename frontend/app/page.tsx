import Link from "next/link";
import CountUp from "@/components/CountUp";
import Spark from "@/components/Spark";

const KPIS = [
  { icon: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />, delta: "▲ 12.4%", value: 2.42, prefix: "$", suffix: "M", dec: 2, lbl: "Total savings identified", spark: "8,32 40,28 72,30 104,20 136,22 168,12 200,10 220,6" },
  { icon: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />, delta: "▲ 3.1%", value: 18.2, suffix: "%", dec: 1, lbl: "Energy consumption saved", spark: "8,30 40,26 72,28 104,22 136,18 168,20 200,12 220,10" },
  { icon: <><path d="M3 12a9 9 0 1018 0 9 9 0 00-18 0z" /><path d="M12 7v5l3 2" /></>, delta: "▲ 6.0%", value: 87, suffix: "%", dec: 0, lbl: "Average utilization", spark: "8,28 40,24 72,26 104,18 136,16 168,14 200,12 220,8" },
  { icon: <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />, delta: "▲ 2", value: 6, dec: 0, lbl: "Active projects", spark: "8,32 40,30 72,26 104,28 136,22 168,20 200,16 220,14" },
];

const PROJECTS = [
  { href: "/twin", pic: "🏭", name: "CNC Production Scheduling", tag: ["run", "Optimizing"], meta: "Manufacturing · 20 machines · 250 jobs", bar: 72, n: "$480K", s: "projected" },
  { href: "/optimization", pic: "🚚", name: "Last-Mile Delivery Routing", tag: ["done", "Solved"], meta: "Logistics · 64 vehicles · 1,240 stops", bar: 100, n: "$1.2M", s: "annualized" },
  { href: "/twin", pic: "📦", name: "Warehouse Slotting & Picking", tag: ["warn", "Conflict"], meta: "Warehouse · 8 zones · 3 shifts", bar: 44, n: "$310K", s: "projected" },
  { href: "/problem", pic: "⚡", name: "Grid Energy Load Balancing", tag: ["draft", "Draft"], meta: "Energy · 12 substations", bar: 15, n: "—", s: "not run" },
];

const RECS = [
  { title: "Shift Job #142 to Machine M-07", text: "Rebalancing cuts idle time by 14% and avoids the 2pm maintenance window.", conf: 92 },
  { title: "Run heavy jobs off-peak", text: "Scheduling 6 high-draw jobs after 8pm saves ~$3,100/wk in electricity.", conf: 87 },
  { title: "Add buffer before Inspection", text: "A 12-min buffer removes the recurring bottleneck at the QC station.", conf: 78 },
];

export default function Dashboard() {
  return (
    <>
      <div className="page-head stagger">
        <div>
          <div className="page-title">Good morning, <span className="serif">Karthik</span></div>
          <div className="page-sub">Here&apos;s what your operations look like today.</div>
        </div>
        <div className="head-actions">
          <button className="btn ghost">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" /></svg>Import
          </button>
          <Link className="btn primary" href="/problem">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>New Project
          </Link>
        </div>
      </div>

      <div className="grid g-4 stagger" style={{ marginBottom: 18 }}>
        {KPIS.map((k, i) => (
          <div className="card glass stat" key={i}>
            <div className="top"><div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>{k.icon}</svg></div><div className="delta up">{k.delta}</div></div>
            <div className="val"><CountUp value={k.value} prefix={k.prefix} suffix={k.suffix} decimals={k.dec} /></div>
            <div className="lbl">{k.lbl}</div>
            <Spark points={k.spark} />
          </div>
        ))}
      </div>

      <div className="split">
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="card glass card-pad stagger">
            <div className="card-head"><h3>Recent projects</h3><Link className="link" href="/optimization">View all</Link></div>
            {PROJECTS.map((p, i) => (
              <Link className="proj" href={p.href} key={i}>
                <div className="pic">{p.pic}</div>
                <div className="info">
                  <div className="pname">{p.name} <span className={"tag " + p.tag[0]}>{p.tag[1]}</span></div>
                  <div className="pmeta">{p.meta}</div>
                  <div className="pbar"><i style={{ width: `${p.bar}%` }} /></div>
                </div>
                <div className="pval"><div className="n">{p.n}</div><div className="s">{p.s}</div></div>
              </Link>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="card glass card-pad stagger">
            <div className="card-head"><h3>Active recommendations</h3></div>
            {RECS.map((r, i) => (
              <div className="rec" key={i}>
                <div className="ric"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4L12 3z" /></svg></div>
                <div>
                  <div className="rtitle">{r.title}</div>
                  <div className="rtext">{r.text}</div>
                  <div className="rconf">Confidence <span className="conf-bar"><i style={{ width: `${r.conf}%` }} /></span> {r.conf}%</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card glass card-pad stagger">
            <div className="card-head"><h3>Recent activity</h3></div>
            <div className="tl">
              <div className="tl-item ok"><div className="t"><b>Hybrid solver</b> found a better solution</div><div className="ts">CNC Scheduling · 8 min ago</div></div>
              <div className="tl-item ok"><div className="t"><b>Simulation</b> completed — Machine failure</div><div className="ts">Delivery Routing · 41 min ago</div></div>
              <div className="tl-item"><div className="t"><b>Report</b> generated (Executive Summary)</div><div className="ts">Warehouse · 2 hrs ago</div></div>
              <div className="tl-item"><div className="t"><b>Karthik</b> edited 3 constraints</div><div className="ts">CNC Scheduling · Yesterday</div></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
