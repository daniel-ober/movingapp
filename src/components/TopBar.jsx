import "./TopBar.css";

function formatToday() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function TopBar({ onAddProperty }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <div className="brand-text">
            <div className="brand-title">Moving App</div>
            <div className="brand-subtitle">Property tracker + scoring</div>
          </div>
        </div>

        <div className="topbar-right">
          <div className="topbar-date">{formatToday()}</div>

          <button
            className="btn btn-primary topbar-cta"
            type="button"
            onClick={onAddProperty}
          >
            + Add Property
          </button>
        </div>
      </div>
    </header>
  );
}