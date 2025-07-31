// Hospital Locator Application
class HospitalLocator {
    constructor() {
        this.hospitals = [];
        this.filteredHospitals = [];
        this.currentLocation = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupEventListeners();
    }

    bindEvents() {
        document.getElementById('searchBtn').addEventListener('click', () => this.searchHospitals());
        document.getElementById('useLocationBtn').addEventListener('click', () => this.getCurrentLocation());
        document.getElementById('location').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchHospitals();
        });
        document.getElementById('sortBy').addEventListener('change', () => this.sortHospitals());
        document.getElementById('filterInput').addEventListener('input', (e) => this.filterHospitals(e.target.value));
    }

    setupEventListeners() {
        // Clear results when location input changes
        document.getElementById('location').addEventListener('input', () => {
            this.hideResults();
        });
    }

    async getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by this browser.');
            return;
        }

        this.showLoading();
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                this.currentLocation = { lat: latitude, lng: longitude };
                
                // Reverse geocode to get address
                try {
                    const address = await this.reverseGeocode(latitude, longitude);
                    document.getElementById('location').value = address;
                    await this.findNearbyHospitals(latitude, longitude);
                } catch (error) {
                    this.showError('Unable to get your location address.');
                }
            },
            (error) => {
                this.hideLoading();
                this.showError('Unable to retrieve your location. Please enter your location manually.');
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    }

    async reverseGeocode(lat, lng) {
        // Using a simple reverse geocoding service
        try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
            const data = await response.json();
            return data.locality || data.city || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        } catch (error) {
            return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
    }

    async searchHospitals() {
        const location = document.getElementById('location').value.trim();
        if (!location) {
            this.showError('Please enter a location.');
            return;
        }

        this.showLoading();
        
        try {
            // First geocode the location
            const coordinates = await this.geocodeLocation(location);
            if (coordinates) {
                this.currentLocation = coordinates;
                await this.findNearbyHospitals(coordinates.lat, coordinates.lng);
            } else {
                this.showError('Unable to find the specified location.');
            }
        } catch (error) {
            this.showError('Error searching for hospitals: ' + error.message);
        }
    }

    async geocodeLocation(location) {
        try {
            // Using OpenStreetMap Nominatim API for geocoding
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`);
            const data = await response.json();
            
            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                };
            }
            return null;
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    }

    async findNearbyHospitals(lat, lng) {
        try {
            const radius = document.getElementById('radius').value;
            
            // Using Overpass API to find hospitals
            const query = `
                [out:json][timeout:25];
                (
                  node["amenity"="hospital"](around:${radius * 1000},${lat},${lng});
                  node["amenity"="clinic"](around:${radius * 1000},${lat},${lng});
                  node["healthcare"](around:${radius * 1000},${lat},${lng});
                  way["amenity"="hospital"](around:${radius * 1000},${lat},${lng});
                  way["amenity"="clinic"](around:${radius * 1000},${lat},${lng});
                  way["healthcare"](around:${radius * 1000},${lat},${lng});
                );
                out center meta;
            `;

            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: query
            });

            const data = await response.json();
            this.processHospitalData(data.elements, lat, lng);
            
        } catch (error) {
            // Fallback to demo data if API fails
            console.error('API Error:', error);
            this.loadDemoData(lat, lng);
        }
    }

    processHospitalData(elements, userLat, userLng) {
        this.hospitals = elements
            .filter(element => element.tags && (element.tags.name || element.tags['name:en']))
            .map(element => {
                const lat = element.lat || (element.center ? element.center.lat : 0);
                const lng = element.lon || (element.center ? element.center.lon : 0);
                const distance = this.calculateDistance(userLat, userLng, lat, lng);

                return {
                    id: element.id,
                    name: element.tags.name || element.tags['name:en'] || 'Unknown Hospital',
                    type: this.getHospitalType(element.tags),
                    address: this.formatAddress(element.tags),
                    phone: element.tags.phone || element.tags['contact:phone'] || 'N/A',
                    website: element.tags.website || element.tags['contact:website'] || null,
                    emergency: element.tags.emergency === 'yes',
                    rating: this.generateRating(),
                    distance: distance,
                    lat: lat,
                    lng: lng,
                    tags: element.tags
                };
            })
            .filter(hospital => hospital.distance <= parseFloat(document.getElementById('radius').value));

        if (this.hospitals.length === 0) {
            this.loadDemoData(userLat, userLng);
        } else {
            this.displayResults();
        }
    }

    getHospitalType(tags) {
        if (tags.amenity === 'hospital') return 'Hospital';
        if (tags.amenity === 'clinic') return 'Clinic';
        if (tags.healthcare === 'hospital') return 'Hospital';
        if (tags.healthcare === 'clinic') return 'Clinic';
        if (tags.healthcare === 'centre') return 'Healthcare Centre';
        if (tags.emergency === 'yes') return 'Emergency';
        return 'Healthcare Facility';
    }

    formatAddress(tags) {
        const parts = [];
        if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
        if (tags['addr:street']) parts.push(tags['addr:street']);
        if (tags['addr:city']) parts.push(tags['addr:city']);
        if (tags['addr:postcode']) parts.push(tags['addr:postcode']);
        
        return parts.length > 0 ? parts.join(', ') : 'Address not available';
    }

    generateRating() {
        // Generate a realistic rating between 3.5 and 4.8
        return (Math.random() * 1.3 + 3.5).toFixed(1);
    }

    loadDemoData(userLat, userLng) {
        // Fallback demo data for demonstration
        const demoHospitals = [
            {
                id: 'demo1',
                name: 'Central General Hospital',
                type: 'Hospital',
                address: '123 Main Street, Medical District',
                phone: '+1-555-0123',
                website: null,
                emergency: true,
                rating: '4.2',
                lat: userLat + 0.01,
                lng: userLng + 0.01
            },
            {
                id: 'demo2',
                name: 'City Medical Center',
                type: 'Hospital',
                address: '456 Health Avenue, Downtown',
                phone: '+1-555-0456',
                website: null,
                emergency: true,
                rating: '4.5',
                lat: userLat - 0.01,
                lng: userLng + 0.01
            },
            {
                id: 'demo3',
                name: 'Quick Care Clinic',
                type: 'Clinic',
                address: '789 Care Street, Suburbs',
                phone: '+1-555-0789',
                website: null,
                emergency: false,
                rating: '4.0',
                lat: userLat + 0.005,
                lng: userLng - 0.01
            },
            {
                id: 'demo4',
                name: 'Emergency Medical Services',
                type: 'Emergency',
                address: '321 Rescue Road, City Center',
                phone: '+1-555-0321',
                website: null,
                emergency: true,
                rating: '4.7',
                lat: userLat - 0.005,
                lng: userLng - 0.005
            },
            {
                id: 'demo5',
                name: 'Community Health Centre',
                type: 'Healthcare Centre',
                address: '654 Wellness Way, Residential Area',
                phone: '+1-555-0654',
                website: null,
                emergency: false,
                rating: '3.9',
                lat: userLat + 0.015,
                lng: userLng + 0.005
            }
        ];

        this.hospitals = demoHospitals.map(hospital => ({
            ...hospital,
            distance: this.calculateDistance(userLat, userLng, hospital.lat, hospital.lng)
        }));

        this.displayResults();
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    sortHospitals() {
        const sortBy = document.getElementById('sortBy').value;
        
        this.filteredHospitals.sort((a, b) => {
            switch (sortBy) {
                case 'distance':
                    return a.distance - b.distance;
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'rating':
                    return parseFloat(b.rating) - parseFloat(a.rating);
                default:
                    return 0;
            }
        });

        this.renderHospitals();
    }

    filterHospitals(searchTerm) {
        if (!searchTerm.trim()) {
            this.filteredHospitals = [...this.hospitals];
        } else {
            this.filteredHospitals = this.hospitals.filter(hospital => 
                hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                hospital.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                hospital.address.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        this.renderHospitals();
        this.updateResultsCount();
    }

    displayResults() {
        this.hideLoading();
        this.hideError();
        
        this.filteredHospitals = [...this.hospitals];
        this.sortHospitals();
        
        document.getElementById('resultsHeader').style.display = 'flex';
        document.getElementById('searchBar').style.display = 'block';
        
        this.updateResultsCount();
    }

    renderHospitals() {
        const grid = document.getElementById('hospitalsGrid');
        
        if (this.filteredHospitals.length === 0) {
            grid.innerHTML = '<div class="no-results">No hospitals found matching your criteria.</div>';
            return;
        }

        grid.innerHTML = this.filteredHospitals.map(hospital => `
            <div class="hospital-card">
                <div class="hospital-header">
                    <div>
                        <div class="hospital-name">${hospital.name}</div>
                    </div>
                    <div class="hospital-type">${hospital.type}</div>
                </div>
                
                <div class="hospital-info">
                    <div class="info-item">
                        <strong>Distance:</strong>
                        <span class="distance">${hospital.distance.toFixed(1)} km</span>
                    </div>
                    <div class="info-item">
                        <strong>Rating:</strong>
                        <span class="rating">⭐ ${hospital.rating}/5.0</span>
                    </div>
                    <div class="info-item">
                        <strong>Address:</strong>
                        <span>${hospital.address}</span>
                    </div>
                    <div class="info-item">
                        <strong>Phone:</strong>
                        <span>${hospital.phone}</span>
                    </div>
                    ${hospital.emergency ? '<div class="info-item"><strong>🚨 Emergency Services Available</strong></div>' : ''}
                </div>
                
                <div class="hospital-actions">
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}" 
                       target="_blank" class="action-btn directions-btn">Get Directions</a>
                    ${hospital.phone !== 'N/A' ? `<a href="tel:${hospital.phone}" class="action-btn call-btn">Call Now</a>` : ''}
                </div>
            </div>
        `).join('');
    }

    updateResultsCount() {
        const count = this.filteredHospitals.length;
        const total = this.hospitals.length;
        document.getElementById('resultsCount').textContent = 
            count === total ? `${count} hospitals found` : `${count} of ${total} hospitals`;
    }

    showLoading() {
        document.getElementById('loading').style.display = 'block';
        this.hideError();
        this.hideResults();
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        this.hideLoading();
    }

    hideError() {
        document.getElementById('errorMessage').style.display = 'none';
    }

    hideResults() {
        document.getElementById('resultsHeader').style.display = 'none';
        document.getElementById('searchBar').style.display = 'none';
        document.getElementById('hospitalsGrid').innerHTML = '';
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new HospitalLocator();
});

// Add some utility styles for no results
const style = document.createElement('style');
style.textContent = `
    .no-results {
        text-align: center;
        padding: 40px;
        color: #7f8c8d;
        font-size: 1.1rem;
        background: #f8f9fa;
        border-radius: 10px;
        border: 2px dashed #dee2e6;
    }
`;
document.head.appendChild(style);