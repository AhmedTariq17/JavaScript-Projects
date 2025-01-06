let locationHistory = []; // Array to store the history of locations
let apiKey; // Global variable for storing the API key

// Fetch API key from config.json
fetch('config.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load config.json'); // Error if config.json is not found
        }
        return response.json();
    })
    .then(config => {
        apiKey = config.WEATHER_API_KEY; // Assign the API key from config.json
        console.log('API key loaded successfully.');
    })
    .catch(error => {
        console.error('Error loading API key:', error); // Log the error if config.json cannot be loaded
        alert('Failed to load API key. Please check config.json.');
    });

// Initialize the map and set its default view to coordinates [0, 0] with zoom level 2
const map = L.map('map').setView([0, 0], 2);

// Load and display the OSM tile layer
const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map); // Add OSM layer to the map

// Load and display the Satellite tile layer
const satelliteLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenTopoMap contributors'
});

// Define the base map layers for switching
const baseMaps = {
    "OSM": osmLayer, // OpenStreetMap layer
    "Satellite": satelliteLayer // Satellite view layer
};

// Add a layer control to switch between OSM and Satellite views
L.control.layers(baseMaps).addTo(map);

// Add a zoom control to the map at the top-right position
L.control.zoom({ position: 'topright' }).addTo(map);

// Add a geocoder control for location search
const geocoder = L.Control.Geocoder.nominatim();
L.Control.geocoder({
    geocoder: geocoder,
    position: 'topleft', // Position of the geocoder control
    placeholder: 'Search for a location...', // Placeholder text in the search bar
    errorMessage: 'Nothing found.' // Message displayed if no results are found
}).addTo(map);

// Event listener for the search bar functionality
document.getElementById('locationInput').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') { // If the Enter key is pressed
        const query = this.value; // Get the user's input
        geocoder.geocode(query, function (results) {
            if (results && results.length > 0) {
                const result = results[0]; // Get the first result
                map.setView(result.center, 16); // Center the map on the result
                L.marker(result.center).addTo(map)
                    .bindPopup(result.name).openPopup(); // Add a marker with a popup
                locationHistory.push(result.center); // Add the location to the history
                updateLocationHistory(); // Update the location history display
            } else {
                alert('Location not found.'); // Alert the user if no results are found
            }
        });
    }
});

// Event listener for the "Locate Me" button
document.getElementById('locateBtn').addEventListener('click', function () {
    if (confirm("Would you like to share your current location?")) { // Ask for user confirmation
        locateUser(); // Trigger the locate user function
    } else {
        alert("You can still use the map by manually adding markers.");
    }
});

// Function to locate the user's current position
function locateUser() {
    map.locate({ setView: true, maxZoom: 16 }); // Locate the user and set the map view
}

// Event handler for when the user's location is found
function onLocationFound(e) {
    const radius = e.accuracy; // Accuracy radius of the location
    L.marker(e.latlng).addTo(map)
        .bindPopup(`You are within ${radius} meters from this point`).openPopup(); // Marker with popup
    L.circle(e.latlng, radius).addTo(map); // Add a circle showing the accuracy radius
    locationHistory.push(e.latlng); // Add the location to the history
    updateLocationHistory(); // Update the location history display
    fetchWeather(e.latlng.lat, e.latlng.lng); // Fetch weather data for the location
}

// Event handler for when location access is denied or an error occurs
function onLocationError(e) {
    alert("Location access denied. Please enable location services to use this feature.");
}

// Register event listeners for location events
map.on('locationfound', onLocationFound);
map.on('locationerror', onLocationError);

// Function to add a custom marker manually
function addCustomMarker() {
    const lat = prompt("Enter latitude:"); // Prompt the user for latitude
    const lng = prompt("Enter longitude:"); // Prompt the user for longitude
    const message = prompt("Enter a message for the marker:"); // Prompt for a marker message
    if (lat && lng && message) {
        const marker = L.marker([parseFloat(lat), parseFloat(lng)]).addTo(map)
            .bindPopup(message).openPopup(); // Add marker with user-provided data
        locationHistory.push({ lat: parseFloat(lat), lng: parseFloat(lng) }); // Add to history
        updateLocationHistory(); // Update history display
        fetchWeather(parseFloat(lat), parseFloat(lng)); // Fetch weather for the custom marker
    } else {
        alert("Please enter valid latitude, longitude, and message.");
    }
}

// Function to update the location history display in the sidebar
function updateLocationHistory() {
    const historyList = document.getElementById('locationHistory');
    historyList.innerHTML = ''; // Clear the existing history
    locationHistory.forEach(loc => {
        const listItem = document.createElement('li');
        listItem.textContent = `Lat: ${loc.lat}, Lng: ${loc.lng}`; // Display latitude and longitude
        historyList.appendChild(listItem);
    });
}

// Function to fetch weather data for a given latitude and longitude
async function fetchWeather(lat, lon) {
    if (!apiKey) { // Check if the API key is loaded
        console.error('API key not loaded. Please ensure config.json is properly configured.');
        return;
    }
    try {
        const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}`);
        if (!response.ok) throw new Error('Failed to fetch weather data');
        const data = await response.json(); // Parse the weather data
        document.getElementById('weather').textContent = `${data.current.condition.text}, ${data.current.temp_c}°C`;
    } catch (error) {
        console.error('Weather data error:', error);
        document.getElementById('weather').textContent = 'Failed to fetch weather data.';
    }
}

// Function to update the current date and time in the sidebar
function updateTime() {
    const now = new Date();
    document.getElementById('currentTime').textContent = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
}

// Update the time every second
setInterval(updateTime, 1000);

// Event listener for map clicks to add a marker and fetch weather
map.on('click', function (e) {
    const { lat, lng } = e.latlng;
    const marker = L.marker([lat, lng]).addTo(map)
        .bindPopup(`Weather info loading...`).openPopup();
    fetchWeather(lat, lng).then(() => {
        marker.setPopupContent(document.getElementById('weather').textContent);
    });
});
