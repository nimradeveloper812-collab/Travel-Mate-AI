import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { StatsShimmer } from '../components/Shimmer';

interface ForecastItem {
  dt: number;
  main: { temp: number };
  weather: { description: string }[];
}

export default function Weather() {
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState<ForecastItem[] | null>(null);
  const [cityName, setCityName] = useState('');
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setForecast(null);
    setError('');

    try {
      const response = await api.post('/weather/search', { city });
      
      const list = response.data?.list;
      if (list && list.length > 0) {
        // OpenWeatherMap returns 3-hour steps. Grab one measurement per day (every 8th item)
        const dailyForecast: ForecastItem[] = [];
        for (let i = 0; i < list.length; i += 8) {
          dailyForecast.push(list[i]);
        }
        setForecast(dailyForecast);
        setCityName(`${response.data.city.name}, ${response.data.city.country}`);
      } else {
        setForecast([]);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'Failed to fetch weather. Please verify OpenWeatherMap API configuration.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Parameter Form */}
      <div className="border border-slate-200/60 bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Check Forecast</h3>
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end max-w-xl">
          <div className="flex-1 space-y-1 w-full">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">City Name</label>
            <input 
              type="text" 
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. London, Zurich, Tokyo"
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl outline-none text-sm focus:border-blue-500 focus:bg-white transition-all"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="py-3 px-6 bg-gradient-to-r from-sky-400 to-blue-600 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer interactive w-full md:w-auto shrink-0"
          >
            <span>Get Forecast</span>
          </button>
        </form>
      </div>

      {/* Loading states */}
      {loading && <StatsShimmer />}

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-start space-x-3 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Viewport */}
      {forecast && !loading && (
        <div className="border border-slate-200/60 bg-white rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-slate-800">5-Day Forecast for {cityName}</h3>
          
          {forecast.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {forecast.map((item, idx) => {
                const date = new Date(item.dt * 1000).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                const temp = Math.round(item.main.temp);
                const desc = item.weather[0].description;
                
                return (
                  <div key={idx} className="bg-slate-50/50 border border-slate-100 hover:border-slate-200/80 p-5 rounded-2xl text-center space-y-3 transition-all hover:-translate-y-0.5 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{date}</span>
                    <span className="text-3xl font-extrabold text-slate-800 block">{temp}°C</span>
                    <span className="text-xs font-semibold text-sky-500 capitalize block">{desc}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
              No weather forecast data found.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
