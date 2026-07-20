import type { Marker } from 'maplibre-gl';
import type { Resource } from '@metropolis/schema';

export function popupContent(resource: Resource): HTMLElement {
  const root = document.createElement('div');
  root.className = 'map-popup';

  const kind = document.createElement('small');
  kind.textContent = resource.kind.replaceAll('_', ' ');
  root.appendChild(kind);

  const title = document.createElement('strong');
  title.textContent = resource.name;
  root.appendChild(title);

  const detail = document.createElement('span');
  detail.textContent = `${resource.wardId} · ${resource.languages.join(', ') || 'language not specified'}`;
  root.appendChild(detail);

  const sourceLink = document.createElement('a');
  sourceLink.textContent = 'View source';
  sourceLink.href = resource.sourceUrl;
  sourceLink.target = '_blank';
  sourceLink.rel = 'noreferrer';
  root.appendChild(sourceLink);

  return root;
}

export function openMarkerPopup(marker: Pick<Marker, 'getPopup' | 'togglePopup'>): void {
  const popup = marker.getPopup();
  if (!popup || !popup.isOpen()) marker.togglePopup();
}
