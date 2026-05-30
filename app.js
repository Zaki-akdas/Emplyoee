// --- CONFIGURATION ---
// Your live Google Script URL
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzAsikucAP5S5jHioriA0KN_lDjB4GfXz6MeEt86sMbs7UGlwSxOb9k9iQFh1sOCRwgHg/exec"; 

const OFFICE_LAT = 23.2599; // Bhopal Latitude
const OFFICE_LNG = 77.4126; // Bhopal Longitude
const ALLOWED_RADIUS_KM = 5; 

// --- DOM ELEMENTS ---
const statusMsg = document.getElementById('status-msg');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const empNameInput = document.getElementById('employee-name');

let currentLocationStatus = "Checking...";

// --- GEOLOCATION LOGIC ---
// Calculates the distance between two coordinates in kilometers
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; 
}

if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const distance = getDistanceFromLatLonInKm(OFFICE_LAT, OFFICE_LNG, position.coords.latitude, position.coords.longitude);
            
            if (distance <= ALLOWED_RADIUS_KM) {
                currentLocationStatus = "Verified";
                statusMsg.textContent = "Location verified. You are within the office premises.";
                statusMsg.style.color = "#27ae60";
                btnLogin.disabled = false;
                btnLogout.disabled = false;
            } else {
                currentLocationStatus = `Failed (${distance.toFixed(1)}km away)`;
                statusMsg.textContent = `You are ${distance.toFixed(1)}km away. You must be at the office.`;
                statusMsg.style.color = "#e74c3c";
            }
        },
        (error) => {
            currentLocationStatus = "Location Access Denied";
            statusMsg.textContent = "Please allow location access to log attendance.";
            statusMsg.style.color = "#e74c3c";
        }
    );
} else {
    statusMsg.textContent = "Geolocation is not supported by your browser.";
    statusMsg.style.color = "#e74c3c";
}

// --- SEND DATA TO GOOGLE SHEETS ---
async function sendToDatabase(name, action) {
    // Change button text to show it is loading
    const originalBtnText = action === 'Log In' ? btnLogin.innerText : btnLogout.innerText;
    if(action === 'Log In') btnLogin.innerText = "Sending...";
    if(action === 'Log Out') btnLogout.innerText = "Sending...";
    
    const data = {
        name: name,
        action: action,
        locationStatus: currentLocationStatus
    };

    try {
        // Send the POST request to your Google Script URL
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(data),
            // 'no-cors' can be used if you still get strict CORS errors, but standard POST is better for receiving the success response
        });

        const result = await response.json();
        
        if(result.result === "success") {
            alert(`Success! ${name} ${action} recorded to the Admin Dashboard.`);
            empNameInput.value = ''; // Clear the input
        } else {
            alert("Error saving data. Please try again.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Network error. Please check your connection or CORS settings.");
    } finally {
        // Reset button text
        if(action === 'Log In') btnLogin.innerText = originalBtnText;
        if(action === 'Log Out') btnLogout.innerText = originalBtnText;
    }
}

// --- BUTTON CLICK EVENTS ---
btnLogin.addEventListener('click', () => {
    const name = empNameInput.value.trim();
    if (name) sendToDatabase(name, 'Log In');
    else alert("Please enter your name.");
});

btnLogout.addEventListener('click', () => {
    const name = empNameInput.value.trim();
    if (name) sendToDatabase(name, 'Log Out');
    else alert("Please enter your name.");
});