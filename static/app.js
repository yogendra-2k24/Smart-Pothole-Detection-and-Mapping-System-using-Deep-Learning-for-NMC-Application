// Initialize Map
const map = L.map('map').setView([21.1458, 79.0882], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// Define custom icons
const createIcon = (color) => {
    return new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
};

const icons = {
    'reported': createIcon('red'),
    'in_progress': createIcon('gold'),
    'fixed': createIcon('green')
};

let markersMap = new Map();
let currentDataHash = '';

function parseCoords(locationStr) {
    if (!locationStr) return [21.1458, 79.0882];
    const parts = locationStr.split(',');
    if (parts.length === 2) {
        const lat = parseFloat(parts[0].replace('N', '').trim());
        const lon = parseFloat(parts[1].replace('E', '').trim());
        if (!isNaN(lat) && !isNaN(lon)) {
            return [lat, lon];
        }
    }
    return [21.1458, 79.0882];
}

function updateStatus(id, newStatus) {
    fetch('/update_status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: id, status: newStatus }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Force immediate refresh to feel responsive
            fetchPotholeData();
        }
    });
}

function timeSince(dateObj) {
    const seconds = Math.floor((new Date() - dateObj) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " Y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " M";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " m";
    return Math.floor(seconds) + " s";
}

function renderPotholes(data) {
    const container = document.getElementById('pothole-list');
    container.innerHTML = '';
    
    let total = data.length;
    let fixed = data.filter(p => p.status === 'fixed').length;
    let prog = data.filter(p => p.status === 'in_progress').length;
    let reported = data.filter(p => p.status === 'reported').length;

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-fixed').innerText = fixed;
    document.getElementById('stat-prog').innerText = prog;
    document.getElementById('stat-reported').innerText = reported;

    // Clear obsolete map markers if data was reset
    const newDataIds = new Set(data.map(p => p.id));
    for (let [id, markerObj] of markersMap.entries()) {
        if (!newDataIds.has(id)) {
            map.removeLayer(markerObj.marker);
            markersMap.delete(id);
        }
    }

    data.forEach(pothole => {
        // Create List Card
        const card = document.createElement('div');
        card.className = 'pothole-card';
        card.onclick = () => {
            const coords = parseCoords(pothole.location);
            map.flyTo(coords, 18);
        };
        
        let statusLabel = pothole.status === 'in_progress' ? 'In Progress' : pothole.status;
        let timeString = timeSince(new Date(pothole.timestamp * 1000)) + " ago";

        card.innerHTML = `
            <div class="card-img-container">
                <img src="/${pothole.image_path}" alt="Pothole ${pothole.id}">
                <div class="status-badge ${pothole.status}">${statusLabel}</div>
            </div>
            <div class="card-content">
                <div class="card-meta">
                    <span class="meta-item"><i class="fa-solid fa-location-dot"></i> ${pothole.location}</span>
                    <span class="meta-item"><i class="fa-regular fa-clock"></i> ${timeString}</span>
                </div>
                <div class="card-actions">
                    ${pothole.status !== 'fixed' ? `<button class="action-btn fix-btn" onclick="event.stopPropagation(); updateStatus(${pothole.id}, 'fixed')"><i class="fa-solid fa-check"></i> Fix</button>` : ''}
                    ${pothole.status === 'reported' ? `<button class="action-btn prog-btn" onclick="event.stopPropagation(); updateStatus(${pothole.id}, 'in_progress')"><i class="fa-solid fa-person-digging"></i> In Progress</button>` : ''}
                </div>
            </div>
        `;
        container.appendChild(card);

        // Map Marker Logic
        const coords = parseCoords(pothole.location);
        
        // If marker already exists, check if status changed to update icon
        if (markersMap.has(pothole.id)) {
            const existingMarker = markersMap.get(pothole.id);
            if (existingMarker.status !== pothole.status) {
                existingMarker.marker.setIcon(icons[pothole.status]);
                existingMarker.status = pothole.status;
            }
        } else {
            // Create new marker
            const marker = L.marker(coords, {icon: icons[pothole.status]}).addTo(map);
            marker.bindPopup(`
                <div style="text-align: center;">
                    <img src="/${pothole.image_path}" width="150" style="border-radius: 8px; margin-bottom: 5px;">
                    <br><b>ID:</b> ${pothole.id}
                    <br><b>Status:</b> ${statusLabel}
                </div>
            `);
            markersMap.set(pothole.id, { marker: marker, status: pothole.status });
            
            // If it's a completely new pothole, maybe panning isn't ideal for every refresh,
            // but we can optionally pan to the newest one on first load.
        }
    });

    // Handle map view initialization
    if(data.length > 0 && !window.mapInitialized) {
        const firstCoords = parseCoords(data[0].location); // mostly newest if sorted
        map.setView(firstCoords, 16);
        window.mapInitialized = true;
    }
}

function fetchPotholeData() {
    fetch('/get_potholes')
        .then(response => response.json())
        .then(data => {
            const newHash = JSON.stringify(data);
            if(newHash !== currentDataHash) {
                currentDataHash = newHash;
                renderPotholes(data);
            }
        })
        .catch(err => console.error("Error fetching data: ", err));
}

// Initial fetch and start polling
fetchPotholeData();
setInterval(fetchPotholeData, 2000); // Poll every 2 seconds
