import { useEffect, useState } from 'react';
import type { Resource } from '@metropolis/schema';
import { MapPlaceholder } from './components/MapPlaceholder';

type View = 'resident' | 'admin';

export default function App() {
  const [view, setView] = useState<View>('resident');
  const [resources, setResources] = useState<Resource[]>([]);

  useEffect(() => {
    fetch('/api/resources')
      .then((response) => response.json() as Promise<{ resources: Resource[] }>)
      .then((payload) => setResources(payload.resources))
      .catch(() => setResources([]));
  }, []);

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
            <p>Explore Japanese classes, multilingual consultation, and international community events.</p>
            <label>
              Ask in natural language
              <input placeholder="Free beginner Japanese class this weekend…" disabled />
            </label>
            <div className="resource-list">
              {resources.map((resource) => (
                <article key={resource.id}>
                  <small>{resource.kind.replace('_', ' ')}</small>
                  <h3>{resource.name}</h3>
                  <p>{resource.wardId} · {resource.languages.join(', ')}</p>
                </article>
              ))}
            </div>
          </aside>
          <MapPlaceholder />
        </div>
      ) : (
        <section className="dashboard">
          <span className="eyebrow">Administrative view</span>
          <h1>See where support is abundant—and where it is missing.</h1>
          <div className="metric-grid">
            <article><strong>{resources.length}</strong><span>seed resources</span></article>
            <article><strong>{new Set(resources.flatMap((item) => item.languages)).size}</strong><span>languages covered</span></article>
            <article><strong>23</strong><span>wards planned</span></article>
          </div>
          <div className="insight-panel">
            <h2>Analysis boundary</h2>
            <p>Metrics will be precomputed from open data. Gemini will explain those metrics, never invent them.</p>
          </div>
        </section>
      )}
    </main>
  );
}
