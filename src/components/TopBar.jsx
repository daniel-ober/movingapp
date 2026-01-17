// src/components/TopBar.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "./TopBar.css";

function formatToday() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const DOCS = [
  {
    label: "Move Cheat Sheet (One Pager)",
    href: "/docs/Move_Cheat_Sheet_One_Pager_v2.pdf",
  },
  {
    label: "Master Move Rental Transition Plan",
    href: "/docs/Master_Move_Rental_Transition_Plan_Chelsea_Dan.pdf",
  },
  {
    label: "Rental Property Scorecard",
    href: "/docs/Rental_Property_Scorecard_Chelsea_and_Dan_v2.pdf",
  },
];

export function TopBar() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const today = useMemo(() => formatToday(), []);

  useEffect(() => {
    function onDocClick(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    }

    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        {/* LEFT */}
        <div className="topbar-left">
          <div className="brand-text">
            <div className="brand-title">Moving App</div>
            <div className="brand-subtitle">Property tracker + scoring</div>
          </div>
        </div>

        {/* CENTER */}
        <div className="topbar-center" aria-label="Today's date">
          <div className="topbar-datePill">
            <div className="topbar-dateLabel">TODAY&apos;S DATE</div>
            <div className="topbar-dateVal">{today}</div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="topbar-right" ref={wrapRef}>
          <button
            type="button"
            className="topbar-docsBtn"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <span>Docs</span>
            <span className="topbar-caret" aria-hidden="true">
              {open ? "▴" : "▾"}
            </span>
          </button>

          {open ? (
            <div className="topbar-docsMenu" role="menu">
              {DOCS.map((d) => (
                <a
                  key={d.href}
                  href={d.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="topbar-docsItem"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  {d.label}
                  <span className="topbar-docsExt" aria-hidden="true">
                    ↗
                  </span>
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
