import assert from 'node:assert/strict';
import { openMarkerPopup, popupContent } from '../apps/web/src/components/resourceMapUtils.ts';

class FakeElement {
  children = [];
  className = '';
  textContent = '';
  href = '';
  target = '';
  rel = '';

  appendChild(child) {
    this.children.push(child);
    return child;
  }
}

globalThis.document = {
  createElement: () => new FakeElement(),
};

const resource = {
  id: 'fixture-resource',
  kind: 'japanese_class',
  name: 'Japanese class',
  description: 'Fixture',
  latitude: 35.75,
  longitude: 139.7,
  wardId: 'itabashi',
  languages: ['ja'],
  audiences: [],
  accessibilityTags: [],
  startAt: null,
  endAt: null,
  costType: 'free',
  sourceUrl: 'https://example.org/source',
  sourceUpdatedAt: '2026-07-18',
};

const popup = popupContent(resource);
const sourceLink = popup.children.at(-1);
assert.equal(sourceLink.textContent, 'View source');
assert.equal(sourceLink.href, resource.sourceUrl);
assert.equal(sourceLink.target, '_blank');
assert.equal(sourceLink.rel, 'noreferrer');

let toggleCount = 0;
let popupOpen = false;
const marker = {
  getPopup: () => ({ isOpen: () => popupOpen }),
  togglePopup: () => {
    toggleCount += 1;
    popupOpen = !popupOpen;
  },
};

// Marker#setPopup opens the popup before the marker's onSelect callback runs.
marker.togglePopup();
openMarkerPopup(marker);
assert.equal(toggleCount, 1, 'marker click must not immediately close its popup');
assert.equal(popupOpen, true);

// Card-to-map selection opens a closed popup exactly once.
popupOpen = false;
openMarkerPopup(marker);
assert.equal(toggleCount, 2, 'card selection must open a closed popup');
assert.equal(popupOpen, true);

console.log('PASS: popup source link and marker popup open-state harness');
