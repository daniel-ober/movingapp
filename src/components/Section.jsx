import "./Section.css";

export function Section({ title, subtitle, children }) {
  return (
    <section className="section">
      <div className="section-head">
        <div className="section-title">{title}</div>
        {subtitle ? <div className="section-subtitle">{subtitle}</div> : null}
      </div>
      <div className="section-body">{children}</div>
    </section>
  );
}