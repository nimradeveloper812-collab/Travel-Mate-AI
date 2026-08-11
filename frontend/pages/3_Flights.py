import streamlit as st
import requests
import os

try:
    API_URL = st.secrets.get("BACKEND_URL", os.getenv("BACKEND_URL", "http://localhost:8000"))
except:
    API_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

st.set_page_config(page_title="Flight Search - TravelMate AI", page_icon="✈️", layout="wide")

def load_css():
    with open("frontend/styles/global.css") as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

load_css()
st.sidebar.markdown("<h2 class='gradient-text'>✈️ TravelMate AI</h2><hr>", unsafe_allow_html=True)

if "token" not in st.session_state or not st.session_state.token:
    st.warning("Please log in from the home page first.")
    st.stop()

st.markdown("<h1><span class='gradient-text'>✈️ Search Flights</span></h1>", unsafe_allow_html=True)

st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
with st.form("flight_search_form"):
    col1, col2 = st.columns(2)
    origin = col1.text_input("🛫 Origin City", placeholder="e.g. New York")
    destination = col2.text_input("🛬 Destination City", placeholder="e.g. London")
    
    col3, col4, col5 = st.columns(3)
    date = col3.date_input("Departure Date")
    return_date = col4.date_input("Return Date (Optional)", value=None)
    adults = col5.number_input("👥 Passengers", min_value=1, max_value=9, value=1)
    
    submit_button = st.form_submit_button("Search Flights 🔍")
st.markdown("</div>", unsafe_allow_html=True)

if submit_button:
    if not origin or not destination:
        st.error("Origin and Destination are required.")
    else:
        with st.spinner("Searching flights... ✈️"):
            headers = {"Authorization": f"Bearer {st.session_state.token}"}
            payload = {
                "origin": origin,
                "destination": destination,
                "date": date.strftime("%Y-%m-%d"),
                "adults": adults
            }
            if return_date:
                payload["return_date"] = return_date.strftime("%Y-%m-%d")
                
            try:
                response = requests.post(f"{API_URL}/flights/search", json=payload, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    flights = data.get("data", {}).get("itineraries", [])
                    
                    if not flights:
                        st.info("No flights found for the given dates and route.")
                    else:
                        st.success(f"Found {len(flights)} flights!")
                        for flight in flights:
                            leg = flight.get("legs", [])[0]
                            price = flight.get("price", {}).get("formatted", "N/A")
                            airline = leg.get("carriers", {}).get("marketing", [{}])[0].get("name", "Unknown")
                            departure = leg.get("departure", "Unknown")
                            arrival = leg.get("arrival", "Unknown")
                            duration = f"{leg.get('durationInMinutes', 0) // 60}h {leg.get('durationInMinutes', 0) % 60}m"
                            
                            st.markdown(f"""
                            <div class='glass-card' style='border-left: 4px solid var(--secondary);'>
                                <div style='display: flex; justify-content: space-between; align-items: center;'>
                                    <div>
                                        <h3 style='margin-bottom: 0;'>{airline} ✈️</h3>
                                        <p style='color: var(--text-secondary); margin-top: 5px;'>{departure} ➔ {arrival} ({duration})</p>
                                    </div>
                                    <div style='text-align: right;'>
                                        <h2 style='color: var(--primary); margin: 0;'>{price}</h2>
                                    </div>
                                </div>
                            </div>
                            """, unsafe_allow_html=True)
                            
                            if st.button(f"Select Flight", key=f"flight_{flight.get('id', '')}"):
                                st.success("Flight selected! (Booking flow coming soon)")
                elif response.status_code == 429:
                    st.error("Search limit reached for today, try tomorrow.")
                else:
                    st.error(f"Error: {response.json().get('detail', 'Failed to fetch flights')}")
            except Exception as e:
                st.error(f"Failed to connect to backend: {e}")
