import "./globals.css";
import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export const metadata: Metadata = {
  title: "OptiTwin Studio",
  description: "Design • Simulate • Optimize • Explain",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <div className="app">
          <Sidebar />
          <main>
            <Topbar />
            <div className="view-wrap">
              <div className="view active">{children}</div>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
