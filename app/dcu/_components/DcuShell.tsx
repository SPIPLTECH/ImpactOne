"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, ReactNode } from "react";

const NAV_ITEMS: { key: string; label: string; href: string }[] = [
  { key: "dashboard", label: "Home", href: "/dcu/dashboard" },
  { key: "alc-interns-accounts", label: "ALC/Intern Accounts", href: "/dcu/alc-interns-accounts" },
  { key: "add-missing-data", label: "Add ALC Missing Data", href: "/dcu/add-missing-data" },
  { key: "checkins", label: "Check-in Submissions", href: "/dcu/checkins" },
  { key: "events", label: "Event Submissions", href: "/dcu/events" },
  { key: "schools", label: "School Completion", href: "/dcu/schools" },
  { key: "eligible-payments", label: "ALC/Intern Payment Eligibility", href: "/dcu/eligible-payments" },
  { key: "payment-details", label: "ALC/Intern Bank Details", href: "/dcu/payment-details" },
  { key: "submit-payment", label: "Submit Payment Receipt", href: "/dcu/submit-payment" },
  { key: "manage-alc", label: "Manage ALC/Intern", href: "/dcu/manage-alc" },
  { key: "export", label: "Export Submissions", href: "/dcu/export" },
  { key: "alc-export", label: "Export ALC Registrations", href: "/dcu/alc-export" },
  { key: "queries", label: "Queries / Issues Raised", href: "/dcu/queries" },
  { key: "notifications", label: "Send Notification", href: "/dcu/notifications" },
  { key: "news", label: "Send News", href: "/dcu/news" },
  { key: "notice", label: "Send Notice", href: "/dcu/notice" },
  { key: "analytics", label: "Analytics", href: "/dcu/analytics" },
];

export default function DcuShell({
  title,
  activeKey,
  children,
}: {
  title: string;
  activeKey: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [district, setDistrict] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setDistrict(d.user?.district || ""))
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="admin-panel">
      <aside
        className="admin-sidebar"
        style={{
          width: collapsed ? 64 : undefined,
          minWidth: collapsed ? 64 : undefined,
          overflow: collapsed ? "hidden" : undefined,
          transition: "width 0.2s ease, min-width 0.2s ease",
          position: "relative",
        }}
      >
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Maximize" : "Minimize"}
          style={{
            position: "absolute",
            top: 10,
            right: collapsed ? "50%" : 10,
            transform: collapsed ? "translateX(50%)" : "none",
            width: 26,
            height: 26,
            borderRadius: "50%",
            border: "1px solid #eee",
            background: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            color: "#e8003f",
            zIndex: 5,
          }}
        >
          {collapsed ? "»" : "«"}
        </button>

        <div className="admin-sidebar-brand" style={{ whiteSpace: "nowrap" }}>
          {collapsed ? "DCU" : (
            <>
              DCU <span>Admin</span>
            </>
          )}
        </div>

        {!collapsed && (
          <div style={{ color: "#999", fontSize: 12, marginBottom: 20 }}>{district}</div>
        )}

        {NAV_ITEMS.map(function renderNavItem(item) {
          const isActive = activeKey === item.key || pathname === item.href;
          return (
            <div
              key={item.key}
              className={"admin-nav-item" + (isActive ? " active" : "")}
              onClick={function handleNavClick() {
                router.push(item.href);
              }}
              title={collapsed ? item.label : undefined}
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: collapsed ? "clip" : "ellipsis",
                cursor: "pointer",
              }}
            >
              {collapsed ? item.label.charAt(0) : item.label}
            </div>
          );
        })}

        <div
          className="admin-nav-item"
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          style={{ whiteSpace: "nowrap", cursor: "pointer" }}
        >
          {collapsed ? "L" : "Logout"}
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <h1>
            {title} {district ? "— " + district : ""}
          </h1>
        </div>
        {children}
      </main>
    </div>
  );
}