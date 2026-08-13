import { useEffect, useState } from 'react';
import { Trash2, Eye, X } from 'lucide-react';
import api from '../lib/api';
import { CardShimmer } from '../components/Shimmer';

interface Trip {
  id: number;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  travel_style: string;
  itinerary_json: string;
  flights_json?: string;
  hotels_json?: string;
}

export default function SavedTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const fetchTrips = async () => {
    try {
      const response = await api.get('/trips/my-trips');
      setTrips(response.data);
    } catch (err) {
      console.error('Error fetching saved trips', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this trip itinerary?')) return;
    try {
      await api.delete(`/trips/${id}`);
      setTrips((prev) => prev.filter((t) => t.id !== id));
      if (selectedTrip?.id === id) {
        setSelectedTrip(null);
      }
    } catch (err) {
      alert('Failed to delete trip.');
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <CardShimmer key={i} />
        ))}
      </div>
    );
  }

  // Parse itinerary details safely
  const getParsedItinerary = (jsonStr: string) => {
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {trips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div 
              key={trip.id}
              onClick={() => setSelectedTrip(trip)}
              className="border border-slate-200/60 bg-white hover:border-slate-300 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:-translate-y-0.5 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="space-y-1.5">
                <h4 className="text-xl font-bold text-slate-800">{trip.destination}</h4>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  {trip.start_date} to {trip.end_date}
                </p>
                <div className="flex space-x-4 text-xs text-slate-500 pt-2">
                  <span><strong>Budget:</strong> ${trip.budget}</span>
                  <span><strong>Style:</strong> {trip.travel_style}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <span className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </span>
                <button
                  onClick={(e) => handleDelete(trip.id, e)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer interactive"
                  title="Delete Itinerary"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-2xl">
          You haven't saved any trips yet. Generate one in "Plan Trip" page!
        </div>
      )}

      {/* Details Viewport Modal */}
      {selectedTrip && (() => {
        const details = getParsedItinerary(selectedTrip.itinerary_json);
        let flights = [];
        if (selectedTrip.flights_json) {
          try {
            flights = JSON.parse(selectedTrip.flights_json);
          } catch(e){}
        }
        let hotels = [];
        if (selectedTrip.hotels_json) {
          try {
            hotels = JSON.parse(selectedTrip.hotels_json);
          } catch(e){}
        }
        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
              
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-black text-slate-800">{selectedTrip.destination}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                    {selectedTrip.start_date} to {selectedTrip.end_date} | Budget: ${selectedTrip.budget} | Style: {selectedTrip.travel_style}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedTrip(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer interactive"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Itinerary Scroll view */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {details && details.daily_plan ? (
                  <div className="space-y-6 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                    {details.daily_plan.map((day: any) => (
                      <div key={day.day} className="relative pl-12 space-y-1.5">
                        <div className="absolute left-3.5 top-1 w-6.5 h-6.5 rounded-full border-4 border-white bg-blue-500 shadow-sm flex items-center justify-center text-[10px] font-bold text-white z-10">
                          {day.day}
                        </div>
                        <h5 className="text-base font-bold text-slate-800">{day.title}</h5>
                        <div className="bg-slate-50 border border-slate-100/80 rounded-2xl p-4 space-y-2 text-sm text-slate-600">
                          <p><strong>Morning:</strong> {day.morning}</p>
                          <p><strong>Afternoon:</strong> {day.afternoon}</p>
                          <p><strong>Evening:</strong> {day.evening}</p>
                          <div className="flex justify-between items-center pt-2 border-t border-slate-200/40">
                            <span className="text-xs font-semibold text-slate-400 uppercase">Daily Budget</span>
                            <span className="font-bold text-emerald-600">${day.estimated_cost}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 p-4 border border-slate-100 bg-slate-50 rounded-xl">
                    {selectedTrip.itinerary_json}
                  </div>
                )}

                {details && details.travel_tips && details.travel_tips.length > 0 && (
                  <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-5 space-y-3">
                    <h5 className="font-bold text-slate-800">Suggestions</h5>
                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-1.5">
                      {details.travel_tips.map((tip: string, index: number) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Flights Section */}
                {flights && flights.length > 0 && (
                  <div className="border border-slate-100 bg-blue-50/20 rounded-2xl p-5 space-y-3">
                    <h5 className="font-bold text-slate-800 flex items-center space-x-2">
                      <span>✈️ Saved Flights</span>
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {flights.map((f: any, i: number) => (
                        <div key={i} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 text-xs">
                          <p className="font-bold text-slate-800">{f.carrier}</p>
                          <p className="text-slate-500">Departure: {new Date(f.departure).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          <p className="text-slate-500">Arrival: {new Date(f.arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          <p className="text-slate-400">{f.stopCount === 0 ? 'Direct' : `${f.stopCount} stops`}</p>
                          <p className="font-bold text-emerald-600 pt-1 text-sm">{f.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hotels Section */}
                {hotels && hotels.length > 0 && (
                  <div className="border border-slate-100 bg-emerald-50/20 rounded-2xl p-5 space-y-3">
                    <h5 className="font-bold text-slate-800 flex items-center space-x-2">
                      <span>🏨 Saved Hotels</span>
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {hotels.map((h: any, i: number) => (
                        <div key={i} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 text-xs">
                          <p className="font-bold text-slate-800">{h.name}</p>
                          <p className="text-amber-500">{'★'.repeat(Math.round(h.stars || 3))}</p>
                          <p className="font-bold text-emerald-600 pt-1 text-sm">${h.price} / night</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
            </div>
          </div>
        );
      })()}

    </div>
  );
}
