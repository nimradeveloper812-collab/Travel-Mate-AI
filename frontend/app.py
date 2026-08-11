import streamlit as st
import requests
import os
from dotenv import load_dotenv

load_dotenv()

try:
    API_URL = st.secrets.get("BACKEND_URL", os.getenv("BACKEND_URL", "http://localhost:8000"))
except:
    API_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

st.set_page_config(page_title="TravelMate AI", page_icon="✈️", layout="wide")

def load_css():
    with open("frontend/styles/global.css") as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

load_css()

# Custom Sidebar
st.sidebar.markdown("<h2 class='gradient-text'>✈️ TravelMate AI</h2>", unsafe_allow_html=True)
st.sidebar.markdown("---")

if "token" not in st.session_state:
    st.session_state.token = None
    st.session_state.user_name = None

if st.session_state.token:
    st.sidebar.success(f"👋 Logged in as {st.session_state.user_name or 'User'}")
    if st.sidebar.button("Logout", key="logout", help="Click to logout", type="primary", use_container_width=True):
        st.session_state.token = None
        st.session_state.user_name = None
        st.rerun()
    
    st.markdown("<div class='hero-gradient'><h1 style='color:white; font-size: 4rem;'>Welcome Back! 🌍</h1><p style='color:white; font-size: 1.5rem;'>Your AI-Powered Travel Companion awaits.</p></div>", unsafe_allow_html=True)
    st.markdown("### Start your journey from the sidebar menu 👉")
else:
    st.markdown("<div class='hero-gradient'><h1 style='color:white; font-size: 4rem;'>TravelMate AI ✈️</h1><p style='color:white; font-size: 1.5rem;'>Your AI-Powered Travel Companion</p></div>", unsafe_allow_html=True)
    
    st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
    tab1, tab2 = st.tabs(["🔒 Login", "✍️ Sign Up"])
    
    with tab1:
        st.subheader("Login to your account")
        email = st.text_input("Email", key="login_email")
        password = st.text_input("Password", type="password", key="login_password")
        if st.button("Login"):
            try:
                response = requests.post(f"{API_URL}/auth/login", json={"email": email, "password": password})
                if response.status_code == 200:
                    st.session_state.token = response.json()["access_token"]
                    st.session_state.user_name = email.split('@')[0]
                    st.rerun()
                else:
                    st.error(f"Error: {response.json().get('detail', 'Unknown error')}")
            except Exception as e:
                st.error(f"Failed to connect to backend: {e}")
                
    with tab2:
        st.subheader("Create a new account")
        new_name = st.text_input("Name")
        new_email = st.text_input("Email", key="signup_email")
        new_password = st.text_input("Password", type="password", key="signup_password")
        if st.button("Sign Up"):
            try:
                response = requests.post(
                    f"{API_URL}/auth/signup", 
                    json={"name": new_name, "email": new_email, "password": new_password}
                )
                if response.status_code == 200:
                    st.success("Signed up successfully! Please login.")
                else:
                    st.error(f"Error: {response.json().get('detail', 'Unknown error')}")
            except Exception as e:
                st.error(f"Failed to connect to backend: {e}")
    
    st.markdown("</div>", unsafe_allow_html=True)
