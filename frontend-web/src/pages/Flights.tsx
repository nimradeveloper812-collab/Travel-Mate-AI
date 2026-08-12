import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { TableShimmer } from '../components/Shimmer';

interface FlightItem {
  legs: {
    carriers: { marketing: { name: string }[] }[];
    departure: string;
    arrival: string;
    stopCount: number;
  }[];
  price: { formatted: string };
}

export default function Flights() {
  const [formData, setFormData] = useState({
    origin: 'New York',
    destination: 'London',
    date: ''
  });
  const [loading, setLoading] = useState(false);
  const [flights, setFlights] = useState<FlightItem[] | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFlights(null);
    setFallbackMode(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFlights(null);
    setFallbackMode(false);

    try {
      const response = await api.post('/flights/search', {
        origin: formData.origin,
        destination: formData.destination,
        date: formData.date
      });
      
      const itineraries = response.data?.data?.itineraries;
      if (itineraries && itineraries.length > 0) {
        setFlights(itineraries);
      } else {
        setFlights([]);
      }
    } catch (err) {
      setFallbackMode(true);
      // Fallback details
      setFlights([
        {
          legs: [{ carriers: [{ marketing: [{ name: 'United Airlines' }] }], departure: `${formData.date}T08:00:00`, arrival: `${formData.date}T12:30:00`, stopCount: 0 }],
          price: { formatted: '$450' }
        },
        {
          legs: [{ carriers: [{ marketing: [{ name: 'Delta Air Lines' }] }], departure: `${formData.date}T11:15:00`, arrival: `${formData.date}T15:45:00`, stopCount: 0 }],
          price: { formatted: '$495' }
        },
        {
          legs: [{ carriers: [{ marketing: [{ name: 'British Airways' }] }], departure: `${formData.date}T18:30:00`, arrival: `${formData.date}T23:00:00`, stopCount: 1 }],
          price: { formatted: '$610' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Parameter Form */}
      <div className="border border-slate-200/60 bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Find Flights</h3>
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Origin City</label>
            <input 
              type="text" 
              name="origin"
              value={formData.origin}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl outline-none text-sm focus:border-blue-500 focus:bg-white transition-all"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Destination City</label>
            <input 
              type="text" 
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl outline-none text-sm focus:border-blue-500 focus:bg-white transition-all"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Date</label>
            <input 
              type="date" 
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl outline-none text-sm focus:border-blue-500 focus:bg-white transition-all"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="py-3 px-6 bg-gradient-to-r from-sky-400 to-blue-600 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer interactive"
          >
            <span>Search Flights</span>
          </button>
        </form>
      </div>

      {/* Loading & Fallback Alerts */}
      {loading && <TableShimmer />}
      
      {fallbackMode && (
        <div className="p-4 bg-amber-50 border border-amber-100 text-amber-700 rounded-2xl flex items-start space-x-3 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>API limits reached or RapidAPI keys not set. Showing simulated search offers.</span>
        </div>
      )}

      {/* Results viewport */}
      {flights && !loading && (
        <div className="border border-slate-200/60 bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-800">Flight Offers</h3>
          
          {flights.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-4">Airline</th>
                    <th className="pb-4">Departure</th>
                    <th className="pb-4">Arrival</th>
                    <th className="pb-4">Stops</th>
                    <th className="pb-4">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {flights.map((fl, idx) => {
                    const leg = fl.legs[0];
                    const carrier = leg.carriers[0]?.marketing[0]?.name || 'Unknown Airline';
                    const depTime = new Date(leg.departure).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const arrTime = new Date(leg.arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 font-bold text-slate-800">{carrier}</td>
                        <td className="py-4 text-slate-600">{depTime}</td>
                        <td className="py-4 text-slate-600">{arrTime}</td>
                        <td className="py-4 text-slate-500 font-medium">
                          {leg.stopCount === 0 ? 'Direct' : `${leg.stopCount} stops`}
                        </td>
                        <td className="py-4 font-black text-emerald-600 text-base">{fl.price.formatted}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
              No flight routes found for selected dates. Try a different day.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
