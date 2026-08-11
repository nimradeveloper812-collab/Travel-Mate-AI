import streamlit as st
import requests
import json
import os

try:
    API_URL = st.secrets.get("BACKEND_URL", os.getenv("BACKEND_URL", "http://localhost:8000"))
except:
    API_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

st.set_page_config(page_title="Saved Trips - TravelMate AI", page_icon="🧳", layout="wide")

def load_css():
    with open("frontend/styles/global.css") as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

load_css()
st.sidebar.markdown("<h2 class='gradient-text'>✈️ TravelMate AI</h2><hr>", unsafe_allow_html=True)

if "token" not in st.session_state or not st.session_state.token:
    st.warning("Please log in from the home page to view saved trips.")
    st.stop()

st.markdown("<h1><span class='gradient-text'>My Trips 🗺️</span></h1>", unsafe_allow_html=True)

headers = {"Authorization": f"Bearer {st.session_state.token}"}

try:
    response = requests.get(f"{API_URL}/trips/my-trips", headers=headers)
    
    if response.status_code == 200:
        trips = response.json()
        
        if not trips:
            st.markdown("""
            <div style='text-align: center; margin-top: 50px;'>
                <h1 style='font-size: 5rem;'>🌍</h1>
                <h2 style='color: var(--text-secondary);'>No trips yet. Start exploring!</h2>
            </div>
            """, unsafe_allow_html=True)
        else:
            for trip in trips:
                st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
                col1, col2, col3 = st.columns([2, 1, 1])
                
                with col1:
                    st.markdown(f"<h2 class='gradient-text'>{trip['destination']}</h2>", unsafe_allow_html=True)
                    st.markdown(f"""
                    <span style='background: rgba(255,107,107,0.2); color: var(--primary); padding: 5px 12px; border-radius: 15px; font-size: 0.9em; margin-right: 10px;'>📅 {trip['start_date']} to {trip['end_date']}</span>
                    <span style='background: rgba(78,205,196,0.2); color: var(--secondary); padding: 5px 12px; border-radius: 15px; font-size: 0.9em; margin-right: 10px;'>💰 ${trip['budget']}</span>
                    <span style='background: rgba(255,230,109,0.2); color: var(--accent); padding: 5px 12px; border-radius: 15px; font-size: 0.9em; text-transform: capitalize;'>🎭 {trip['travel_style']}</span>
                    """, unsafe_allow_html=True)
                
                with col3:
                    st.write("") # spacing
                    if st.button("View Details 👁️", key=f"view_{trip['id']}"):
                        st.session_state[f"show_trip_{trip['id']}"] = not st.session_state.get(f"show_trip_{trip['id']}", False)
                        
                    # Add custom class for delete button using st.markdown approach is tricky in pure streamlit, 
                    # but we can use type='primary' and since our global css applies btn-danger, it would be cool.
                    # Instead, we just style it using inline HTML or standard streamlit button and let global css handle if we could inject class.
                    # Since we can't inject class directly to st.button, let's just use Streamlit standard for now.
                    
                    if st.button("Delete 🗑️", key=f"del_{trip['id']}", type="primary"):
                        del_resp = requests.delete(f"{API_URL}/trips/{trip['id']}", headers=headers)
                        if del_resp.status_code == 200:
                            st.rerun()
                            
                if st.session_state.get(f"show_trip_{trip['id']}", False):
                    st.markdown("<hr>", unsafe_allow_html=True)
                    st.markdown("### Itinerary")
                    
                    try:
                        itinerary_data = json.loads(trip["itinerary_json"])
                        for day in itinerary_data.get("daily_plan", []):
                            st.markdown(f"""
                            <div style='background: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px; margin-bottom: 10px; border-left: 3px solid var(--secondary);'>
                                <h4 style='margin-top:0;'>Day {day.get('day')}: {day.get('title')}</h4>
                                <p style='margin:5px 0;'>🌅 {day.get('morning')}</p>
                                <p style='margin:5px 0;'>🌤️ {day.get('afternoon')}</p>
                                <p style='margin:5px 0;'>🌙 {day.get('evening')}</p>
                            </div>
                            """, unsafe_allow_html=True)
                    except:
                        st.write("Could not parse itinerary data.")
                        
                st.markdown("</div>", unsafe_allow_html=True)
                            
    else:
        st.error("Failed to fetch trips. Please try again later.")
except Exception as e:
    st.error(f"Failed to connect to backend: {e}")
