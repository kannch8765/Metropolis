import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Resource, ResourceKind } from '@metropolis/schema';
import { ResourceMap } from './components/ResourceMap';

type View = 'resident' | 'admin';
type KindFilter = 'all' | ResourceKind;

const kindLabels: Record<KindFilter, string> = {
  all: 'All',
  japanese_class: 'Japanese classes',
  consultation: 'Consultation',
  cultural_event: 'Cultural events',
  community_space: 'Community spaces',
};

export default function App() {
  const [view, setView] = useState<View>('resident');
  const [resources, setResources] = useState<Resource[]>([]);
  const [kind, setKind] = useState<KindFilter>('all');
  const [freeOnly, setFreeOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/resources?limit=100')
      .then((response) => {
        if (!response.ok) throw new Error(`Resource request failed: ${response.status}`);
        return response.json() as Promise<{ resources: Resource[] }>;
      })
      .then((payload) => setResources(payload.resources))
      .catch(() => setResources([]));
  }, []);

  const visibleResources = useMemo(
    () => resources
      .filter((resource) => kind === 'all' || resource.kind === kind)
      .filter((resource) => !freeOnly || resource.costType === 'free'),
    [freeOnly, kind, resources],
  );

  const selectResource = useCallback((id: string) => setSelectedId(id), []);

  return (
    <main>
      <header className="topbar">
        <div>
          <span className="brand-mark">M</span>
          <strong>Metropolis</strong>
        </div>
        <nav aria-label="Primary navigation">
          <button className={view === 'resident' ? 'active' : ''} onClick={() => setView('resident')}>For residents</button>
          <button className={view === 'admin' ? 'active' : ''} onClick={() => setView('admin')}>For administrators</button>
        </nav>
      </header>

      {view === 'resident' ? (
        <div className="page-grid">
          <aside className="sidebar">
            <span className="eyebrow">Tokyo multicultural guide</span>
            <h1>A city that is easier to enter.</h1>
            <p>Explore verified Japanese classes, multilingual support, and international community events.</p>

            <div className="filter-panel" aria-label="Resource filters">
              <div className="chip-row">
                {(Object.keys(kindLabels) as KindFilter[]).map((value) => (
                  <button
                    key={value}
                    className={kind === value ? 'chip active' : 'chip'}
                    onClick={() => setKind(value)}
                  >
                    {kindLabels[value]}
                  </button>
                ))}
              </div>
              <label className="checkbox-row">
                <input type="checkbox" checked={freeOnly} onChange={(event) => setFreeOnly(event.target.checked)} />
                Free only
              </label>
            </div>

            <label className="agent-input">
              Ask in natural language
              <input placeholder="Free beginner Japanese class this weekend…" disabled />
              <small>Agent search comes after the structured filters are proven.</small>
            </label>

            <div className="resource-list">
              {visibleResources.map((resource) => (
                <article
                  key={resource.id}
                  className={selectedId === resource.id ? 'selected' : ''}
                  onClick={() => selectResource(resource.id)}
                >
                  <small>{kindLabels[resource.kind]}</small>
                  <h3>{resource.name}</h3>
                  <p>{resource.description}</p>
                  <div className="resource-meta">
                    <span>{resource.wardId}</span>
                    <span>{resource.costType ?? 'cost unknown'}</span>
                    <span>{resource.languages.join(', ') || 'language not specified'}</span>
                  </div>
                  <a href={resource.sourceUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                    View source
                  </a>
                </article>
              ))}
              {visibleResources.length === 0 && <p className="empty-state">No resources match these filters yet.</p>}
            </div>
          </aside>
          <ResourceMap resources={visibleResources} selectedId={selectedId} onSelect={selectResource} />
        </div>
      ) : (
        <section className="dashboard">
          <span className="eyebrow">Administrative view</span>
          <h1>See where support is abundant—and where it is missing.</h1>
          <div className="metric-grid">
            <article><strong>{resources.length}</strong><span>verified resources</span></article>
            <article><strong>{new Set(resources.flatMap((item) => item.languages)).size}</strong><span>languages represented</span></article>
            <article><strong>{new Set(resources.map((item) => item.wardId)).size}</strong><span>wards in current slice</span></article>
          </div>
          <div className="insight-panel">
            <h2>Analysis boundary</h2>
            <p>Coverage metrics are computed from open data. Gemini may explain those metrics, but never invent the underlying facts.</p>
          </div>
        </section>
      )}
    </main>
  );
}
