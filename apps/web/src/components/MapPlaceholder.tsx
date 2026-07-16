export function MapPlaceholder() {
  return (
    <section className="map-shell" aria-label="Map placeholder">
      <div className="map-grid" />
      <div className="map-copy">
        <span className="eyebrow">Resident map</span>
        <h2>Find support and community nearby</h2>
        <p>MapLibre will render verified resources returned by the Worker API.</p>
      </div>
      <span className="pin pin-a">日</span>
      <span className="pin pin-b">文</span>
      <span className="pin pin-c">相</span>
    </section>
  );
}
