import streamlit as st
import requests
from datetime import datetime
import os

try:
    API_URL = st.secrets.get("BACKEND_URL", os.getenv("BACKEND_URL", "http://localhost:8000"))
except:
    API_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

st.set_page_config(page_title="Weather Forecast - TravelMate AI", page_icon="⛅", layout="wide")

def load_css():
    with open("frontend/styles/global.css") as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

load_css()
st.sidebar.markdown("<h2 class='gradient-text'>✈️ TravelMate AI</h2><hr>", unsafe_allow_html=True)

if "token" not in st.session_state or not st.session_state.token:
    st.warning("Please log in from the home page first.")
    st.stop()

st.markdown("<h1><span class='gradient-text'>⛅ 5-Day Weather Forecast</span></h1>", unsafe_allow_html=True)

def get_weather_emoji(description):
    desc = description.lower()
    if 'clear' in desc or 'sun' in desc: return "☀️"
    if 'rain' in desc or 'drizzle' in desc: return "🌧️"
    if 'cloud' in desc: return "☁️"
    if 'snow' in desc: return "❄️"
    if 'thunder' in desc: return "⛈️"
    return "⛅"

def get_weather_gradient(description):
    desc = description.lower()
    if 'clear' in desc or 'sun' in desc: return "linear-gradient(135deg, #FFB75E, #ED8F03)"
    if 'rain' in desc or 'drizzle' in desc: return "linear-gradient(135deg, #4A569D, #C24E82)"
    if 'cloud' in desc: return "linear-gradient(135deg, #8e9eab, #eef2f3)"
    if 'snow' in desc: return "linear-gradient(135deg, #E0EAFC, #CFDEF3)"
    return "linear-gradient(135deg, #4ECDC4, #556270)"

def get_text_color(description):
    desc = description.lower()
    if 'cloud' in desc or 'snow' in desc: return "#1A1A2E"
    return "#FFFFFF"

st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
with st.form("weather_search_form"):
    city = st.text_input("🏙️ City", placeholder="e.g. Tokyo")
    submit_button = st.form_submit_button("Get Forecast 🔍")
st.markdown("</div>", unsafe_allow_html=True)

if submit_button:
    if not city:
        st.error("City is required.")
    else:
        with st.spinner(f"Fetching weather forecast for {city}..."):
            headers = {"Authorization": f"Bearer {st.session_state.token}"}
            payload = {"city": city}
                
            try:
                response = requests.post(f"{API_URL}/weather/search", json=payload, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    st.success(f"Forecast for {data.get('city', {}).get('name')}, {data.get('city', {}).get('country')}")
                    
                    forecast_list = data.get("list", [])
                    daily_forecasts = []
                    seen_dates = set()
                    
                    for item in forecast_list:
                        dt = datetime.fromtimestamp(item["dt"])
                        date_str = dt.strftime("%Y-%m-%d")
                        if date_str not in seen_dates and dt.hour >= 12:
                            daily_forecasts.append(item)
                            seen_dates.add(date_str)
                            
                    if not daily_forecasts and forecast_list:
                        daily_forecasts = [forecast_list[0]]
                        
                    cols = st.columns(len(daily_forecasts))
                    
                    for i, forecast in enumerate(daily_forecasts):
                        with cols[i]:
                            dt = datetime.fromtimestamp(forecast["dt"])
                            weather = forecast["weather"][0]
                            desc = weather["description"]
                            temp = forecast["main"]["temp"]
                            humidity = forecast["main"]["humidity"]
                            wind = forecast["wind"]["speed"]
                            
                            bg = get_weather_gradient(desc)
                            tc = get_text_color(desc)
                            emoji = get_weather_emoji(desc)
                            
                            st.markdown(f"""
                            <div style='background: {bg}; color: {tc}; border-radius: 15px; padding: 20px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom:10px;'>
                                <h4 style='margin:0; font-family: Inter;'>{dt.strftime('%A')}</h4>
                                <p style='margin:0; font-size: 0.9em; opacity: 0.8;'>{dt.strftime('%b %d')}</p>
                                <h1 style='font-size: 3.5rem; margin: 10px 0;'>{emoji}</h1>
                                <h2 style='margin: 0; font-family: Poppins;'>{temp:.1f}°C</h2>
                                <p style='margin: 5px 0; font-weight: 600; text-transform: capitalize;'>{desc}</p>
                                <hr style='border-color: rgba(255,255,255,0.2); margin: 10px 0;'/>
                                <p style='margin: 0; font-size: 0.9em;'>💧 {humidity}% | 🌬️ {wind} m/s</p>
                            </div>
                            """, unsafe_allow_html=True)
                            
                else:
                    st.error(f"Error: {response.json().get('detail', 'Failed to fetch weather')}")
            except Exception as e:
                st.error(f"Failed to connect to backend: {e}")
