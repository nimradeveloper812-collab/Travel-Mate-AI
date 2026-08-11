import streamlit as st
import requests
import os

try:
    API_URL = st.secrets.get("BACKEND_URL", os.getenv("BACKEND_URL", "http://localhost:8000"))
except:
    API_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

st.set_page_config(page_title="AI Chat - TravelMate AI", page_icon="💬", layout="wide")

def load_css():
    with open("frontend/styles/global.css") as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

load_css()
st.sidebar.markdown("<h2 class='gradient-text'>✈️ TravelMate AI</h2><hr>", unsafe_allow_html=True)

if "token" not in st.session_state or not st.session_state.token:
    st.warning("Please log in from the home page first.")
    st.stop()

st.markdown("<h1><span class='gradient-text'>TravelMate AI 🤖</span> <span style='height:12px;width:12px;background-color:#00FF00;border-radius:50%;display:inline-block;animation: pulse 2s infinite;'></span></h1>", unsafe_allow_html=True)
st.markdown("""
<style>
@keyframes pulse {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 255, 0, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(0, 255, 0, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 255, 0, 0); }
}
</style>
""", unsafe_allow_html=True)

if "messages" not in st.session_state:
    st.session_state.messages = []

# Display chat history with custom CSS classes
st.markdown("<div style='margin-bottom: 80px;'>", unsafe_allow_html=True)
for msg in st.session_state.messages:
    if msg["role"] == "user":
        st.markdown(f"<div class='chat-user'>{msg['content']}</div>", unsafe_allow_html=True)
    else:
        st.markdown(f"<div class='chat-bot'>{msg['content']}</div>", unsafe_allow_html=True)
st.markdown("</div>", unsafe_allow_html=True)

# Chat input
if prompt := st.chat_input("Ask about your trip, destinations, or packing tips..."):
    # Add user message to UI
    st.session_state.messages.append({"role": "user", "content": prompt})
    st.rerun() # Refresh to show user message immediately, but we need to handle the request logic. Wait, Streamlit's chat_input triggers a rerun automatically.
    
# Actually, the standard way in Streamlit is to just run the logic sequentially after the input.
# Since we need to show the spinner and the response, let's restructure slightly.

if st.session_state.messages and st.session_state.messages[-1]["role"] == "user":
    with st.spinner("TravelMate AI is typing..."):
        headers = {"Authorization": f"Bearer {st.session_state.token}"}
        # Only send previous messages for history
        history_for_api = st.session_state.messages[:-1]
        payload = {
            "message": st.session_state.messages[-1]["content"],
            "history": history_for_api
        }
        try:
            response = requests.post(f"{API_URL}/chat/message", json=payload, headers=headers)
            if response.status_code == 200:
                ai_response = response.json().get("response", "No response")
                st.session_state.messages.append({"role": "model", "content": ai_response})
                st.rerun()
            else:
                st.error(f"Error: {response.json().get('detail', 'Failed to get response')}")
        except Exception as e:
            st.error(f"Failed to connect to backend: {e}")
