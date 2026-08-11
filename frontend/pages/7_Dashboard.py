import streamlit as st
import requests
import os
import plotly.express as px
import pandas as pd

try:
    API_URL = st.secrets.get("BACKEND_URL", os.getenv("BACKEND_URL", "http://localhost:8000"))
except:
    API_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

st.set_page_config(page_title="Dashboard - TravelMate AI", page_icon="📊", layout="wide")

def load_css():
    with open("frontend/styles/global.css") as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

load_css()
st.sidebar.markdown("<h2 class='gradient-text'>✈️ TravelMate AI</h2><hr>", unsafe_allow_html=True)

if "token" not in st.session_state or not st.session_state.token:
    st.warning("Please log in from the home page to view dashboard.")
    st.stop()

st.markdown(f"<div class='hero-gradient' style='padding: 2rem; margin-bottom: 20px;'><h1 style='color:white; margin:0;'>Hello, {st.session_state.user_name}! 👋</h1></div>", unsafe_allow_html=True)

headers = {"Authorization": f"Bearer {st.session_state.token}"}

try:
    response = requests.get(f"{API_URL}/trips/stats", headers=headers)
    
    if response.status_code == 200:
        stats = response.json()
        
        if stats["total_trips"] == 0:
            st.info("Start planning your first trip!")
        else:
            # Metrics
            c1, c2, c3, c4 = st.columns(4)
            
            with c1:
                st.markdown(f"<div class='glass-card' style='text-align:center;'><h3 style='color:var(--text-secondary);'>✈️ Total Trips</h3><h2 class='gradient-text'>{stats['total_trips']}</h2></div>", unsafe_allow_html=True)
            with c2:
                st.markdown(f"<div class='glass-card' style='text-align:center;'><h3 style='color:var(--text-secondary);'>💰 Budget Spent</h3><h2 class='gradient-text'>${stats['total_budget']:,.0f}</h2></div>", unsafe_allow_html=True)
            with c3:
                # Mocking Countries visited since we only have destinations
                st.markdown(f"<div class='glass-card' style='text-align:center;'><h3 style='color:var(--text-secondary);'>🌍 Favorite</h3><h2 class='gradient-text'>{stats['favorite_destination'] or 'N/A'}</h2></div>", unsafe_allow_html=True)
            with c4:
                last_date = stats['recent_trip']['start_date'] if stats['recent_trip'] else 'N/A'
                st.markdown(f"<div class='glass-card' style='text-align:center;'><h3 style='color:var(--text-secondary);'>📅 Last Trip</h3><h2 class='gradient-text'>{last_date}</h2></div>", unsafe_allow_html=True)
            
            st.markdown("<hr>", unsafe_allow_html=True)
            
            # Charts
            c_left, c_right = st.columns(2)
            
            with c_left:
                st.markdown("### Trips per Month")
                if stats["trips_per_month"]:
                    st.bar_chart(stats["trips_per_month"])
                else:
                    st.write("Not enough data")
                    
            with c_right:
                st.markdown("### Travel Styles")
                if stats["travel_styles"]:
                    df = pd.DataFrame(list(stats["travel_styles"].items()), columns=["Style", "Count"])
                    fig = px.pie(df, values='Count', names='Style', 
                                 color_discrete_sequence=['#FF6B6B', '#4ECDC4', '#FFE66D'],
                                 hole=0.4)
                    fig.update_layout(
                        paper_bgcolor="rgba(0,0,0,0)",
                        plot_bgcolor="rgba(0,0,0,0)",
                        font=dict(color="#FFFFFF", family="Inter")
                    )
                    st.plotly_chart(fig, use_container_width=True)
                else:
                    st.write("Not enough data")
                    
            if stats["recent_trip"]:
                st.markdown("<hr>", unsafe_allow_html=True)
                st.markdown("### Most Recent Trip")
                recent = stats["recent_trip"]
                st.markdown(f"""
                <div class='glass-card' style='border-left: 4px solid var(--primary);'>
                    <h2>{recent['destination']}</h2>
                    <p style='color: var(--text-secondary);'>📅 {recent['start_date']} to {recent['end_date']} | 💰 ${recent['budget']} | 🎭 {recent['travel_style'].capitalize()}</p>
                </div>
                """, unsafe_allow_html=True)
                
    else:
        st.error("Failed to fetch dashboard stats.")
except Exception as e:
    st.error(f"Failed to connect to backend: {e}")
