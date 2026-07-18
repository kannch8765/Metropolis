import { useEffect, useRef } from 'react';
import maplibregl, { type Map as MapLibreMap, type Marker } from 'maplibre-gl';
import type { Resource } from '@metropolis/schema';

const markerColors: Record<Resource['kind'], string> = {
  japanese_class: '#a34b2b',
  consultation: '#c3922f',
  cultural_event: '#6554a4',
  community_space: '#215a45',
};

type ResourceMapProps = {
  resources: Resource[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function popupContent(resource: Resource): HTMLElement {
  const root = document.createElement('div');
  root.className = 'map-popup';

  const kind = document.createElement('small');
  kind.textContent = resource.kind.replaceAll('_', ' ');
  root.append(kind);

  const title = document.createElement('strong');
  title.textContent = resource.name;
  root.append(title);

  const detail = document.createElement('span');
  detail.textContent = `${resource.wardId} · ${resource.languages.join(', ') || 'language not specified'}`;
  root.append(detail);

  return root;
}

export function ResourceMap({ resources, selectedId, onSelect }: ResourceMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [139.70514, 35.7509],
      zoom: 12.3,
      attributionControl: true,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    return () => {
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const marker of markersRef.current.values()) marker.remove();
    markersRef.current.clear();

    for (const resource of resources) {
      const marker = new maplibregl.Marker({ color: markerColors[resource.kind] })
        .setLngLat([resource.longitude, resource.latitude])
        .setPopup(new maplibregl.Popup({ offset: 28 }).setDOMContent(popupContent(resource)))
        .addTo(map);

      marker.getElement().setAttribute('aria-label', resource.name);
      marker.getElement().addEventListener('click', () => onSelect(resource.id));
      markersRef.current.set(resource.id, marker);
    }

    if (resources.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      for (const resource of resources) bounds.extend([resource.longitude, resource.latitude]);
      map.fitBounds(bounds, { padding: 90, maxZoom: 14, duration: 0 });
    } else if (resources.length === 1) {
      map.jumpTo({ center: [resources[0].longitude, resources[0].latitude], zoom: 14 });
    }
  }, [resources, onSelect]);

  useEffect(() => {
    if (!selectedId) return;
    const resource = resources.find((item) => item.id === selectedId);
    const marker = markersRef.current.get(selectedId);
    if (!resource || !marker || !mapRef.current) return;

    mapRef.current.flyTo({
      center: [resource.longitude, resource.latitude],
      zoom: Math.max(mapRef.current.getZoom(), 14),
      essential: true,
    });
    marker.togglePopup();
  }, [resources, selectedId]);

  return (
    <section className="map-shell" aria-label="Map of multicultural resources">
      <div ref={containerRef} className="map-canvas" />
      <div className="map-badge">
        <span className="eyebrow">Live vertical slice</span>
        <strong>{resources.length} verified resources</strong>
      </div>
    </section>
  );
}
