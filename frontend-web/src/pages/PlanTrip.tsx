import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, Check, AlertCircle } from 'lucide-react';
import api from '../lib/api';

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

export default function PlanTrip() {
  const [formData, setFormData] = useState({
    destination: '',
    start_date: '',
    end_date: '',
    budget: 1500,
    travel_style: 'Luxury'
  });
  
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setItinerary(null);
    setSaved(false);

    try {
      const response = await api.post('/itinerary/generate', {
        destination: formData.destination,
        start_date: formData.start_date,
        end_date: formData.end_date,
        budget: parseFloat(formData.budget.toString()),
        travel_style: formData.travel_style
      });
      setItinerary(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'Failed to connect to Gemini API. Please check backend environment keys.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!itinerary) return;
    try {
      await api.post('/trips/save', {
        destination: formData.destination,
        start_date: formData.start_date,
        end_date: formData.end_date,
        budget: parseFloat(formData.budget.toString()),
        travel_style: formData.travel_style,
        itinerary_json: JSON.stringify(itinerary)
      });
      setSaved(true);
      alert('Trip saved to your Dashboard!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save itinerary.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full items-start">
      
      {/* Parameters Panel */}
      <div className="lg:col-span-4 border border-slate-200/60 bg-white rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <span>AI Itinerary Planner</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">Configure your travel parameters for custom Gemini results.</p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Destination City</label>
            <input 
              type="text" 
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              placeholder="e.g. Paris, Tokyo, Sydney"
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl outline-none text-sm focus:border-blue-500 focus:bg-white transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Start Date</label>
              <input 
                type="date" 
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl outline-none text-sm focus:border-blue-500 focus:bg-white transition-all"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">End Date</label>
              <input 
                type="date" 
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl outline-none text-sm focus:border-blue-500 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Budget (USD)</label>
            <input 
              type="number" 
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl outline-none text-sm focus:border-blue-500 focus:bg-white transition-all"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Travel Style</label>
            <select 
              name="travel_style"
              value={formData.travel_style}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl outline-none text-sm focus:border-blue-500 focus:bg-white transition-all"
            >
              <option value="Luxury">Luxury & Comfort</option>
              <option value="Budget">Budget / Backpacker</option>
              <option value="Adventure">Adventure & Hiking</option>
              <option value="Family">Family Friendly</option>
              <option value="Relaxation">Relaxation & Spa</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-sky-400 to-blue-600 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer interactive"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <span>Plan Travel Guide</span>
            )}
          </button>
        </form>
      </div>

      {/* Output Panel */}
      <div className="lg:col-span-8 h-full">
        <div className="border border-slate-200/60 bg-white rounded-2xl p-6 shadow-sm h-full flex flex-col min-h-[500px]">
          
          <div className="border-b border-slate-100 pb-4 flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Your Plan Output</h3>
            {itinerary && (
              <button 
                onClick={handleSave}
                disabled={saved}
                className={`px-4 py-2 text-xs font-bold rounded-xl border flex items-center space-x-2 cursor-pointer transition-all interactive ${
                  saved 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                }`}
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved</span>
                  </>
                ) : (
                  <span>Save to Dashboard</span>
                )}
              </button>
            )}
          </div>

          {/* Conditional Rendering based on state */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="h-full flex flex-col items-center justify-center space-y-4 py-16">
                <span className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-sm font-semibold text-slate-500">Gemini AI is analyzing destinations...</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-start space-x-3 text-sm font-medium">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {!itinerary && !loading && !error && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-16">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-sm max-w-xs">Fill parameters on the left side to get a fully customized day-by-day plan.</p>
              </div>
            )}

            {itinerary && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8 pr-2"
              >
                <div className="bg-sky-50/50 border border-sky-100 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h4 className="text-2xl font-black text-slate-800">{itinerary.destination}</h4>
                    <span className="text-xs text-sky-600 font-bold uppercase tracking-wider">
                      {formData.travel_style} Trip Profile
                    </span>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Days</span>
                      <p className="text-xl font-bold text-slate-800">{itinerary.total_days}</p>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Cost</span>
                      <p className="text-xl font-bold text-slate-800">${itinerary.total_estimated_cost}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                  {itinerary.daily_plan.map((day, idx) => (
                    <motion.div
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      key={day.day}
                      className="relative pl-12 space-y-2 group"
                    >
                      <div className="absolute left-3.5 top-1 w-6.5 h-6.5 rounded-full border-4 border-white bg-blue-500 shadow-sm flex items-center justify-center text-[10px] font-bold text-white z-10 transition-transform group-hover:scale-110">
                        {day.day}
                      </div>
                      <h5 className="text-base font-bold text-slate-800 pt-0.5">{day.title}</h5>
                      <div className="bg-white border border-slate-100 hover:border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3 text-sm text-slate-600 transition-all">
                        <p><strong>Morning:</strong> {day.morning}</p>
                        <p><strong>Afternoon:</strong> {day.afternoon}</p>
                        <p><strong>Evening:</strong> {day.evening}</p>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                          <span className="text-xs font-semibold text-slate-400 uppercase">Estimated Budget</span>
                          <span className="font-bold text-emerald-600">${day.estimated_cost}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {itinerary.travel_tips && itinerary.travel_tips.length > 0 && (
                  <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-6 space-y-4">
                    <h5 className="font-bold text-slate-800">Important Suggestions</h5>
                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
                      {itinerary.travel_tips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}

          </div>

        </div>
      </div>

    </div>
  );
}
