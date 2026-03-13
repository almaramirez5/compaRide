import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { MapPin, Clock, Euro, Car, Navigation, Search, AlertCircle, Star, CheckCircle2, Map as MapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

interface RideOption {
  serviceName: string;
  carType: string;
  estimatedWaitTimeMinutes: number;
  estimatedTravelTimeMinutes: number;
  estimatedPriceEuros: number;
}

interface ServiceRating {
  totalScore: number;
  count: number;
  reviews: string[];
}

type RideState = 'idle' | 'connecting' | 'arriving' | 'in_progress' | 'completed';

const MOCK_ADDRESSES = [
  "Main Street 123, City Center",
  "Oak Avenue 45, North District",
  "Pine Road 88, Westside",
  "Maple Boulevard 12, East End",
  "Cedar Lane 7, South Park",
  "Elm Square 99, Downtown",
  "Airport Terminal 1",
  "Central Train Station"
];

const CityMapCanvas = ({ rideState, progress, serviceName }: { rideState: RideState, progress: number, serviceName: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getServiceColorHex = (name: string) => {
    switch (name.toLowerCase()) {
      case 'uber': return '#000000';
      case 'cabify': return '#9333ea';
      case 'bolt': return '#10b981';
      default: return '#4b5563';
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;

    // Draw background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, width, height);

    // Draw grid (streets)
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    const gridSize = 50;

    ctx.beginPath();
    for (let x = 25; x <= width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 25; y <= height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Define points on the grid
    const origin = { x: 25 + 2 * gridSize, y: 25 + 4 * gridSize };
    const destination = { x: 25 + 6 * gridSize, y: 25 + 1 * gridSize };
    const driverStart = { x: 25 + 0 * gridSize, y: 25 + 1 * gridSize };

    // Draw origin and destination markers
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(destination.x, destination.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Paths
    const arrivingPath = [
      driverStart,
      { x: origin.x, y: driverStart.y }, 
      origin 
    ];

    const inProgressPath = [
      origin,
      { x: origin.x, y: destination.y }, 
      destination 
    ];

    const getPointOnPath = (path: {x: number, y: number}[], t: number) => {
      let totalLength = 0;
      const segments = [];
      for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i];
        const p2 = path[i+1];
        const len = Math.abs(p2.x - p1.x) + Math.abs(p2.y - p1.y);
        segments.push({ p1, p2, len });
        totalLength += len;
      }

      const targetLength = totalLength * t;
      let currentLength = 0;

      for (const seg of segments) {
        if (currentLength + seg.len >= targetLength) {
          const segT = seg.len === 0 ? 0 : (targetLength - currentLength) / seg.len;
          return {
            x: seg.p1.x + (seg.p2.x - seg.p1.x) * segT,
            y: seg.p1.y + (seg.p2.y - seg.p1.y) * segT
          };
        }
        currentLength += seg.len;
      }
      return path[path.length - 1];
    };

    let carPos = null;
    if (rideState === 'arriving') {
      carPos = getPointOnPath(arrivingPath, progress);
    } else if (rideState === 'in_progress') {
      carPos = getPointOnPath(inProgressPath, progress);
    } else if (rideState === 'completed') {
      carPos = destination;
    } else if (rideState === 'connecting') {
      carPos = driverStart;
    }

    if (carPos) {
      // Draw car path trace
      const currentPath = rideState === 'arriving' ? arrivingPath : (rideState === 'in_progress' ? inProgressPath : null);
      if (currentPath) {
         ctx.strokeStyle = getServiceColorHex(serviceName);
         ctx.lineWidth = 4;
         ctx.beginPath();
         ctx.moveTo(currentPath[0].x, currentPath[0].y);
         
         let drawnLength = 0;
         const totalPathLength = currentPath.reduce((acc, p, i) => i === 0 ? 0 : acc + Math.abs(p.x - currentPath[i-1].x) + Math.abs(p.y - currentPath[i-1].y), 0);
         const targetLength = progress * totalPathLength;
         
         for (let i = 0; i < currentPath.length - 1; i++) {
            const p1 = currentPath[i];
            const p2 = currentPath[i+1];
            const len = Math.abs(p2.x - p1.x) + Math.abs(p2.y - p1.y);
            if (drawnLength + len >= targetLength) {
               ctx.lineTo(carPos.x, carPos.y);
               break;
            } else {
               ctx.lineTo(p2.x, p2.y);
               drawnLength += len;
            }
         }
         ctx.stroke();
      }

      // Draw car
      ctx.fillStyle = getServiceColorHex(serviceName);
      ctx.beginPath();
      ctx.arc(carPos.x, carPos.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

  }, [rideState, progress, serviceName]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full object-cover rounded-2xl"
      style={{ minHeight: '250px' }}
    />
  );
};

export default function App() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [maxWaitTime, setMaxWaitTime] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  
  const [originSuggestions, setOriginSuggestions] = useState<string[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<string[]>([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);

  const [rides, setRides] = useState<RideOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  const [activeRide, setActiveRide] = useState<RideOption | null>(null);
  const [rideState, setRideState] = useState<RideState>('idle');
  const [progress, setProgress] = useState(0);

  const [ratings, setRatings] = useState<Record<string, ServiceRating>>({
    Uber: { totalScore: 45, count: 10, reviews: [] },
    Cabify: { totalScore: 42, count: 10, reviews: [] },
    Bolt: { totalScore: 48, count: 10, reviews: [] },
  });

  const [userRating, setUserRating] = useState(5);
  const [userReview, setUserReview] = useState('');

  const originRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(event.target as Node)) {
        setShowOriginDropdown(false);
      }
      if (destinationRef.current && !destinationRef.current.contains(event.target as Node)) {
        setShowDestinationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOriginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setOrigin(val);
    if (val.length > 0) {
      setOriginSuggestions(MOCK_ADDRESSES.filter(a => a.toLowerCase().includes(val.toLowerCase())));
      setShowOriginDropdown(true);
    } else {
      setShowOriginDropdown(false);
    }
  };

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDestination(val);
    if (val.length > 0) {
      setDestinationSuggestions(MOCK_ADDRESSES.filter(a => a.toLowerCase().includes(val.toLowerCase())));
      setShowDestinationDropdown(true);
    } else {
      setShowDestinationDropdown(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) {
      setError('Please enter both origin and destination.');
      return;
    }

    setLoading(true);
    setError('');
    setRides([]);
    setHasSearched(true);
    setIsCompact(true);
    setShowOriginDropdown(false);
    setShowDestinationDropdown(false);

    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const prompt = `
        Simulate a list of available rideshare options for a user traveling from "${origin}" to "${destination}".
        The available services are Uber, Cabify, and Bolt.
        
        The user has set the following constraints:
        ${maxWaitTime ? `- Maximum wait time: ${maxWaitTime} minutes` : ''}
        ${maxPrice ? `- Maximum price: ${maxPrice} €` : ''}
        
        Generate 3 to 6 realistic ride options. 
        CRITICAL: You MUST strictly respect the maximum wait time and maximum price constraints. Do not include any ride that exceeds these limits. If no rides are possible within these limits, return an empty array.
        
        For each ride, provide:
        - serviceName: "Uber", "Cabify", or "Bolt"
        - carType: e.g., "Standard", "XL", "Comfort", "Eco"
        - estimatedWaitTimeMinutes: integer
        - estimatedTravelTimeMinutes: integer
        - estimatedPriceEuros: number (can have decimals)
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                serviceName: { type: Type.STRING, description: 'The name of the rideshare service (Uber, Cabify, Bolt)' },
                carType: { type: Type.STRING, description: 'The type of car (e.g., Standard, XL, Comfort)' },
                estimatedWaitTimeMinutes: { type: Type.INTEGER, description: 'Estimated wait time in minutes' },
                estimatedTravelTimeMinutes: { type: Type.INTEGER, description: 'Estimated travel time in minutes' },
                estimatedPriceEuros: { type: Type.NUMBER, description: 'Estimated price in Euros' },
              },
              required: ['serviceName', 'carType', 'estimatedWaitTimeMinutes', 'estimatedTravelTimeMinutes', 'estimatedPriceEuros']
            }
          }
        }
      });

      if (response.text) {
        const parsedRides = JSON.parse(response.text) as RideOption[];
        setRides(parsedRides.sort((a, b) => a.estimatedPriceEuros - b.estimatedPriceEuros));
      } else {
        setError('Failed to generate rides. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while searching for rides.');
    } finally {
      setLoading(false);
    }
  };

  const getServiceColor = (serviceName: string) => {
    switch (serviceName.toLowerCase()) {
      case 'uber': return 'bg-black text-white';
      case 'cabify': return 'bg-purple-600 text-white';
      case 'bolt': return 'bg-emerald-500 text-white';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const getAverageRating = (serviceName: string) => {
    const rating = ratings[serviceName];
    if (!rating || rating.count === 0) return "New";
    return (rating.totalScore / rating.count).toFixed(1);
  };

  const handleSelectRide = (ride: RideOption) => {
    setActiveRide(ride);
    setRideState('connecting');
    setProgress(0);

    // Connecting...
    setTimeout(() => {
      setRideState('arriving');
      
      let startTime = performance.now();
      const arrivingDuration = 5000;
      
      const animateArriving = (time: number) => {
        let elapsed = time - startTime;
        let p = Math.min(elapsed / arrivingDuration, 1);
        setProgress(p);
        if (p < 1) {
          requestAnimationFrame(animateArriving);
        } else {
          setRideState('in_progress');
          setProgress(0);
          
          startTime = performance.now();
          const inProgressDuration = 5000;
          
          const animateInProgress = (time: number) => {
            let elapsed = time - startTime;
            let p = Math.min(elapsed / inProgressDuration, 1);
            setProgress(p);
            if (p < 1) {
              requestAnimationFrame(animateInProgress);
            } else {
              setRideState('completed');
            }
          };
          requestAnimationFrame(animateInProgress);
        }
      };
      requestAnimationFrame(animateArriving);

    }, 2000);
  };

  const submitReview = () => {
    if (activeRide) {
      setRatings(prev => {
        const current = prev[activeRide.serviceName] || { totalScore: 0, count: 0, reviews: [] };
        return {
          ...prev,
          [activeRide.serviceName]: {
            totalScore: current.totalScore + userRating,
            count: current.count + 1,
            reviews: userReview ? [...current.reviews, userReview] : current.reviews
          }
        };
      });
    }
    resetApp();
  };

  const resetApp = () => {
    setActiveRide(null);
    setRideState('idle');
    setRides([]);
    setHasSearched(false);
    setIsCompact(false);
    setOrigin('');
    setDestination('');
    setUserRating(5);
    setUserReview('');
  };

  if (rideState !== 'idle' && activeRide) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-center gap-2">
            <Car className="w-6 h-6 text-blue-900" />
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Active Ride</h1>
          </div>
        </header>

        <main className="flex-1 max-w-md w-full mx-auto p-4 flex flex-col">
          {rideState !== 'completed' ? (
            <div className="flex-1 flex flex-col space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center space-y-4">
                <div className={"w-16 h-16 mx-auto rounded-full flex items-center justify-center font-bold text-2xl shadow-sm " + getServiceColor(activeRide.serviceName)}>
                  {activeRide.serviceName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{activeRide.serviceName} {activeRide.carType}</h2>
                  <p className="text-gray-500">
                    {rideState === 'connecting' && 'Connecting with driver...'}
                    {rideState === 'arriving' && `Driver is arriving in ${Math.ceil(activeRide.estimatedWaitTimeMinutes * (1 - progress))} min...`}
                    {rideState === 'in_progress' && `Heading to ${destination}...`}
                  </p>
                </div>
              </div>

              {/* Mock Map Canvas */}
              <div className="flex-1 bg-gray-200 rounded-2xl overflow-hidden relative border border-gray-300 shadow-inner min-h-[250px]">
                <CityMapCanvas rideState={rideState} progress={progress} serviceName={activeRide.serviceName} />
                
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 shadow-sm flex items-center gap-1.5">
                  <MapIcon className="w-3.5 h-3.5" />
                  Live Tracking Simulated
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900">You have arrived!</h2>
                <p className="text-gray-500 mt-1">Destination: {destination}</p>
                <div className="text-3xl font-bold text-gray-900 mt-4">
                  €{activeRide.estimatedPriceEuros.toFixed(2)}
                </div>
                <p className="text-sm text-gray-500">Total paid via {activeRide.serviceName}</p>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Rate your ride</h3>
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setUserRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star 
                        className={`w-8 h-8 ${star <= userRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} 
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={userReview}
                  onChange={(e) => setUserReview(e.target.value)}
                  placeholder="Leave a short review (optional)"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none resize-none h-24 text-sm"
                ></textarea>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={submitReview}
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium py-3.5 rounded-xl transition-colors"
                >
                  Submit & Start New Search
                </button>
                <button
                  onClick={resetApp}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3.5 rounded-xl transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-12">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-center gap-2">
          <Car className="w-6 h-6 text-blue-900" />
          <h1 className="text-xl font-bold tracking-tight text-gray-900">compaRide</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        <motion.section 
          layout
          className={`bg-white shadow-sm border border-gray-100 overflow-hidden ${isCompact ? 'rounded-2xl p-4' : 'rounded-2xl p-5'}`}
        >
          <AnimatePresence mode="wait">
            {!isCompact ? (
              <motion.form 
                key="form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSearch} 
                className="space-y-4"
              >
                <div className="space-y-3">
                  <div className="relative" ref={originRef}>
                    <div className="absolute top-3 left-3 text-gray-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      placeholder="Origin"
                      value={origin}
                      onChange={handleOriginChange}
                      onFocus={() => origin.length > 0 && setShowOriginDropdown(true)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none transition-all"
                      required
                    />
                    {showOriginDropdown && originSuggestions.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                        {originSuggestions.map((suggestion, idx) => (
                          <div
                            key={idx}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                            onClick={() => {
                              setOrigin(suggestion);
                              setShowOriginDropdown(false);
                            }}
                          >
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="relative" ref={destinationRef}>
                    <div className="absolute top-3 left-3 text-gray-400">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      placeholder="Destination"
                      value={destination}
                      onChange={handleDestinationChange}
                      onFocus={() => destination.length > 0 && setShowDestinationDropdown(true)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none transition-all"
                      required
                    />
                    {showDestinationDropdown && destinationSuggestions.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                        {destinationSuggestions.map((suggestion, idx) => (
                          <div
                            key={idx}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                            onClick={() => {
                              setDestination(suggestion);
                              setShowDestinationDropdown(false);
                            }}
                          >
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Max Wait (min)</label>
                    <div className="relative">
                      <div className="absolute top-2.5 left-3 text-gray-400">
                        <Clock className="w-4 h-4" />
                      </div>
                      <input
                        type="number"
                        min="1"
                        placeholder="Any"
                        value={maxWaitTime}
                        onChange={(e) => setMaxWaitTime(e.target.value ? Number(e.target.value) : '')}
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Max Price (€)</label>
                    <div className="relative">
                      <div className="absolute top-2.5 left-3 text-gray-400">
                        <Euro className="w-4 h-4" />
                      </div>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        placeholder="Any"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-blue-900 hover:bg-blue-800 text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  {loading ? 'Searching...' : 'Search Rides'}
                </button>
              </motion.form>
            ) : (
              <motion.div 
                key="compact"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex justify-between items-center"
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <span className="truncate max-w-[120px]">{origin}</span>
                    <span className="text-gray-400">&rarr;</span>
                    <span className="truncate max-w-[120px]">{destination}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {maxWaitTime ? `Max ${maxWaitTime}m` : 'Any wait'} • {maxPrice ? `Max €${maxPrice}` : 'Any price'}
                  </div>
                </div>
                <button 
                  onClick={() => setIsCompact(false)} 
                  className="text-blue-900 text-sm font-medium bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Edit
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 space-y-4"
          >
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-900 rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium">Finding best rides...</p>
          </motion.div>
        )}

        {!loading && rides.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 pb-8"
          >
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-1">Available Rides</h2>
            <div className="space-y-3">
              {rides.map((ride, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-blue-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={"w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm " + getServiceColor(ride.serviceName)}>
                      {ride.serviceName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{ride.serviceName}</h3>
                        <span className="flex items-center text-xs font-medium text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500 mr-0.5" />
                          {getAverageRating(ride.serviceName)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{ride.carType}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {ride.estimatedWaitTimeMinutes} min away
                        </span>
                        <span className="flex items-center gap-1">
                          <Navigation className="w-3 h-3" />
                          {ride.estimatedTravelTimeMinutes} min trip
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      €{ride.estimatedPriceEuros.toFixed(2)}
                    </div>
                    <button 
                      onClick={() => handleSelectRide(ride)}
                      className="mt-1 text-xs font-semibold text-blue-900 bg-blue-50 px-4 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {!loading && hasSearched && rides.length === 0 && !error && (
          <div className="text-center py-10 text-gray-500 animate-in fade-in duration-500">
            <Car className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>No rides found matching your criteria.</p>
            <p className="text-sm mt-1">Try adjusting your max wait time or price.</p>
          </div>
        )}
      </main>
    </div>
  );
}