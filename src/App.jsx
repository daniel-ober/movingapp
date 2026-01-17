// src/App.jsx
import { useEffect, useMemo, useState } from "react";
import "./styles/app.css";
import { TopBar } from "./components/TopBar";
import { Section } from "./components/Section";
import { MedalCard } from "./components/MedalCard";
import { PropertyCard } from "./components/PropertyCard";
import { AddPropertyModal } from "./components/AddPropertyModal";
import { QuickEditModal } from "./components/QuickEditModal";
import { ChecklistModal } from "./components/ChecklistModal";

import {
  createProperty,
  subscribeToProperties,
  updateProperty,
} from "./services/properties";
import { createCompany, subscribeToCompanies } from "./services/companies";
import { computeOverallScore } from "./utils/scoreProperty";

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function sortByScoreDesc(a, b) {
  return safeNum(b.score) - safeNum(a.score);
}

export default function App() {
  const [properties, setProperties] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [addOpen, setAddOpen] = useState(false);
  const [quickEditId, setQuickEditId] = useState(null);
  const [checklistId, setChecklistId] = useState(null);

  useEffect(() => {
    const unsubProps = subscribeToProperties(setProperties);
    const unsubCompanies = subscribeToCompanies(setCompanies);
    return () => {
      unsubProps();
      unsubCompanies();
    };
  }, []);

  // Build a lookup so cards can display a company name even when property only stores managementCompanyId
  const companyById = useMemo(() => {
    const map = {};
    for (const c of companies || []) map[c.id] = c;
    return map;
  }, [companies]);

  // Hydrate properties with a consistent display name:
  // - if they typed a company name (managementCompanyName), use it
  // - else if they selected an existing company (managementCompanyId), resolve it here
  const hydratedProperties = useMemo(() => {
    return (properties || []).map((p) => {
      const resolvedName =
        (p?.managementCompanyName || "").trim() ||
        (p?.managementCompanyId && companyById[p.managementCompanyId]?.name) ||
        "";
      return { ...p, managementCompanyName: resolvedName };
    });
  }, [properties, companyById]);

  const activeQuickEdit = useMemo(
    () => hydratedProperties.find((p) => p.id === quickEditId) || null,
    [hydratedProperties, quickEditId]
  );

  const activeChecklist = useMemo(
    () => hydratedProperties.find((p) => p.id === checklistId) || null,
    [hydratedProperties, checklistId]
  );

  const { top3, interestedNotVisited, interestedVisited, notInterested } =
    useMemo(() => {
      const interested = hydratedProperties.filter(
        (p) => p.status !== "not_interested"
      );
      const notInt = hydratedProperties.filter(
        (p) => p.status === "not_interested"
      );

      const notVisited = interested
        .filter((p) => p.visitStatus !== "visited")
        .sort(sortByScoreDesc);

      const visited = interested
        .filter((p) => p.visitStatus === "visited")
        .sort(sortByScoreDesc);

      const topPool = visited.length ? visited : interested;
      const top = [...topPool].sort(sortByScoreDesc).slice(0, 3);

      return {
        top3: top,
        interestedNotVisited: notVisited,
        interestedVisited: visited,
        notInterested: notInt.sort(sortByScoreDesc),
      };
    }, [hydratedProperties]);

  const winner = top3[0];
  const silver = top3[1];
  const bronze = top3[2];

  async function handleCreate(form) {
    return createProperty(form);
  }

  async function handleCreateCompany(name) {
    return createCompany(name);
  }

  async function handleSaveQuickEdit(id, patch) {
    const current = hydratedProperties.find((p) => p.id === id);
    const merged = { ...(current || {}), ...(patch || {}) };

    const scored = computeOverallScore(merged);
    await updateProperty(id, {
      ...patch,
      score: scored.score,
      scoreMeta: scored.meta,
      scoreWhy: scored.why,
    });
  }

  async function handleSaveChecklist(id, checklistPatch) {
    const current = hydratedProperties.find((p) => p.id === id);
    const merged = {
      ...(current || {}),
      checklist: {
        ...(current?.checklist || {}),
        ...(checklistPatch || {}),
      },
    };

    const scored = computeOverallScore(merged);
    await updateProperty(id, {
      checklist: merged.checklist,
      score: scored.score,
      scoreMeta: scored.meta,
      scoreWhy: scored.why,
    });
  }

  async function quickToggleVisited(p) {
    const next = p.visitStatus === "visited" ? "not_visited" : "visited";
    const merged = { ...p, visitStatus: next };
    const scored = computeOverallScore(merged);
    await updateProperty(p.id, {
      visitStatus: next,
      score: scored.score,
      scoreMeta: scored.meta,
      scoreWhy: scored.why,
    });
  }

  return (
    <div className="app-shell">
      <TopBar onAddProperty={() => setAddOpen(true)} />
      {/* Primary CTA sits between top bar and Top Choices */}
      <div className="app-ctaRow">
        <button
          className="btn btn-primary app-ctaBtn"
          type="button"
          onClick={() => setAddOpen(true)}
        >
          + Add Property
        </button>
      </div>
      <AddPropertyModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={handleCreate}
        companies={companies}
        onCreateCompany={handleCreateCompany}
      />

      <QuickEditModal
        open={!!activeQuickEdit}
        onClose={() => setQuickEditId(null)}
        property={activeQuickEdit}
        companies={companies}
        onCreateCompany={handleCreateCompany}
        onSave={handleSaveQuickEdit}
      />

      <ChecklistModal
        open={!!activeChecklist}
        onClose={() => setChecklistId(null)}
        property={activeChecklist}
        onSave={handleSaveChecklist}
      />

      <main className="app-main">
        <Section
          title="Top Choices"
          subtitle="Gold / Silver / Bronze — auto-ranked (visited first when available)."
        >
          <div className="medals-grid">
            {winner ? (
              <MedalCard
                medal="gold"
                title="Top-Runner"
                property={winner}
                isWinner
              />
            ) : (
              <MedalCard
                medal="gold"
                title="Winner"
                property={{
                  address: "No properties yet",
                  rentMonthly: 0,
                  beds: 0,
                  baths: 0,
                  sqft: 0,
                  commuteMinutes: 0,
                  score: 0,
                  why: ["Click “Add Property” to begin."],
                }}
                isWinner
              />
            )}

            <MedalCard
              medal="silver"
              title="Runner-up"
              property={
                silver || {
                  address: "—",
                  rentMonthly: 0,
                  beds: 0,
                  baths: 0,
                  sqft: 0,
                  commuteMinutes: 0,
                  score: 0,
                }
              }
            />

            <MedalCard
              medal="bronze"
              title="Next Best"
              property={
                bronze || {
                  address: "—",
                  rentMonthly: 0,
                  beds: 0,
                  baths: 0,
                  sqft: 0,
                  commuteMinutes: 0,
                  score: 0,
                }
              }
            />
          </div>
        </Section>

        <div className="two-col">
          <Section
            title="Interested — Not Visited"
            subtitle="Stuff to tour / drive-by next."
          >
            <div className="list">
              {interestedNotVisited.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  onQuickEdit={() => setQuickEditId(p.id)}
                  onOpenChecklist={() => setChecklistId(p.id)}
                  onToggleVisited={() => quickToggleVisited(p)}
                />
              ))}
              {!interestedNotVisited.length ? (
                <div className="empty">No items yet.</div>
              ) : null}
            </div>
          </Section>

          <Section
            title="Interested — Visited"
            subtitle="Visited and still in the running."
          >
            <div className="list">
              {interestedVisited.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  onQuickEdit={() => setQuickEditId(p.id)}
                  onOpenChecklist={() => setChecklistId(p.id)}
                  onToggleVisited={() => quickToggleVisited(p)}
                />
              ))}
              {!interestedVisited.length ? (
                <div className="empty">No items yet.</div>
              ) : null}
            </div>
          </Section>
        </div>

        <Section
          title="No Longer Interested"
          subtitle="Kept for reference (won’t rank)."
        >
          <div className="list">
            {notInterested.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                onQuickEdit={() => setQuickEditId(p.id)}
                onOpenChecklist={() => setChecklistId(p.id)}
                onToggleVisited={() => quickToggleVisited(p)}
              />
            ))}
            {!notInterested.length ? (
              <div className="empty">No items yet.</div>
            ) : null}
          </div>
        </Section>
      </main>
    </div>
  );
}
