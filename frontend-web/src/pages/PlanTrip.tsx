import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Compass,
  Sparkles,
  Calendar,
  BookmarkCheck,
  Printer,
  MapPin,
  Coffee,
  Sun,
  Moon,
  Check,
  AlertCircle
} from 'lucide-react';

import api from '../lib/api';
import { useToast } from '../context/ToastContext';

interface DailyPlan {
  day: number;
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
  estimated_cost: number;
}

interface Itinerary {
  destination: string;
  total_days: number;
  daily_plan: DailyPlan[];
  total_estimated_cost: number;
  travel_tips: string[];
}

const travelStyles = [
  { id: 'Adventure', label: 'Adventure & Hiking', desc: 'Active treks, scenic trails, outdoor exploration' },
  { id: 'Luxury', label: 'Luxury & Comfort', desc: 'Fine dining, boutique stays, VIP experiences' },
  { id: 'Budget', label: 'Budget / Backpacker', desc: 'Hostels, local markets, public transit routes' },
  { id: 'Family', label: 'Family Friendly', desc: 'Theme parks, interactive museums, calm pacing' },
  { id: 'Relaxation', label: 'Relaxation & Spa', desc: 'Hot springs, tranquil beaches, wellness escapes' },
];

const popularCities = ['Tokyo', 'Paris', 'Rome', 'Bali', 'Swiss Alps', 'Barcelona', 'New York', 'Dubai'];

export default function PlanTrip() {
  const [searchParams] = useSearchParams();
  const { success, error: toastError } = useToast();


  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState<number>(1500);
  const [travelStyle, setTravelStyle] = useState(searchParams.get('style') || 'Adventure');
  const [customNotes, setCustomNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  // Set default dates if empty: next week for 5 days
  useEffect(() => {
    if (!startDate && !endDate) {
      const today = new Date();
      const start = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const end = new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [startDate, endDate]);

  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) {
      setError('Please provide a destination city or country.');
      return;
    }

    setLoading(true);
    setError('');
    setItinerary(null);
    setSaved(false);

    try {
      const response = await api.post('/itinerary/generate', {
        destination: destination.trim(),
        start_date: startDate,
        end_date: endDate,
        budget: Number(budget),
        travel_style: travelStyle,
      });

      setItinerary(response.data);
      success(`Generated ${response.data.total_days}-day itinerary for ${destination}!`, 'Plan Ready');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to generate itinerary. Please try again.';
      setError(msg);
      toastError(msg, 'Generation Error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!itinerary) return;
    try {
      await api.post('/trips/save', {
        destination: itinerary.destination,
        start_date: startDate,
        end_date: endDate,
        budget: Number(budget),
        travel_style: travelStyle,
        itinerary_json: JSON.stringify(itinerary),
        notes_json: customNotes ? JSON.stringify({ user_notes: customNotes }) : null,
      });
      setSaved(true);
      success('Trip successfully saved to your Saved Trips & Dashboard!', 'Saved');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to save itinerary.';
      toastError(msg, 'Save Error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const totalDays = calculateDays();

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center space-x-2.5">
            <Compass className="w-6 h-6 text-sky-500" />
            <span>AI Trip Planner</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Customize parameters and let Gemini AI create a complete daily schedule with estimated costs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form Settings Panel */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <form onSubmit={handleGenerate} className="space-y-5">
            
            {/* Destination */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center justify-between">
                <span>Destination</span>
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Kyoto, Paris, Reykjavik"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:border-blue-500 focus:bg-white transition-all font-semibold"
                required
              />
              {/* Popular chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {popularCities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setDestination(city)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-600 text-slate-600 transition-colors"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div className="text-xs font-bold text-sky-700 bg-sky-50 p-2.5 rounded-xl flex items-center justify-between">
              <span>Trip Duration:</span>
              <span>{totalDays} Day{totalDays > 1 ? 's' : ''}</span>
            </div>

            {/* Budget */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Total Budget (USD)</label>
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    min="0"
                    max="1000000000000"
                    value={budget}
                    onChange={(e) => setBudget(Math.max(0, Number(e.target.value)))}
                    className="w-24 px-2.5 py-1 text-right text-sm font-black text-emerald-600 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="30000"
                step="50"
                value={Math.min(budget, 30000)}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />

              <div className="flex flex-wrap justify-between gap-1">
                {[0, 500, 1500, 5000, 20000, 100000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setBudget(val)}
                    className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                      budget === val
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    ${val >= 1000 ? `${val / 1000}k` : val}
                  </button>
                ))}
              </div>

              {/* Real-time 2026 Budget Reality Check Warning */}
              {budget < totalDays * 25 && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-700 font-semibold space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-red-800">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
                    <span>2026 Budget Reality Check</span>
                  </div>
                  <p className="leading-tight">
                    ${budget} for {totalDays} days (${(budget / Math.max(1, totalDays)).toFixed(1)}/day) is insufficient for real travel in 2026! Basic lodging, food, and metro require at least ~$35–$50/day.
                  </p>
                </div>
              )}
            </div>


            {/* Travel Style Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Travel Style</label>
              <div className="space-y-1.5">
                {travelStyles.map((s) => (
                  <label
                    key={s.id}
                    onClick={() => setTravelStyle(s.id)}
                    className={`p-3 rounded-2xl border flex items-start space-x-3 cursor-pointer transition-all ${
                      travelStyle === s.id
                        ? 'border-blue-500 bg-blue-50/60 shadow-xs'
                        : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="travelStyle"
                      checked={travelStyle === s.id}
                      onChange={() => setTravelStyle(s.id)}
                      className="mt-1 accent-blue-600"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-slate-800">{s.label}</p>
                      <p className="text-[11px] text-slate-500">{s.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 hover:from-sky-500 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 active:scale-98"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating Itinerary with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Travel Itinerary</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs min-h-[550px] flex flex-col justify-between">
            
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-800">
                  {itinerary ? `${itinerary.destination} Itinerary` : 'Your Generated Plan'}
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {itinerary ? `${itinerary.total_days} Days | Budget: $${itinerary.total_estimated_cost}` : 'Enter your preferences on the left to start.'}
                </p>
              </div>

              {itinerary && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handlePrint}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                    title="Print Itinerary"
                  >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">Print</span>
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={saved}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-xs ${
                      saved
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700 shadow-blue-500/20'
                    }`}
                  >
                    {saved ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Saved to Trips</span>
                      </>
                    ) : (
                      <>
                        <BookmarkCheck className="w-4 h-4" />
                        <span>Save Trip</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Main Content State Rendering */}
            <div className="flex-1 py-6">
              
              {loading && (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-inner">
                    <Sparkles className="w-8 h-8 animate-spin-slow" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-slate-800">Gemini AI is crafting your trip...</h4>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Analyzing local landmarks, estimating costs, and structuring morning, afternoon, and evening experiences.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {!itinerary && !loading && !error && (
                <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h4 className="text-base font-bold text-slate-700">No active itinerary generated</h4>
                    <p className="text-xs text-slate-400">
                      Choose your dream destination, dates, and travel style on the left panel, then hit "Generate Travel Itinerary".
                    </p>
                  </div>
                </div>
              )}

              {itinerary && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-8"
                >
                  
                  {/* Summary Bar */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-blue-50/60 to-indigo-50 border border-sky-100 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                        {travelStyle} Journey
                      </span>
                      <h4 className="text-2xl font-black text-slate-800 mt-1">{itinerary.destination}</h4>
                    </div>
                    <div className="flex items-center space-x-6 text-center">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Duration</span>
                        <p className="text-lg font-black text-slate-800">{itinerary.total_days} Days</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Est. Cost</span>
                        <p className="text-lg font-black text-emerald-600">${itinerary.total_estimated_cost}</p>
                      </div>
                    </div>
                  </div>

                  {/* Day-by-Day Timeline */}
                  <div className="space-y-6 relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                    {itinerary.daily_plan.map((day, idx) => (
                      <motion.div
                        key={day.day}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="relative pl-12 space-y-3 group"
                      >
                        {/* Timeline Day Dot */}
                        <div className="absolute left-2 top-0 w-7 h-7 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 border-4 border-white shadow-sm flex items-center justify-center text-white text-[11px] font-black z-10 group-hover:scale-110 transition-transform">
                          {day.day}
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-slate-300 hover:bg-white transition-all space-y-3.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <h5 className="font-extrabold text-slate-800 text-sm">{day.title}</h5>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                              Est. ${day.estimated_cost}
                            </span>
                          </div>

                          <div className="space-y-2.5 text-xs text-slate-600">
                            <div className="flex items-start space-x-2.5">
                              <Coffee className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                              <p><strong className="text-slate-800 font-bold">Morning:</strong> {day.morning}</p>
                            </div>
                            <div className="flex items-start space-x-2.5">
                              <Sun className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                              <p><strong className="text-slate-800 font-bold">Afternoon:</strong> {day.afternoon}</p>
                            </div>
                            <div className="flex items-start space-x-2.5">
                              <Moon className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                              <p><strong className="text-slate-800 font-bold">Evening:</strong> {day.evening}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Travel Tips & Packing Advice */}
                  {itinerary.travel_tips && itinerary.travel_tips.length > 0 && (
                    <div className="p-6 rounded-3xl bg-amber-50/50 border border-amber-200/60 space-y-3">
                      <h5 className="font-extrabold text-slate-800 text-sm flex items-center space-x-2">
                        <span>💡 Local Tips & Recommendations</span>
                      </h5>
                      <ul className="space-y-2 text-xs text-slate-700">
                        {itinerary.travel_tips.map((tip, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Optional Custom Notes */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Personal Trip Notes (Optional)
                    </label>
                    <textarea
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      placeholder="Add personal notes, packing reminders, or flight booking references..."
                      rows={3}
                      className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                </motion.div>
              )}

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
