import os
import json
import re
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

# Initialize Gemini if key is provided
_gemini_client_available = False
if GEMINI_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        _gemini_client_available = True
    except Exception as e:
        print(f"Warning: Failed to configure Google Generative AI: {e}")

def _clean_json(text: str) -> str:
    """Strip markdown code fences from Gemini JSON output."""
    text = text.strip()
    text = re.sub(r'^```(?:json)?\s*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s*```$', '', text)
    return text.strip()

def _get_gemini_model():
    if not _gemini_client_available:
        return None
    import google.generativeai as genai
    # Attempt newer models first
    for model_name in ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-pro']:
        try:
            return genai.GenerativeModel(model_name)
        except Exception:
            continue
    return None

def _generate_fallback_itinerary(destination: str, days: int, budget: float, travel_style: str) -> str:
    """Generates a rich, highly tailored fallback itinerary if external LLM is offline."""
    daily_budget = round(budget / max(days, 1), 2)
    activities_by_style = {
        "Luxury": [
            ("Private VIP historical walking tour & landmark visit", "Fine dining lunch at Michelin-starred bistro", "Sunset yacht harbor cruise & rooftop champagne lounge"),
            ("Chauffeured scenic excursion to iconic cultural quarter", "Exclusive boutique shopping & bespoke afternoon tea", "Private chef tasting menu & opera/theatre performance"),
            ("Helicopter panoramic city flight & scenic vistas", "Luxury thermal spa & wellness retreat afternoon", "Gourmet waterfront dinner with wine pairing"),
        ],
        "Adventure": [
            ("Sunrise mountain ridge hike & panoramic lookout", "Whitewater kayaking / off-road trail expedition", "Campfire cookout or vibrant night street food crawl"),
            ("Rock climbing / coastal cave exploration", "Mountain biking through historic countryside paths", "Local craft brewery tour & live folk music gathering"),
            ("Wilderness trek & hidden waterfall discovery", "Zipline canopy adventure across scenic valley", "Stargazing observatory visit & local tavern dinner"),
        ],
        "Budget": [
            ("Self-guided historic old town walking route", "Local central market exploration & authentic street food lunch", "Free sunset viewpoint at panoramic public park & lively piazza"),
            ("Free museum morning & public art district walk", "Picnic in botanical gardens with artisanal local snacks", "Night market browsing & local social gathering spot"),
            ("Coastal boardwalk stroll or heritage architecture trail", "Community food hall lunch with regional specialties", "Public square open-air music & cultural center event"),
        ],
        "Family": [
            ("Interactive science & history discovery museum", "Family-friendly waterfront park & paddleboat rental", "Themed family dinner & evening boardwalk illumination stroll"),
            ("Local zoo or world-class aquarium excursion", "Hands-on cooking class for traditional regional dishes", "Outdoor cinema or evening puppet / illusionist show"),
            ("Botanical gardens miniature train & butterfly pavilion", "Beach picnic and sandcastle / kayak activities", "Artisan gelato tasting & souvenir craft shopping"),
        ],
        "Relaxation": [
            ("Morning mindful stroll through tranquil botanical gardens", "Thermal hot springs & organic aromatherapy spa treatment", "Seaside promenade sunset walk & candlelit seaside dinner"),
            ("Peaceful tea garden ceremony & historic temple courtyard", "Leisurely brunch followed by private cabana relaxation", "Gentle sunset yoga session & organic farm-to-table dinner"),
            ("Scenic coastal cliff walk & ocean view meditation", "Art gallery immersion & calm reading at heritage bookstore cafe", "Acoustic jazz evening with fine herbal infusions"),
        ]
    }

    style_plans = activities_by_style.get(travel_style, activities_by_style["Luxury"])
    
    daily_plans = []
    for day in range(1, days + 1):
        idx = (day - 1) % len(style_plans)
        morning_act, afternoon_act, evening_act = style_plans[idx]
        
        daily_plans.append({
            "day": day,
            "title": f"Day {day}: Exploring the Essence of {destination}",
            "morning": f"Start your morning with {morning_act} in {destination}.",
            "afternoon": f"Spend the afternoon with {afternoon_act}.",
            "evening": f"Conclude your evening with {evening_act}.",
            "estimated_cost": daily_budget
        })

    travel_tips = [
        f"Download offline transit maps for {destination} and keep local currency on hand.",
        f"Book top landmarks in {destination} 3-5 days ahead to bypass queues.",
        f"Try authentic local regional delicacies and ask resident shopkeepers for their favorite hidden gems.",
        f"Pack comfortable walking shoes and weather-appropriate layers for outdoor activities.",
        f"Always check local public transport passes for discounted multi-day travel."
    ]

    return json.dumps({
        "destination": destination,
        "total_days": days,
        "daily_plan": daily_plans,
        "total_estimated_cost": budget,
        "travel_tips": travel_tips
    }, indent=2)

def generate_itinerary(destination: str, days: int, budget: float, travel_style: str) -> str:
    model = _get_gemini_model()
    if not model:
        return _generate_fallback_itinerary(destination, days, budget, travel_style)

    prompt = f"""Create a detailed {days}-day travel itinerary for {destination}.
Budget: ${budget} USD. Travel style: {travel_style}.
Return ONLY valid JSON in this exact format (no markdown, no backticks, no extra text):
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
  "travel_tips": ["Tip 1", "Tip 2", "Tip 3", "Tip 4"]
}}
"""
    try:
        response = model.generate_content(prompt)
        text = _clean_json(response.text)
        json.loads(text)  # Validate JSON parse
        return text
    except Exception as e:
        print(f"Gemini API generation error ({e}), falling back to intelligent travel engine.")
        return _generate_fallback_itinerary(destination, days, budget, travel_style)

def chat_with_ai(message: str, history: list, trip_context: str = "") -> str:
    model = _get_gemini_model()
    
    if not model:
        # High quality fallback AI Travel Assistant response
        lower_msg = message.lower()
        if "pack" in lower_msg:
            return (
                f"🧳 **Smart Packing Checklist**\n\n"
                f"• Essential documents: Passport, visa, travel insurance, digital & printed booking vouchers\n"
                f"• Electronics: Universal power adapter, portable power bank, noise-cancelling headphones\n"
                f"• Clothing: Versatile breathable layers, moisture-wicking shirts, lightweight rain shell, walking shoes\n"
                f"• Health & Wellness: Basic first-aid kit, prescription medications, SPF 50 sunscreen, hydration tablets\n\n"
                f"💡 *Pro-tip: Roll your clothes instead of folding to save 30% luggage space!*"
            )
        elif "flight" in lower_msg or "cheap" in lower_msg:
            return (
                f"✈️ **Flight Booking Hacks & Strategies**\n\n"
                f"📍 Set price alerts on Google Flights & Skyscanner 6–8 weeks before departure.\n"
                f"📅 Tuesdays and Wednesdays generally offer the lowest average airfares.\n"
                f"💳 Use airline co-branded credit cards to waive baggage fees and earn bonus miles.\n"
                f"🔄 Look out for nearby alternative secondary airports for savings of up to 40%."
            )
        elif "hotel" in lower_msg or "stay" in lower_msg:
            return (
                f"🏨 **Hotel & Stay Recommendations**\n\n"
                f"📍 Stay close to central metro/tram stations to reduce daily transit time.\n"
                f"🌟 Check guest reviews from the past 3 months for updated cleanliness and WiFi reliability.\n"
                f"💵 Contact the property directly after finding an online rate to ask for complimentary breakfast or room upgrades."
            )
        elif trip_context:
            return (
                f"🌟 **Tailored Recommendations for Your Trip**\n\n"
                f"Based on your active trip:\n"
                f"📍 Ensure you check opening hours for top attractions and pre-book popular experiences.\n"
                f"🍽️ Allocate about 30% of your daily budget for local food and spontaneous exploration.\n"
                f"🚶 Plan morning excursions early to beat tourist queues and capture optimal photography lighting.\n\n"
                f"Feel free to ask for specific restaurant suggestions, safety guidelines, or day-by-day tweaks!"
            )
        else:
            return (
                f"✨ **TravelMate AI Assistant**\n\n"
                f"Hello! I am your AI travel companion. I can help you with:\n\n"
                f"📍 Curating custom day-by-day itineraries tailored to your style and budget\n"
                f"✈️ Finding flight routes and timing tips\n"
                f"🏨 Choosing neighborhood stays and accommodations\n"
                f"🌦️ Checking weather forecasts and packing recommendations\n"
                f"💡 Local customs, visa prerequisites, and safety advice\n\n"
                f"Where are you dreaming of traveling next?"
            )

    system_prompt = (
        "You are TravelMate AI, an elite, professional, and friendly travel assistant. "
        "Provide helpful, highly accurate, and beautifully structured travel advice. "
        "Answer questions about destinations, flights, hotels, visa requirements, packing, local customs, and itineraries.\n\n"
        "FORMATTING RULES:\n"
        "1. Use clean spacing and clear paragraphs.\n"
        "2. When listing items, use colorful travel-themed emojis as bullet points (📍 ✈️ 🏨 📅 🍽️ 💡 💵 🌟).\n"
        "3. Keep the tone helpful, professional, warm, and engaging."
    )
    
    if trip_context:
        system_prompt += f"\n\n{trip_context}"

    chat_history = []
    for msg in history:
        role = msg.get("role", "")
        content = msg.get("content", "")
        if role == "user":
            chat_history.append({"role": "user", "parts": [content]})
        elif role == "model":
            chat_history.append({"role": "model", "parts": [content]})

    try:
        chat = model.start_chat(history=chat_history)
        full_message = f"{system_prompt}\n\nUser: {message}"
        response = chat.send_message(full_message)
        return response.text
    except Exception as e:
        print(f"Gemini chat error ({e}), providing assistant fallback.")
        return f"📍 **TravelMate AI Assistant**\n\nRegarding **{message}**:\n\n• For this destination, research local transit options and book iconic attractions ahead of time.\n• Check seasonal weather conditions to pack appropriate apparel.\n• Feel free to configure your itinerary in the 'Plan Trip' tab for a full day-by-day plan!"

