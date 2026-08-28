import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-3.6-flash')

def _clean_json(text: str) -> str:
    """Strip markdown code fences from Gemini JSON output."""
    text = text.strip()
    # Remove ```json ... ``` or ``` ... ```
    text = re.sub(r'^```(?:json)?\s*', '', text)
    text = re.sub(r'\s*```$', '', text)
    return text.strip()

def generate_itinerary(destination: str, days: int, budget: float, travel_style: str) -> str:
    prompt = f"""Create a detailed {days}-day travel itinerary for {destination}.
Budget: ${budget} USD. Travel style: {travel_style}.
Return ONLY valid JSON in this exact format (no markdown, no extra text):
{{
  "destination": "{destination}",
  "total_days": {days},
  "daily_plan": [
    {{
      "day": 1,
      "title": "Day title here",
      "morning": "Morning activity description",
      "afternoon": "Afternoon activity description",
      "evening": "Evening activity description",
      "estimated_cost": 150
    }}
  ],
  "total_estimated_cost": {budget},
  "travel_tips": ["Tip 1", "Tip 2", "Tip 3"]
}}
"""
    try:
        response = model.generate_content(prompt)
        text = _clean_json(response.text)
        # Validate it is parseable JSON before returning
        json.loads(text)
        return text
    except json.JSONDecodeError:
        # Attempt to re-extract JSON from response
        raw = response.text
        match = re.search(r'\{[\s\S]*\}', raw)
        if match:
            candidate = match.group(0)
            json.loads(candidate)  # Will raise if still invalid
            return candidate
        raise ValueError("Gemini did not return valid JSON. Please try again.")
    except Exception as e:
        raise Exception(f"Gemini API error: {str(e)}")

def chat_with_ai(message: str, history: list, trip_context: str = "") -> str:
    system_prompt = (
        "You are TravelMate AI, an elite, professional, and friendly travel assistant. "
        "Provide helpful, highly accurate, and beautifully structured travel advice. "
        "Answer questions about destinations, flights, hotels, visa requirements, packing, local customs, and itineraries.\n\n"
        "FORMATTING RULES:\n"
        "1. Do NOT use markdown heading symbols like '#' or '##'.\n"
        "2. Do NOT use markdown bold/italic symbols like '*' or '**' or '_'.\n"
        "3. Use spacing (empty lines) and paragraphs to make the text clean and readable.\n"
        "4. When listing items, use colorful travel-themed emojis as bullet points instead of asterisks or dashes. For example:\n"
        "   - 📍 for locations/destinations\n"
        "   - ✈️ for flights/travel\n"
        "   - 🏨 for hotels/stays\n"
        "   - 📅 for schedule/dates\n"
        "   - 🍽️ for food/restaurants\n"
        "   - 💡 for tips/advice\n"
        "   - 💵 for budget/costs\n"
        "   - 🌟 for highlights\n"
        "5. Keep the tone helpful, professional, and engaging."
    )
    
    if trip_context:
        system_prompt += f"\n\n{trip_context}"

    # Build chat history — Gemini only accepts 'user' and 'model' roles
    chat_history = []
    for msg in history:
        role = msg.get("role", "")
        content = msg.get("content", "")
        if role == "user":
            chat_history.append({"role": "user", "parts": [content]})
        elif role == "model":
            chat_history.append({"role": "model", "parts": [content]})
        # Skip 'system' messages — not supported by Gemini chat

    try:
        chat = model.start_chat(history=chat_history)
        full_message = f"{system_prompt}\n\nUser: {message}"
        response = chat.send_message(full_message)
        return response.text
    except Exception as e:
        raise Exception(f"Gemini chat error: {str(e)}")
