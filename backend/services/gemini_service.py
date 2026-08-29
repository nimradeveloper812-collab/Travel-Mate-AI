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
    """Generates a rich, realistic itinerary with dynamic daily cost distributions and budget feasibility checks."""
    days = max(1, min(days, 30))
    avg_daily = budget / days

    # Budget reality checks & style adaptation
    is_tight_budget = (travel_style == "Luxury" and avg_daily < 120) or (avg_daily < 40)
    
    # Define varied activity sets
    if is_tight_budget:
        activities_pool = [
            ("Free walking tour of historic Old Town & local street market", "Scenic public beach relaxation & picnic with local deli treats", "Panoramic sunset from city viewpoint & affordable night bazaar"),
            ("Self-guided architectural walk & public museum free-entry hours", "Lunch at popular neighborhood street vendor & botanical park stroll", "Evening stroll along lighted waterfront promenade & artisan gelato"),
            ("Local bus excursion to nearby scenic nature trail & temple grounds", "Casual cafe lunch & independent craft market browsing", "Open-air community music performance & street food dinner"),
            ("Morning swim/hike at local nature reserve & photo session", "Afternoon cultural center visit & historic alleyways", "Sunset harbor walk & local night food court exploration"),
            ("Bicycle rental along scenic greenway & heritage quarter", "Local farm food stall lunch & souvenir bargaining", "Cozy evening at local acoustic tea/coffee lounge")
        ]
    elif travel_style == "Luxury":
        activities_pool = [
            ("Private VIP historical walking tour & landmark skip-the-line visit", "Fine dining lunch at renowned waterfront bistro", "Sunset yacht harbor cruise & rooftop champagne lounge"),
            ("Chauffeured scenic excursion to iconic cultural quarter", "Exclusive boutique shopping & bespoke afternoon tea", "Private chef tasting menu & opera/theatre performance"),
            ("Helicopter / panoramic scenic flight over coastal highlights", "Luxury spa wellness treatment & infinity pool cabana", "Gourmet Michelin-curated dinner with sommelier wine pairing"),
            ("Private boat charter to secluded coves & snorkeling reefs", "Artisan gourmet lunch & private art collection viewing", "Seaside candlelit dinner with live private jazz quartet"),
            ("Exclusive guided sunrise tour of heritage monuments", "High-end shopping in luxury fashion district & gourmet lunch", "Celebratory rooftop dining with panoramic skyline night views")
        ]
    elif travel_style == "Adventure":
        activities_pool = [
            ("Guided mountain ridge trek & sunrise lookout climb", "Wilderness river kayaking & scenic riverside picnic", "Campfire barbecue under the stars & stargazing session"),
            ("Off-road 4x4 safari expedition to remote waterfall gorges", "Canyoning or rock climbing with certified mountain guides", "Hearty regional tavern dinner & local craft brew tasting"),
            ("Coastal cliff trail exploration & hidden sea cave swim", "Mountain bike descent through alpine forests", "Sunset beach bonfire with fresh grilled seafood"),
            ("Whitewater rafting adventure through scenic river canyon", "Trailside picnic & wildlife observation hike", "Rustic mountain lodge dinner & storytelling by the hearth"),
            ("Scuba diving / reef exploration at protected marine reserve", "Afternoon coastal zipline course & jungle canopy walk", "Lively local harbor pub with traditional music")
        ]
    elif travel_style == "Family":
        activities_pool = [
            ("Interactive science & history discovery museum", "Family-friendly waterfront park & paddleboat rental", "Themed family dinner & evening boardwalk illumination stroll"),
            ("Local zoo or world-class aquarium excursion", "Hands-on cooking class for traditional regional dishes", "Outdoor cinema or evening puppet / illusionist show"),
            ("Botanical gardens miniature train & butterfly pavilion", "Beach picnic and sandcastle / kayak activities", "Artisan gelato tasting & souvenir craft shopping"),
            ("Theme park or adventure ropes course for all ages", "Casual family lunch at open-air cafe & playground visit", "Evening beach stroll and stargazing"),
            ("Hands-on ceramic craft workshop & local landmark tour", "Picnic lunch in scenic public gardens with duck pond", "Family pizza-making night & board games")
        ]
    else:  # Relaxation
        activities_pool = [
            ("Morning mindful stroll through tranquil botanical gardens", "Thermal hot springs & organic aromatherapy spa treatment", "Seaside promenade sunset walk & candlelit seaside dinner"),
            ("Peaceful tea garden ceremony & historic temple courtyard", "Leisurely brunch followed by private cabana relaxation", "Gentle sunset yoga session & organic farm-to-table dinner"),
            ("Scenic coastal cliff walk & ocean view meditation", "Art gallery immersion & calm reading at heritage bookstore cafe", "Acoustic jazz evening with fine herbal infusions"),
            ("Private beach day with sun lounger & refreshing smoothie bar", "Hydrotherapy pool & soothing full-body massage", "Romantic sunset dinner with soothing ocean waves"),
            ("Sunrise meditation by the water & quiet breakfast buffet", "Botanical conservatory walk & peaceful afternoon siesta", "Calm harbor catamaran cruise with light refreshments")
        ]

    # Generate realistic variable daily budgets that sum up to total budget
    weight_multipliers = []
    for d in range(1, days + 1):
        if d == 1:
            weight = 0.7  # Arrival day (settling in)
        elif d == days and days > 1:
            weight = 0.6  # Departure day
        elif d % 3 == 0:
            weight = 1.3  # Big excursion day
        elif d % 2 == 0:
            weight = 1.1  # Active day
        else:
            weight = 0.9  # Standard leisure day
        weight_multipliers.append(weight)

    total_weight = sum(weight_multipliers)
    daily_plans = []
    current_spent = 0.0

    day_titles = [
        "Arrival, Settling In & First Impressions",
        "Iconic Landmarks & Historic Quarter",
        "Scenic Nature, Waterways & Hidden Gems",
        "Culinary Exploration & Local Culture",
        "Adventure Excursion & Panoramic Lookouts",
        "Arts, Architecture & Craft Markets",
        "Coastal Breezes & Waterfront Leisure",
        "Historic Day-Trip & Heritage Discoveries",
        "Thermal Wellness & Afternoon Relaxation",
        "Local Traditions & Neighborhood Immersion",
        "Island Hopping & Scenic Lookouts",
        "Botanical Wonders & Serene Escapes",
        "Shopping, Souvenirs & Hidden Cafes",
        "Celebratory Sunset Experiences",
        "Final Morning Memories & Departure"
    ]

    for day in range(1, days + 1):
        idx = (day - 1) % len(activities_pool)
        morning_act, afternoon_act, evening_act = activities_pool[idx]
        title_idx = (day - 1) % len(day_titles)
        
        # Calculate variable cost
        if day == days:
            day_cost = round(max(5.0, budget - current_spent), 2)
        else:
            day_cost = round((weight_multipliers[day - 1] / total_weight) * budget, 2)
            current_spent += day_cost

        daily_plans.append({
            "day": day,
            "title": f"Day {day}: {day_titles[title_idx]}",
            "morning": f"Start your morning with {morning_act} in {destination}.",
            "afternoon": f"Spend the afternoon with {afternoon_act}.",
            "evening": f"Conclude your evening with {evening_act}.",
            "estimated_cost": day_cost
        })

    travel_tips = [
        f"Download offline transit maps for {destination} and keep small local currency bills on hand.",
        f"Book top landmarks and cultural sites in {destination} 3-5 days in advance to secure tickets.",
        f"Try authentic local regional eateries and ask resident shopkeepers for their favorite hidden dining spots.",
        f"Pack comfortable walking shoes and weather-appropriate layers for varied outdoor climates."
    ]

    if is_tight_budget:
        travel_tips.insert(0, f"💡 Budget Advisory: An average of ${avg_daily:.1f}/day is a strict budget for {destination}. We tailored activities around self-guided exploration, free landmarks, and local street food to maximize your experience without overspending.")

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

    prompt = f"""Create a realistic, detailed {days}-day travel itinerary for {destination}.
Total Budget: ${budget} USD. Travel style: {travel_style}.

Requirements:
1. Distribute daily costs realistically so each day has a realistic varied cost (not equal splits) and the sum equals ${budget}.
2. If the budget is low for {days} days (${budget/days:.1f}/day), realistically adapt the activities (e.g. scenic viewpoints, free cultural sites, street food, public transport) instead of unrealistic luxury claims, and add an honest budget advisory tip.
3. Return ONLY valid JSON in this exact structure (no markdown fences, no extra text):
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
      "estimated_cost": 45.0
    }}
  ],
  "total_estimated_cost": {budget},
  "travel_tips": ["Tip 1", "Tip 2", "Tip 3"]
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

