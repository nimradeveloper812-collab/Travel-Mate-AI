import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { TableShimmer } from '../components/Shimmer';

interface HotelItem {
  name: string;
  stars: number;
  price?: number;
}

export default function Hotels() {
  const [formData, setFormData] = useState({
    city: 'Miami',
    checkin: '',
    checkout: ''
  });
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState<HotelItem[] | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setHotels(null);
    setFallbackMode(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setHotels(null);
    setFallbackMode(false);

    try {
      const response = await api.post('/hotels/search', {
        city: formData.city,
        checkin: formData.checkin,
        checkout: formData.checkout
      });
      
      const list = response.data?.data;
      if (list && list.length > 0) {
        setHotels(list);
      } else {
        setHotels([]);
      }
    } catch (err) {
      setFallbackMode(true);
      // Fallback details
      setHotels([
        { name: 'Grand Plaza Resort', stars: 4, price: 180 },
        { name: 'The Ritz Ocean Front', stars: 5, price: 340 },
        { name: 'Sands Motel & Lodge', stars: 3, price: 95 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Parameter Form */}
      <div className="border border-slate-200/60 bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Find Hotels</h3>
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Destination City</label>
            <input 
              type="text" 
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl outline-none text-sm focus:border-blue-500 focus:bg-white transition-all"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Check In Date</label>
            <input 
              type="date" 
              name="checkin"
              value={formData.checkin}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl outline-none text-sm focus:border-blue-500 focus:bg-white transition-all"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Check Out Date</label>
            <input 
              type="date" 
              name="checkout"
              value={formData.checkout}
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
            <span>Search Hotels</span>
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
      {hotels && !loading && (
        <div className="border border-slate-200/60 bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-800">Hotel Properties</h3>
          
          {hotels.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-4">Property</th>
                    <th className="pb-4">Rating</th>
                    <th className="pb-4">Est. Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {hotels.map((h, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 font-bold text-slate-800">{h.name}</td>
                      <td className="py-4 text-amber-500 font-medium">
                        {'★'.repeat(Math.round(h.stars || 3))}
                      </td>
                      <td className="py-4 font-black text-emerald-600 text-base">${h.price || 120} / night</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
              No hotels found at this destination.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
