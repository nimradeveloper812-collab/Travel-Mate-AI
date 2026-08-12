const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
let token = localStorage.getItem('token') || '';
let currentUser = null;
let currentItineraryData = null; // Stash generated itinerary to allow saving later

// ----------------------------------------------------
// Core Initialization & Navigation
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupAuth();
  checkExistingSession();
  
  // Set default date values in forms
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const checkinInput = document.getElementById('hotel-checkin');
  const checkoutInput = document.getElementById('hotel-checkout');
  if (checkinInput) checkinInput.value = today;
  if (checkoutInput) checkoutInput.value = nextWeek;
  
  const flightDateInput = document.getElementById('flight-date');
  if (flightDateInput) flightDateInput.value = today;

  const planStart = document.getElementById('plan-start-date');
  const planEnd = document.getElementById('plan-end-date');
  if (planStart) planStart.value = today;
  if (planEnd) planEnd.value = nextWeek;
});

function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-item');
  const panes = document.querySelectorAll('.pane-view');
  const title = document.getElementById('view-title');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = link.getAttribute('data-view');
      
      navLinks.forEach(n => n.classList.remove('active'));
      link.classList.add('active');

      panes.forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === `view-${targetView}`) {
          pane.classList.add('active');
        }
      });

      title.textContent = link.querySelector('span').textContent;
      
      // Load specific view data if logged in
      if (targetView === 'dashboard') {
        loadDashboardStats();
      } else if (targetView === 'saved-trips') {
        loadSavedTrips();
      }
    });
  });
}

// Helper to check headers
function getHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ----------------------------------------------------
// Authentication Handlers
// ----------------------------------------------------
function setupAuth() {
  const authModal = document.getElementById('auth-modal');
  const showModalBtn = document.getElementById('show-auth-modal-btn');
  const closeModalBtn = document.getElementById('close-auth-modal');
  const authForm = document.getElementById('auth-form');
  const toggleLink = document.getElementById('auth-toggle-link');
  const togglePrompt = document.getElementById('auth-toggle-prompt');
  const modalTitle = document.getElementById('modal-mode-title');
  const nameGroup = document.getElementById('signup-name-group');
  const submitBtn = document.getElementById('auth-submit-btn');
  const logoutBtn = document.getElementById('logout-btn');

  let mode = 'login'; // 'login' or 'signup'

  if (showModalBtn) {
    showModalBtn.addEventListener('click', () => {
      authModal.classList.remove('hidden');
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      authModal.classList.add('hidden');
    });
  }

  if (toggleLink) {
    toggleLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (mode === 'login') {
        mode = 'signup';
        modalTitle.textContent = 'Create Account';
        togglePrompt.textContent = 'Already have an account?';
        toggleLink.textContent = 'Sign In';
        nameGroup.classList.remove('hidden');
        submitBtn.textContent = 'Register';
      } else {
        mode = 'login';
        modalTitle.textContent = 'Sign In';
        togglePrompt.textContent = "Don't have an account?";
        toggleLink.textContent = 'Register';
        nameGroup.classList.add('hidden');
        submitBtn.textContent = 'Sign In';
      }
    });
  }

  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value;
      const password = document.getElementById('auth-password').value;
      const name = document.getElementById('auth-name').value;

      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
      const body = mode === 'login' 
        ? { email, password }
        : { name, email, password };

      try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.detail || 'Authentication failed');
        }

        const data = await response.json();
        
        if (mode === 'login') {
          token = data.access_token;
          localStorage.setItem('token', token);
          authModal.classList.add('hidden');
          await checkExistingSession();
        } else {
          // Signed up successfully, switch to login mode
          alert('Sign up successful! Please log in.');
          mode = 'login';
          modalTitle.textContent = 'Sign In';
          togglePrompt.textContent = "Don't have an account?";
          toggleLink.textContent = 'Register';
          nameGroup.classList.add('hidden');
          submitBtn.textContent = 'Sign In';
        }
      } catch (err) {
        alert(err.message);
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      token = '';
      localStorage.removeItem('token');
      currentUser = null;
      document.getElementById('auth-user-info').classList.add('hidden');
      document.getElementById('auth-prompt').classList.remove('hidden');
      resetDashboardStats();
      alert('Logged out successfully.');
    });
  }
}

async function checkExistingSession() {
  if (!token) return;
  
  try {
    // There is no specific /me endpoint, but we can verify the token by fetching stats
    const response = await fetch(`${API_BASE}/trips/stats`, {
      headers: getHeaders()
    });
    
    if (response.ok) {
      // Decode JWT token just to display user email (since we don't have user info endpoint)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      currentUser = { email: payload.sub, name: payload.sub.split('@')[0] };
      
      // Update UI Header / Sidebar profile
      document.getElementById('display-user-name').textContent = currentUser.name;
      document.getElementById('user-avatar-initial').textContent = currentUser.name[0].toUpperCase();
      document.getElementById('auth-user-info').classList.remove('hidden');
      document.getElementById('auth-prompt').classList.add('hidden');
      
      loadDashboardStats();
    } else {
      // Invalid or expired token
      token = '';
      localStorage.removeItem('token');
    }
  } catch (err) {
    console.error('Failed to verify session', err);
  }
}

// ----------------------------------------------------
// Plan Trip View (AI generation and Saving)
// ----------------------------------------------------
const itineraryForm = document.getElementById('itinerary-form');
if (itineraryForm) {
  itineraryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!token) {
      alert('Please Sign In first to plan a trip.');
      document.getElementById('auth-modal').classList.remove('hidden');
      return;
    }

    const destination = document.getElementById('plan-destination').value;
    const start_date = document.getElementById('plan-start-date').value;
    const end_date = document.getElementById('plan-end-date').value;
    const budget = parseFloat(document.getElementById('plan-budget').value);
    const travel_style = document.getElementById('plan-style').value;

    const btn = document.getElementById('itinerary-btn');
    const output = document.getElementById('itinerary-output');
    const saveBtn = document.getElementById('save-itinerary-btn');

    btn.disabled = true;
    btn.textContent = 'Generating details...';
    output.innerHTML = 'Connecting to Gemini AI... Planning your perfect trip.';
    saveBtn.classList.add('hidden');

    try {
      const response = await fetch(`${API_BASE}/itinerary/generate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ destination, start_date, end_date, budget, travel_style })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      currentItineraryData = {
        destination, start_date, end_date, budget, travel_style,
        itinerary_json: JSON.stringify(data)
      };

      // Display resulting itinerary elegantly
      let html = `
        <div class="itinerary-result-wrapper">
          <div class="itinerary-summary-header">
            <h4>${data.destination} Guide</h4>
            <span>${data.total_days} Days Plan | Estimated: $${data.total_estimated_cost}</span>
          </div>
          <div class="itinerary-timeline">
      `;

      data.daily_plan.forEach(day => {
        html += `
          <div class="timeline-day-block">
            <h5 class="timeline-day-title">Day ${day.day}: ${day.title}</h5>
            <div class="timeline-details">
              <p><strong>Morning:</strong> ${day.morning}</p>
              <p><strong>Afternoon:</strong> ${day.afternoon}</p>
              <p><strong>Evening:</strong> ${day.evening}</p>
              <span class="day-cost">Est. Cost: $${day.estimated_cost}</span>
            </div>
          </div>
        `;
      });

      html += `</div>`;
      
      if (data.travel_tips && data.travel_tips.length > 0) {
        html += `<div class="travel-tips"><h5>Important Tips</h5><ul>`;
        data.travel_tips.forEach(tip => {
          html += `<li>${tip}</li>`;
        });
        html += `</ul></div>`;
      }
      
      html += `</div>`;
      output.innerHTML = html;
      saveBtn.classList.remove('hidden');

    } catch (err) {
      output.innerHTML = `<div class="error-msg" style="color: #ff6b6b;">Error: ${err.message}</div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Generate Itinerary';
    }
  });
}

const saveItineraryBtn = document.getElementById('save-itinerary-btn');
if (saveItineraryBtn) {
  saveItineraryBtn.addEventListener('click', async () => {
    if (!currentItineraryData) return;
    
    saveItineraryBtn.disabled = true;
    saveItineraryBtn.textContent = 'Saving...';

    try {
      const response = await fetch(`${API_BASE}/trips/save`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(currentItineraryData)
      });

      if (!response.ok) {
        throw new Error('Failed to save itinerary');
      }

      alert('Trip saved successfully to Dashboard!');
      loadDashboardStats();
    } catch (err) {
      alert(err.message);
    } finally {
      saveItineraryBtn.disabled = false;
      saveItineraryBtn.textContent = 'Save Trip to Dashboard';
    }
  });
}

// ----------------------------------------------------
// AI Chat View
// ----------------------------------------------------
let chatHistory = [];
const chatForm = document.getElementById('chat-input-form');
if (chatForm) {
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!token) {
      alert('Please Sign In first to chat.');
      document.getElementById('auth-modal').classList.remove('hidden');
      return;
    }

    const input = document.getElementById('chat-message-input');
    const msg = input.value.trim();
    if (!msg) return;

    const chatBox = document.getElementById('chat-box');
    
    // Append User Message
    const userDiv = document.createElement('div');
    userDiv.className = 'message user';
    userDiv.innerHTML = `<div class="message-content">${msg}</div>`;
    chatBox.appendChild(userDiv);
    
    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    // Call API
    try {
      const response = await fetch(`${API_BASE}/chat/message`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message: msg, history: chatHistory })
      });

      if (!response.ok) {
        throw new Error('Connection error');
      }

      const data = await response.json();
      
      // Update local history
      chatHistory.push({ role: 'user', content: msg });
      chatHistory.push({ role: 'model', content: data.response });

      // Append System Response
      const sysDiv = document.createElement('div');
      sysDiv.className = 'message system';
      sysDiv.innerHTML = `<div class="message-content">${data.response}</div>`;
      chatBox.appendChild(sysDiv);
      chatBox.scrollTop = chatBox.scrollHeight;

    } catch (err) {
      const errDiv = document.createElement('div');
      errDiv.className = 'message system error';
      errDiv.innerHTML = `<div class="message-content" style="color: #ff6b6b;">Error: Failed to fetch AI answer.</div>`;
      chatBox.appendChild(errDiv);
    }
  });
}

// ----------------------------------------------------
// Flights Search View
// ----------------------------------------------------
const flightForm = document.getElementById('flight-form');
if (flightForm) {
  flightForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!token) {
      alert('Please Sign In first.');
      return;
    }

    const origin = document.getElementById('flight-origin').value;
    const destination = document.getElementById('flight-destination').value;
    const date = document.getElementById('flight-date').value;
    const btn = document.getElementById('flight-search-btn');
    const resultsBox = document.getElementById('flight-results-box');

    btn.disabled = true;
    btn.textContent = 'Searching SkyScraper...';
    resultsBox.innerHTML = 'Connecting to SkyScraper Flight indexes...';

    try {
      const response = await fetch(`${API_BASE}/flights/search`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ origin, destination, date })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      
      // Render flights list/table
      if (data.data && data.data.itineraries && data.data.itineraries.length > 0) {
        let html = `
          <table class="results-table">
            <thead>
              <tr>
                <th>Airline</th>
                <th>Departure</th>
                <th>Arrival</th>
                <th>Stops</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
        `;

        data.data.itineraries.slice(0, 5).forEach(it => {
          const leg = it.legs[0];
          const price = it.price.formatted;
          const carrier = leg.carriers.marketing[0].name;
          const departure = new Date(leg.departure).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          const arrival = new Date(leg.arrival).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          const stops = leg.stopCount === 0 ? 'Direct' : `${leg.stopCount} stops`;
          
          html += `
            <tr>
              <td><strong>${carrier}</strong></td>
              <td>${departure}</td>
              <td>${arrival}</td>
              <td>${stops}</td>
              <td><span style="color: #34D399; font-weight: 600;">${price}</span></td>
            </tr>
          `;
        });

        html += `</tbody></table>`;
        resultsBox.innerHTML = html;
      } else {
        resultsBox.innerHTML = '<div class="empty-state">No flight offers found for this date combination.</div>';
      }

    } catch (err) {
      // Fallback details if limits reached or API key missing
      resultsBox.innerHTML = `
        <div class="empty-state" style="color: #F59E0B;">
          <strong>API Limit reached or key configured incorrectly.</strong><br>
          <span style="font-size: 13px;">Fallback simulated offers for ${origin} → ${destination} on ${date}:</span>
          <table class="results-table" style="margin-top: 16px;">
            <thead>
              <tr><th>Airline</th><th>Departure</th><th>Arrival</th><th>Price</th></tr>
            </thead>
            <tbody>
              <tr><td>United Airlines</td><td>08:00 AM</td><td>12:30 PM</td><td>$450</td></tr>
              <tr><td>Delta Air Lines</td><td>11:15 AM</td><td>03:45 PM</td><td>$495</td></tr>
            </tbody>
          </table>
        </div>
      `;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Search Flights';
    }
  });
}

// ----------------------------------------------------
// Hotels Search View
// ----------------------------------------------------
const hotelForm = document.getElementById('hotel-form-tabs');
if (hotelForm) {
  hotelForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!token) {
      alert('Please Sign In first.');
      return;
    }

    const city = document.getElementById('hotel-city').value;
    const checkin = document.getElementById('hotel-checkin').value;
    const checkout = document.getElementById('hotel-checkout').value;
    const btn = document.getElementById('hotel-search-btn-tabs');
    const resultsBox = document.getElementById('hotel-results-box');

    btn.disabled = true;
    btn.textContent = 'Searching Hotels...';
    resultsBox.innerHTML = 'Connecting to SkyScraper Hotel indexes...';

    try {
      const response = await fetch(`${API_BASE}/hotels/search`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ city, checkin, checkout })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        let html = `
          <table class="results-table">
            <thead>
              <tr>
                <th>Hotel Name</th>
                <th>Stars</th>
                <th>Price Range</th>
              </tr>
            </thead>
            <tbody>
        `;

        data.data.slice(0, 5).forEach(hotel => {
          html += `
            <tr>
              <td><strong>${hotel.name}</strong></td>
              <td>${'★'.repeat(Math.round(hotel.stars || 3))}</td>
              <td><span style="color: #34D399; font-weight: 600;">$${hotel.price || '120'} / night</span></td>
            </tr>
          `;
        });

        html += `</tbody></table>`;
        resultsBox.innerHTML = html;
      } else {
        resultsBox.innerHTML = '<div class="empty-state">No hotels found at this destination.</div>';
      }

    } catch (err) {
      resultsBox.innerHTML = `
        <div class="empty-state" style="color: #F59E0B;">
          <strong>API Limit reached or key configured incorrectly.</strong><br>
          <span style="font-size: 13px;">Fallback simulated hotel details for ${city}:</span>
          <table class="results-table" style="margin-top: 16px;">
            <thead>
              <tr><th>Hotel</th><th>Rating</th><th>Est. Rate</th></tr>
            </thead>
            <tbody>
              <tr><td>Grand Plaza & Suites</td><td>★★★★☆</td><td>$180 / night</td></tr>
              <tr><td>The Ritz Inn</td><td>★★★★★</td><td>$340 / night</td></tr>
            </tbody>
          </table>
        </div>
      `;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Search Hotels';
    }
  });
}

// ----------------------------------------------------
// Weather Search View
// ----------------------------------------------------
const weatherForm = document.getElementById('weather-form-tabs');
if (weatherForm) {
  weatherForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!token) {
      alert('Please Sign In first.');
      return;
    }

    const city = document.getElementById('weather-city').value;
    const btn = document.getElementById('weather-search-btn-tabs');
    const resultsBox = document.getElementById('weather-results-box');

    btn.disabled = true;
    btn.textContent = 'Loading weather...';

    try {
      const response = await fetch(`${API_BASE}/weather/search`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ city })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      
      if (data.list && data.list.length > 0) {
        let html = '<div class="weather-forecast-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; margin-top: 16px;">';
        
        // OpenWeatherMap returns 3-hour steps. Grab one measurement per day (every 8th item)
        for (let i = 0; i < data.list.length; i += 8) {
          const item = data.list[i];
          const date = new Date(item.dt * 1000).toLocaleDateString([], {weekday: 'short', month: 'short', day: 'numeric'});
          const temp = Math.round(item.main.temp);
          const desc = item.weather[0].description;
          
          html += `
            <div class="weather-day-card" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 16px; border-radius: 8px; text-align: center;">
              <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">${date}</div>
              <div style="font-size: 24px; font-weight: 700; margin-bottom: 4px;">${temp}°C</div>
              <div style="font-size: 12px; text-transform: capitalize; color: #60A5FA;">${desc}</div>
            </div>
          `;
        }
        
        html += '</div>';
        resultsBox.innerHTML = `<h4>Forecast for ${data.city.name}, ${data.city.country}</h4>` + html;
      } else {
        resultsBox.innerHTML = '<div class="empty-state">No weather stats returned.</div>';
      }

    } catch (err) {
      resultsBox.innerHTML = `
        <div class="empty-state" style="color: #ff6b6b;">
          Error retrieving forecast from OpenWeatherMap API: ${err.message}
        </div>
      `;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Get Forecast';
    }
  });
}

// ----------------------------------------------------
// Saved Trips View & Actions
// ----------------------------------------------------
async function loadSavedTrips() {
  if (!token) return;
  const listContainer = document.getElementById('saved-trips-list');
  listContainer.innerHTML = 'Retrieving planned trips...';

  try {
    const response = await fetch(`${API_BASE}/trips/my-trips`, {
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Could not pull trips');

    const trips = await response.json();

    if (trips.length > 0) {
      let html = '';
      trips.forEach(t => {
        const details = JSON.parse(t.itinerary_json);
        html += `
          <div class="trip-item-card" id="trip-card-${t.id}">
            <div class="trip-meta">
              <h4>${t.destination}</h4>
              <p>${t.start_date} to ${t.end_date}</p>
            </div>
            <div class="trip-details">
              <strong>Budget:</strong> $${t.budget}<br>
              <strong>Style:</strong> ${t.travel_style}<br>
              <strong>Daily Plan Summary:</strong> ${details.daily_plan ? details.daily_plan.length : '0'} Days Generated
            </div>
            <div class="trip-actions">
              <button onclick="window.deleteTrip(${t.id})" class="btn btn-outline-sm" style="border-color: #EF4444; color: #FCA5A5; padding: 6px 12px; font-size: 12px;">Delete</button>
            </div>
          </div>
        `;
      });
      listContainer.innerHTML = html;
    } else {
      listContainer.innerHTML = '<div class="empty-state">No saved trips found. Go to "Plan Trip" to save one.</div>';
    }
  } catch (err) {
    listContainer.innerHTML = `<div class="empty-state" style="color: #ff6b6b;">Error loading saved trips: ${err.message}</div>`;
  }
}

// Expose delete function globally so it can be triggered from onclick attributes
window.deleteTrip = async function(tripId) {
  if (!confirm('Are you sure you want to delete this trip itinerary?')) return;

  try {
    const response = await fetch(`${API_BASE}/trips/${tripId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Could not delete');

    alert('Trip deleted successfully.');
    // Remove element from DOM
    const el = document.getElementById(`trip-card-${tripId}`);
    if (el) el.remove();
    
    // Check if list is now empty
    const list = document.getElementById('saved-trips-list');
    if (list && list.children.length === 0) {
      list.innerHTML = '<div class="empty-state">No saved trips found. Go to "Plan Trip" to save one.</div>';
    }

    loadDashboardStats();
  } catch (err) {
    alert(err.message);
  }
};

// ----------------------------------------------------
// Dashboard Overview Stats Loader
// ----------------------------------------------------
async function loadDashboardStats() {
  if (!token) return;

  try {
    const response = await fetch(`${API_BASE}/trips/stats`, {
      headers: getHeaders()
    });

    if (!response.ok) return;
    const stats = await response.json();

    document.getElementById('stat-total-trips').textContent = stats.total_trips;
    document.getElementById('stat-total-budget').textContent = `$${stats.total_budget}`;
    document.getElementById('stat-fav-destination').textContent = stats.favorite_destination || '—';

    // Show recent trip summary in dashboard
    const recentTripBox = document.getElementById('recent-trip-details');
    if (stats.recent_trip) {
      const t = stats.recent_trip;
      recentTripBox.innerHTML = `
        <div style="background: rgba(255,255,255,0.01); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
          <h4 style="font-size: 18px; margin-bottom: 8px; color: #60A5FA;">${t.destination}</h4>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">Dates: ${t.start_date} to ${t.end_date}</p>
          <div style="font-size: 14px; line-height: 1.6;">
            <strong>Travel Style:</strong> ${t.travel_style}<br>
            <strong>Budget Allocation:</strong> $${t.budget} USD
          </div>
          <button onclick="document.querySelector('[data-view=saved-trips]').click()" class="btn btn-primary-sm mt-12">View Full Itinerary</button>
        </div>
      `;
      recentTripBox.classList.remove('empty-state');
    } else {
      recentTripBox.innerHTML = 'No trips created yet. Click "Plan Trip" in the sidebar to get started.';
      recentTripBox.classList.add('empty-state');
    }

  } catch (err) {
    console.error('Failed to load dashboard stats', err);
  }
}

function resetDashboardStats() {
  document.getElementById('stat-total-trips').textContent = '0';
  document.getElementById('stat-total-budget').textContent = '$0';
  document.getElementById('stat-fav-destination').textContent = '—';
  
  const recentTripBox = document.getElementById('recent-trip-details');
  recentTripBox.innerHTML = 'No trips created yet. Click "Plan Trip" in the sidebar to get started.';
  recentTripBox.classList.add('empty-state');
}
