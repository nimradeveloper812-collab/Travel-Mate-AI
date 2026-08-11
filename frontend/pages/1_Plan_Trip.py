import streamlit as st
import requests
import os
import json

try:
    API_URL = st.secrets.get("BACKEND_URL", os.getenv("BACKEND_URL", "http://localhost:8000"))
except:
    API_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

st.set_page_config(page_title="Plan Trip - TravelMate AI", page_icon="🗺️", layout="wide")

def load_css():
    with open("frontend/styles/global.css") as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

load_css()
st.sidebar.markdown("<h2 class='gradient-text'>✈️ TravelMate AI</h2><hr>", unsafe_allow_html=True)

if "token" not in st.session_state or not st.session_state.token:
    st.warning("Please log in from the home page first.")
    st.stop()

st.markdown("<h1><span class='gradient-text'>🗺️ Plan Your Next Adventure</span></h1>", unsafe_allow_html=True)

st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
with st.form("itinerary_form"):
    destination = st.text_input("📍 Destination", placeholder="Where to?")
    col1, col2 = st.columns(2)
    start_date = col1.date_input("Start Date")
    end_date = col2.date_input("End Date")
    budget = st.slider("💰 Budget (USD)", min_value=100, max_value=10000, step=100, value=1000)
    
    st.markdown("### Travel Style")
    style_col1, style_col2, style_col3 = st.columns(3)
    travel_style = st.radio("Choose your vibe:", ["🏔️ Adventure", "😌 Relaxed", "🏛️ Cultural"], horizontal=True)
    
    submit_button = st.form_submit_button("Generate Itinerary ✨")
st.markdown("</div>", unsafe_allow_html=True)

if submit_button:
    if start_date > end_date:
        st.error("End date must be after start date.")
    else:
        with st.spinner("Generating your personalized itinerary with AI..."):
            headers = {"Authorization": f"Bearer {st.session_state.token}"}
            # Clean emoji from travel style for backend
            clean_style = travel_style.split(" ")[1].lower()
            
            payload = {
                "destination": destination,
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d"),
                "budget": budget,
                "travel_style": clean_style
            }
            try:
                response = requests.post(f"{API_URL}/itinerary/generate", json=payload, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    st.success("Itinerary generated successfully!")
                    
                    st.markdown(f"<h2>Trip to <span class='gradient-text'>{data.get('destination')}</span></h2>", unsafe_allow_html=True)
                    st.write(f"**Total Days:** {data.get('total_days')} | <span style='color:var(--accent); font-size:1.2rem; font-weight:bold;'>Est. Cost: ${data.get('total_estimated_cost')}</span>", unsafe_allow_html=True)
                    
                    st.markdown("### Daily Plan")
                    for day in data.get("daily_plan", []):
                        st.markdown(f"""
                        <div class='glass-card' style='border-left: 4px solid var(--primary);'>
                            <h4>Day {day.get('day')}: {day.get('title')} <span style='float:right; color:var(--accent);'>${day.get('estimated_cost')}</span></h4>
                            <p>🌅 <b>Morning:</b> {day.get('morning')}</p>
                            <p>🌤️ <b>Afternoon:</b> {day.get('afternoon')}</p>
                            <p>🌙 <b>Evening:</b> {day.get('evening')}</p>
                        </div>
                        """, unsafe_allow_html=True)
                            
                    st.markdown("### Travel Tips")
                    for tip in data.get("travel_tips", []):
                        st.write(f"- {tip}")
                        
                    st.session_state.last_trip = {
                        "destination": destination,
                        "start_date": start_date.strftime("%Y-%m-%d"),
                        "end_date": end_date.strftime("%Y-%m-%d"),
                        "budget": budget,
                        "travel_style": clean_style,
                        "itinerary_json": json.dumps(data)
                    }
                else:
                    st.error(f"Error: {response.json().get('detail', 'Failed to generate itinerary')}")
            except Exception as e:
                st.error(f"Failed to connect to backend: {e}")

if st.session_state.get("last_trip"):
    if st.button("Save Trip 💾"):
        with st.spinner("Saving trip..."):
            headers = {"Authorization": f"Bearer {st.session_state.token}"}
            try:
                resp = requests.post(f"{API_URL}/trips/save", json=st.session_state.last_trip, headers=headers)
                if resp.status_code == 200:
                    st.success("Trip saved successfully!")
                else:
                    st.error("Failed to save trip")
            except Exception as e:
                st.error(f"Failed to connect to backend: {e}")
