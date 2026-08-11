import streamlit as st
import requests
import os

try:
    API_URL = st.secrets.get("BACKEND_URL", os.getenv("BACKEND_URL", "http://localhost:8000"))
except:
    API_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

st.set_page_config(page_title="Hotel Search - TravelMate AI", page_icon="🏨", layout="wide")

def load_css():
    with open("frontend/styles/global.css") as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

load_css()
st.sidebar.markdown("<h2 class='gradient-text'>✈️ TravelMate AI</h2><hr>", unsafe_allow_html=True)

if "token" not in st.session_state or not st.session_state.token:
    st.warning("Please log in from the home page first.")
    st.stop()

st.markdown("<h1><span class='gradient-text'>🏨 Search Hotels</span></h1>", unsafe_allow_html=True)

st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
with st.form("hotel_search_form"):
    city = st.text_input("🏙️ City", placeholder="e.g. Paris")
    
    col1, col2, col3 = st.columns(3)
    checkin = col1.date_input("Check-in Date")
    checkout = col2.date_input("Check-out Date")
    adults = col3.number_input("👥 Guests", min_value=1, max_value=9, value=1)
    
    submit_button = st.form_submit_button("Search Hotels 🔍")
st.markdown("</div>", unsafe_allow_html=True)

if submit_button:
    if not city:
        st.error("City is required.")
    elif checkin >= checkout:
        st.error("Check-out date must be after Check-in date.")
    else:
        with st.spinner("Finding best hotels... 🏨"):
            headers = {"Authorization": f"Bearer {st.session_state.token}"}
            payload = {
                "city": city,
                "checkin": checkin.strftime("%Y-%m-%d"),
                "checkout": checkout.strftime("%Y-%m-%d"),
                "adults": adults
            }
                
            try:
                response = requests.post(f"{API_URL}/hotels/search", json=payload, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    hotels = data.get("data", {}).get("properties", [])
                    
                    if not hotels:
                        st.info("No hotels found for the given criteria.")
                    else:
                        st.success(f"Found {len(hotels)} hotels!")
                        for hotel in hotels:
                            name = hotel.get("name", "Unknown Hotel")
                            rating = hotel.get("reviews", {}).get("score", "N/A")
                            price = hotel.get("price", {}).get("lead", {}).get("formatted", "N/A")
                            total_price = hotel.get("price", {}).get("displayMessages", [{}])[0].get("lineItems", [{}])[0].get("price", {}).get("formatted", "N/A")
                            
                            st.markdown(f"""
                            <div class='glass-card' style='border-left: 4px solid var(--accent);'>
                                <div style='display: flex; justify-content: space-between; align-items: center;'>
                                    <div>
                                        <h3 style='margin-bottom: 0;'>{name}</h3>
                                        <p style='color: var(--accent); font-weight: bold; margin-top: 5px;'>⭐ {rating}/10</p>
                                    </div>
                                    <div style='text-align: right;'>
                                        <p style='margin: 0; color: var(--text-secondary);'>Price per night: {price}</p>
                                        <h3 style='color: var(--primary); margin: 5px 0 0 0;'>Total: {total_price}</h3>
                                    </div>
                                </div>
                            </div>
                            """, unsafe_allow_html=True)
                            
                            if st.button(f"Book", key=f"hotel_{hotel.get('id', '')}"):
                                st.success("Hotel selected! (Booking flow coming soon)")
                elif response.status_code == 429:
                    st.error("Search limit reached for today, try tomorrow.")
                else:
                    st.error(f"Error: {response.json().get('detail', 'Failed to fetch hotels')}")
            except Exception as e:
                st.error(f"Failed to connect to backend: {e}")
