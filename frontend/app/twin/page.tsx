"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ReactFlow, Background, Controls, Handle, Position, type Node, type Edge, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

type Health = "e" | "a" | "c";
interface TwinData extends Record<string, unknown> {
  label: string; type: string; icon: string; color: Health;
  health: number; status: string; task: string; eff: string; energy: string; cap: number;
}
const COLOR: Record<Health, string> = { e: "var(--emerald)", a: "var(--amber)", c: "var(--crimson)" };

const RAW: (TwinData & { id: string; x: number; y: number })[] = [
  { id: "sup", x: 40, y: 240, label: "Suppliers", type: "Source", icon: "📥", health: 88, status: "Nominal", task: "2 inbound", eff: "—", energy: "—", cap: 70, color: "e" },
  { id: "wh", x: 220, y: 240, label: "Raw Warehouse", type: "Storage", icon: "📦", health: 82, status: "82% full", task: "Staging", eff: "88%", energy: "2.1 kWh", cap: 82, color: "e" },
  { id: "m1", x: 420, y: 90, label: "CNC M-04", type: "Machine", icon: "⚙️", health: 94, status: "Running", task: "Job #118", eff: "94%", energy: "6.8 kWh", cap: 76, color: "e" },
  { id: "m2", x: 420, y: 190, label: "CNC M-07", type: "Machine", icon: "⚙️", health: 61, status: "Running", task: "Job #142", eff: "79%", energy: "7.9 kWh", cap: 91, color: "a" },
  { id: "m3", x: 420, y: 290, label: "CNC M-11", type: "Machine", icon: "⚙️", health: 96, status: "Running", task: "Job #131", eff: "96%", energy: "6.2 kWh", cap: 64, color: "e" },
  { id: "m4", x: 420, y: 390, label: "CNC M-15", type: "Machine", icon: "⚙️", health: 34, status: "Overheating", task: "Job #150", eff: "58%", energy: "9.4 kWh", cap: 98, color: "c" },
  { id: "insp", x: 630, y: 190, label: "Inspection", type: "Quality", icon: "🔍", health: 73, status: "Queue: 6", task: "QC batch 12", eff: "84%", energy: "1.4 kWh", cap: 88, color: "a" },
  { id: "pack", x: 630, y: 340, label: "Packaging", type: "Process", icon: "📦", health: 90, status: "Running", task: "Order #A22", eff: "92%", energy: "2.8 kWh", cap: 70, color: "e" },
  { id: "work", x: 220, y: 400, label: "Operators", type: "Workforce", icon: "👷", health: 86, status: "12 on shift", task: "Shift B", eff: "89%", energy: "—", cap: 75, color: "e" },
  { id: "del", x: 830, y: 260, label: "Delivery", type: "Output", icon: "🚚", health: 92, status: "On schedule", task: "8 routes", eff: "95%", energy: "—", cap: 68, color: "e" },
];
const LINKS = [["sup", "wh"], ["wh", "m1"], ["wh", "m2"], ["wh", "m3"], ["wh", "m4"], ["work", "m2"], ["work", "m4"], ["m1", "insp"], ["m2", "insp"], ["m3", "insp"], ["m4", "pack"], ["insp", "pack"], ["insp", "del"], ["pack", "del"]];
const COUNTS = RAW.reduce((m, n) => { m[n.color]++; return m; }, { e: 0, a: 0, c: 0 } as Record<Health, number>);

const RISKS: Record<Health, [string, string][]> = {
  c: [["var(--crimson)", "Thermal threshold exceeded — downtime likely within 40 min"], ["var(--amber)", "Tool wear at 87% of rated life"]],
  a: [["var(--amber)", "Approaching capacity ceiling during peak hours"], ["var(--amber)", "Queue building at downstream station"]],
  e: [["var(--emerald)", "Operating within nominal range"], ["var(--emerald)", "No maintenance due for 6 days"]],
};
const RECS: Record<Health, [string, string]> = {
  c: ["Reroute Job #150 to M-11", "Prevents an unplanned stop and protects the QC deadline."],
  a: ["Rebalance load to M-04", "Reduces predicted bottleneck risk by 22%."],
  e: ["Hold current allocation", "This node is optimal — no action needed."],
};

function TwinNode({ data }: NodeProps) {
  const d = data as TwinData;
  const col = COLOR[d.color];
  return (
    <div className="node-g" style={{ position: "relative", width: 52, height: 52 }}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div className="node-body" style={{ width: 52, height: 52, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 22, background: "rgba(28,28,30,0.92)", border: `2px solid ${col}` }}>{d.icon}</div>
      <span style={{ position: "absolute", top: 5, right: 5, width: 9, height: 9, borderRadius: "50%", background: col, border: "1.5px solid var(--bg)" }} />
      <div style={{ position: "absolute", top: 58, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", fontSize: 12, fontWeight: 600, color: "rgba(245,245,245,0.85)" }}>{d.label}</div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}
const nodeTypes = { twin: TwinNode };

export default function Twin() {
  const [sel, setSel] = useState<TwinData | null>(null);
  const nodes: Node[] = useMemo(() => RAW.map((n) => ({ id: n.id, type: "twin", position: { x: n.x, y: n.y }, data: n })), []);
  const edges: Edge[] = useMemo(() => LINKS.map(([s, t]) => ({ id: `${s}-${t}`, source: s, target: t, animated: true, style: { stroke: "var(--gold)", strokeWidth: 1.6, opacity: 0.5 } })), []);

  return (
    <>
      <div className="page-head stagger">
        <div>
          <div className="page-title">Digital <span className="serif">Twin</span></div>
          <div className="page-sub">A live graph of your operation. Click any node to inspect. Drag to rearrange.</div>
        </div>
        <div className="head-actions">
          <Link className="btn primary" href="/optimization"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M4 20V10m5 10V4m5 16v-7m5 7V8" /></svg>Optimize</Link>
        </div>
      </div>

      <div className="twin-toolbar stagger">
        <div className="legend">
          <span><i style={{ background: "var(--emerald)" }} />Healthy</span>
          <span><i style={{ background: "var(--amber)" }} />At risk</span>
          <span><i style={{ background: "var(--crimson)" }} />Critical</span>
          <span><i style={{ background: "var(--gold)" }} />Flow</span>
        </div>
      </div>

      <div className="card glass canvas-card stagger">
        <div className="twin-hud">
          <div className="hud-pill"><span className="hud-dot" style={{ background: "var(--emerald)" }} /><b>{COUNTS.e}</b> healthy</div>
          <div className="hud-pill"><span className="hud-dot" style={{ background: "var(--amber)" }} /><b>{COUNTS.a}</b> at risk</div>
          <div className="hud-pill"><span className="hud-dot" style={{ background: "var(--crimson)" }} /><b>{COUNTS.c}</b> critical</div>
        </div>
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView proOptions={{ hideAttribution: true }}
          onNodeClick={(_, n) => setSel(n.data as TwinData)} onPaneClick={() => setSel(null)}
          nodesConnectable={false} edgesFocusable={false}>
          <Background color="rgba(255,255,255,0.06)" gap={26} />
          <Controls showInteractive={false} />
        </ReactFlow>
        {sel && <Drawer node={sel} onClose={() => setSel(null)} />}
      </div>
    </>
  );
}

const R = 40;
const C = 2 * Math.PI * R;

function Drawer({ node, onClose }: { node: TwinData; onClose: () => void }) {
  const col = COLOR[node.color];
  const [off, setOff] = useState(C);
  const [cap, setCap] = useState(0);
  useEffect(() => {
    setOff(C); setCap(0);
    const id = requestAnimationFrame(() => { setOff(C - (C * node.health) / 100); setCap(node.cap); });
    return () => cancelAnimationFrame(id);
  }, [node]);

  const risks = RISKS[node.color];
  const rec = RECS[node.color];
  const capBg = node.cap > 90 ? "linear-gradient(90deg,var(--crimson),#f08)" : node.cap > 80 ? "linear-gradient(90deg,var(--amber),#f5c542)" : "linear-gradient(90deg,var(--gold),var(--gold-hi))";

  return (
    <div className="drawer open">
      <div className="dclose" onClick={onClose}><svg viewBox="0 0 24 24" width="16" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 6l12 12M18 6L6 18" /></svg></div>
      <div className="d-type">{node.type}</div>
      <div className="d-name">{node.label}</div>
      <div className="d-ring-wrap">
        <div className="d-ring">
          <svg width="96" height="96" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8} />
            <circle cx="48" cy="48" r={R} fill="none" stroke={col} strokeWidth={8} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} transform="rotate(-90 48 48)" style={{ transition: "stroke-dashoffset 1s cubic-bezier(.16,1,.3,1)" }} />
          </svg>
          <div className="pct"><span>{node.health}</span><small>Health</small></div>
        </div>
        <div className="d-metrics">
          <div className="d-metric"><span className="k">Status</span><span className="v">{node.status}</span></div>
          <div className="d-metric"><span className="k">Current task</span><span className="v">{node.task}</span></div>
          <div className="d-metric"><span className="k">Efficiency</span><span className="v">{node.eff}</span></div>
          <div className="d-metric"><span className="k">Energy</span><span className="v">{node.energy}</span></div>
        </div>
      </div>
      <div className="d-section">
        <h5>Capacity utilization</h5>
        <div className="d-cap"><i style={{ width: `${cap}%`, background: capBg, transition: "width 1s cubic-bezier(.16,1,.3,1)" }} /></div>
      </div>
      <div className="d-section">
        <h5>Predicted risks</h5>
        {risks.map(([c, t], i) => (<div className="risk" key={i}><span className="rd" style={{ background: c }} />{t}</div>))}
      </div>
      <div className="d-section">
        <h5>Recommendations</h5>
        <div className="rec" style={{ paddingTop: 0 }}>
          <div className="ric"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4L12 3z" /></svg></div>
          <div><div className="rtitle">{rec[0]}</div><div className="rtext">{rec[1]}</div></div>
        </div>
      </div>
    </div>
  );
}
