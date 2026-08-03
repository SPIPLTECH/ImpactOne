"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  }

  const accent = "#e8452c";
  const inactiveBg = "#fde3df";

  type NavItem = {
    key: string;
    label: string;
    path: string | null;
    onClick: () => void;
    icon: (active: boolean) => React.ReactNode;
  };

  const items: NavItem[] = [
    {
      key: "payments",
      label: "My Payment",
      path: "/payments",
      onClick: () => router.push("/payments"),
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
          <path d="M16 13h2" />
        </svg>
      ),
    },
    {
      key: "history",
      label: "History",
      path: "/history",
      onClick: () => router.push("/history"),
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 7 12 12 15.5 14" />
        </svg>
      ),
    },
    {
      key: "home",
      label: "Home",
      path: "/dashboard",
      onClick: () => router.push("/dashboard"),
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5 12 3l9 6.5" />
          <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
        </svg>
      ),
    },
    {
      key: "about-app",
      label: "About App",
      path: "/about-app",
      onClick: () => router.push("/about-app"),
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="11" x2="12" y2="16" />
          <line x1="12" y1="7.5" x2="12" y2="7.51" />
        </svg>
      ),
    },
    {
      key: "logout",
      label: loggingOut ? "..." : "Logout",
      path: null,
      onClick: handleLogout,
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
          <polyline points="15 17 20 12 15 7" />
          <line x1="20" y1="12" x2="9" y2="12" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "var(--app-max-width, 447px)",
        background: "#ffffff",
        borderTop: "1px solid #f0f0f0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "10px 6px calc(8px + env(safe-area-inset-bottom))",
        boxSizing: "border-box",
        zIndex: 50,
      }}
    >
      {items.map((item) => {
        const isActive = Boolean(item.path && pathname === item.path);
        return (
          <button
            key={item.key}
            onClick={item.onClick}
            disabled={item.label === "..."}
            style={{
              background: "none",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 5,
              cursor: "pointer",
              padding: 0,
              flex: "1 1 0",
              minWidth: 0,
            }}
          >
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                background: isActive
                  ? "linear-gradient(135deg, #f5793a, #e8302c)"
                  : inactiveBg,
                boxShadow: isActive ? "0 4px 10px rgba(232,69,44,0.35)" : "none",
              }}
            >
              {item.icon(isActive)}
            </span>
            <span
              style={{
                textAlign: "center",
                lineHeight: 1.1,
                fontSize: 11,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "#1a1a1a" : "#4a4a4a",
                maxWidth: "100%",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}