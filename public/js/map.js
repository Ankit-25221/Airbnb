// MapTiler interactive map for listing show page
const mapEl = document.getElementById('map');
const mapToken = mapEl ? mapEl.getAttribute('data-token') : null;
const listingTitle = mapEl ? mapEl.getAttribute('data-title') : '';
let listingCoords = null;
try {
    const rawCoords = mapEl ? mapEl.getAttribute('data-coords') : null;
    listingCoords = rawCoords ? JSON.parse(rawCoords) : null;
} catch (e) {
    console.error("Error parsing map coords:", e);
}

const isValidCoords = mapToken && 
                      listingCoords && 
                      Array.isArray(listingCoords) && 
                      listingCoords.length === 2 && 
                      typeof listingCoords[0] === 'number' && 
                      typeof listingCoords[1] === 'number';

if (isValidCoords) {
    maptilersdk.config.apiKey = mapToken;

    // Use Hybrid style (satellite + road labels) for richer visual
    const map = new maptilersdk.Map({
        container: 'map',
        style: maptilersdk.MapStyle.HYBRID,
        center: listingCoords,
        zoom: 11,
        pitch: 35,          // 3D tilt angle
        bearing: -10,       // slight rotation
        navigationControl: false,
        attributionControl: true,
    });

    // Navigation controls (zoom + compass)
    map.addControl(new maptilersdk.NavigationControl(), 'top-right');

    // Fullscreen toggle
    map.addControl(new maptilersdk.FullscreenControl(), 'top-right');

    // Terrain 3D control
    map.addControl(
        new maptilersdk.TerrainControl({
            source: 'terrain',
            exaggeration: 1.5,
        }),
        'top-right'
    );

    // Smooth fly-in on load
    map.on('load', () => {
        map.flyTo({
            center: listingCoords,
            zoom: 13,
            pitch: 40,
            bearing: -15,
            duration: 2000,
            essential: true,
        });
    });

    // Rich marker popup
    new maptilersdk.Marker({ color: "#FF385C", scale: 1.2 })
        .setLngLat(listingCoords)
        .setPopup(
            new maptilersdk.Popup({ offset: 30, maxWidth: '220px' }).setHTML(`
                <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 0.25rem;">
                    <strong style="color: #222; font-size: 0.9rem;">${listingTitle}</strong>
                    <p style="margin: 0.3rem 0 0; font-size: 0.75rem; color: #717171;">
                        <i class="fa-solid fa-location-dot" style="color:#FF385C; margin-right:4px;"></i>
                        Exact location after booking
                    </p>
                </div>
            `)
        )
        .addTo(map);
} else {
    // If no coordinates, hide the map container gracefully
    const mapEl = document.getElementById('map');
    if (mapEl) {
        const mapSection = mapEl.closest('.wl-map-section');
        if (mapSection) mapSection.style.display = 'none';
    }
}
