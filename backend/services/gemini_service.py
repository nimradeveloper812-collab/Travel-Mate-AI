import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-2.0-flash')

def generate_itinerary(destination: str, days: int, budget: float, travel_style: str) -> str:
    prompt = f"""Create a detailed {days}-day travel itinerary for {destination}. 
Budget: ${budget} USD. Travel style: {travel_style}.
Return ONLY valid JSON in this format:
{{
  "destination": "",
  "total_days": 0,
  "daily_plan": [
    {{
      "day": 1,
      "title": "",
      "morning": "",
      "afternoon": "",
      "evening": "",
      "estimated_cost": 0
    }}
  ],
  "total_estimated_cost": 0,
  "travel_tips": []
}}
"""
    response = model.generate_content(prompt)
    
    # Clean up the response to get just the JSON
    text = response.text.strip()
    if text.startswith('```json'):
        text = text[7:]
    if text.startswith('```'):
        text = text[3:]
    if text.endswith('```'):
        text = text[:-3]
        
    return text.strip()

def chat_with_ai(message: str, history: list) -> str:
    system_prompt = "You are TravelMate AI, an expert travel assistant. Provide helpful, concise, and accurate travel advice."
    
    chat_history = []
    for msg in history:
        chat_history.append({"role": msg["role"], "parts": [msg["content"]]})
        
    chat = model.start_chat(history=chat_history)
    response = chat.send_message(f"System: {system_prompt}\n\nUser: {message}")
    return response.text
