import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCrops, getPrices, getMarkets } from '../api.js';
import { useAuth } from '../context/AuthContext';
import {
  Sun,
  CloudRain,
  CloudSun,
  Thermometer,
  CloudLightning,
  ChevronRight,
  TrendingUp,
  MapPin,
  ExternalLink,
  Sparkles,
  Layers,
  ShoppingBag
} from 'lucide-react';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { currentUser, isFarmer } = useAuth();

  const [crops, setCrops] = useState([]);
  const [prices, setPrices] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [selectedMandi, setSelectedMandi] = useState('Hyderabad');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [c, p, m] = await Promise.all([getCrops(), getPrices(), getMarkets()]);
        setCrops(c || []);
        setPrices(p || []);
        setMarkets(m || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    };
    fetchData();
  }, []);

  // Weather data mapping by Sindh Mandi
  const weatherData = {
    Hyderabad: {
      todayTemp: '37°',
      range: '37°/23°',
      condition: 'Rainy - Cloudy',
      forecast: [
        { date: '25 June', temp: '29°', condition: 'Thunderstorm', icon: CloudLightning },
        { date: '26 June', temp: '32°', condition: 'Rainy cloudy', icon: CloudRain },
        { date: '27 June', temp: '39°', condition: 'Semicloudy', icon: CloudSun },
        { date: '28 June', temp: '42°', condition: 'Sunny - Humidity', icon: Sun }
      ]
    },
    Sukkur: {
      todayTemp: '41°',
      range: '41°/27°',
      condition: 'Sunny - Dry',
      forecast: [
        { date: '25 June', temp: '38°', condition: 'Clear Sky', icon: Sun },
        { date: '26 June', temp: '40°', condition: 'Hot - Sunny', icon: Sun },
        { date: '27 June', temp: '41°', condition: 'Dry Winds', icon: CloudSun },
        { date: '28 June', temp: '43°', condition: 'Heatwave', icon: Sun }
      ]
    },
    Karachi: {
      todayTemp: '34°',
      range: '34°/26°',
      condition: 'Breezy - Humid',
      forecast: [
        { date: '25 June', temp: '31°', condition: 'Sea Breeze', icon: CloudSun },
        { date: '26 June', temp: '33°', condition: 'Humid Overcast', icon: CloudRain },
        { date: '27 June', temp: '35°', condition: 'Sunny Humid', icon: Sun },
        { date: '28 June', temp: '34°', condition: 'Partly Cloudy', icon: CloudSun }
      ]
    }
  };

  const currentMandiWeather = weatherData[selectedMandi] || weatherData['Hyderabad'];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Left & Center Main Dashboard Area (8 cols on large screens) */}
      <div className="xl:col-span-8 space-y-6">
        {/* 1. Summary Section */}
        <div>
          <h2 className="text-sm font-bold text-slate-800 tracking-tight mb-3">
            Summary
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Wheat Summary Card with Circular Ring */}
            <div
              onClick={() => navigate('/crop/crp-wheat')}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
            >
              <div>
                <span className="text-sm font-bold text-slate-800 block">Wheat</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Total production</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">125</span>
                  <span className="text-xs font-semibold text-slate-500">Tons</span>
                </div>
              </div>

              {/* Circular Progress Ring (12%) */}
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-14 h-14 transform -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    stroke="#F1F5F0"
                    strokeWidth="5"
                    fill="transparent"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    stroke="#10B981"
                    strokeWidth="5"
                    strokeDasharray={2 * Math.PI * 22}
                    strokeDashoffset={2 * Math.PI * 22 * (1 - 0.12)}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <span className="absolute text-[11px] font-bold text-slate-700">12%</span>
              </div>
            </div>

            {/* Rice Summary Card with Circular Ring */}
            <div
              onClick={() => navigate('/crop/crp-rice')}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
            >
              <div>
                <span className="text-sm font-bold text-slate-800 block">Rice</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Total production</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">980</span>
                  <span className="text-xs font-semibold text-slate-500">Tons</span>
                </div>
              </div>

              {/* Circular Progress Ring (33%) */}
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-14 h-14 transform -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    stroke="#F1F5F0"
                    strokeWidth="5"
                    fill="transparent"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    stroke="#16A34A"
                    strokeWidth="5"
                    strokeDasharray={2 * Math.PI * 22}
                    strokeDashoffset={2 * Math.PI * 22 * (1 - 0.33)}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <span className="absolute text-[11px] font-bold text-slate-700">33%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Manage your farm Banner */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              Manage your farm
            </h2>
            <button
              onClick={() => navigate('/marketplace')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Explore Mandi Marketplace <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative h-64 sm:h-72 w-full rounded-3xl overflow-hidden shadow-sm group">
            <img
              src="/farm_banner.jpg"
              alt="Manage your farm illustration"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            {/* Subtle Gradient & Action Pills */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex items-end p-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(isFarmer ? '/my-listings' : '/marketplace')}
                  className="px-4 py-2 rounded-xl bg-white/95 backdrop-blur text-slate-900 font-bold text-xs shadow-md hover:bg-white transition-all flex items-center gap-1.5"
                >
                  <Layers className="w-4 h-4 text-emerald-600" />
                  {isFarmer ? 'Manage Harvests' : 'Browse Produce'}
                </button>
                <button
                  onClick={() => navigate('/calculator')}
                  className="px-4 py-2 rounded-xl bg-[#E2FA8A] text-slate-950 font-bold text-xs shadow-md hover:bg-[#d6f279] transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-emerald-800" />
                  Profit Simulator
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Predictive analysis Cards */}
        <div>
          <h2 className="text-sm font-bold text-slate-800 tracking-tight mb-3">
            Predictive analysis
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* January '22 Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
              <div className="text-xs font-bold text-slate-800 text-center pb-1 border-b border-slate-100">
                January '22
              </div>

              {/* Wheat */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                  <span>Wheat</span>
                  <span className="font-bold text-slate-800">59%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '59%' }}></div>
                </div>
              </div>

              {/* Rice */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                  <span>Rice</span>
                  <span className="font-bold text-slate-800">81%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-700 rounded-full" style={{ width: '81%' }}></div>
                </div>
              </div>

              {/* Maize */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                  <span>Maize</span>
                  <span className="font-bold text-slate-800">13%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '13%' }}></div>
                </div>
              </div>
            </div>

            {/* February '22 Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
              <div className="text-xs font-bold text-slate-800 text-center pb-1 border-b border-slate-100">
                February '22
              </div>

              {/* Wheat */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                  <span>Wheat</span>
                  <span className="font-bold text-slate-800">59%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '59%' }}></div>
                </div>
              </div>

              {/* Rice */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                  <span>Rice</span>
                  <span className="font-bold text-slate-800">81%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-700 rounded-full" style={{ width: '81%' }}></div>
                </div>
              </div>

              {/* Maize */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                  <span>Maize</span>
                  <span className="font-bold text-slate-800">13%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '13%' }}></div>
                </div>
              </div>
            </div>

            {/* March '22 Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
              <div className="text-xs font-bold text-slate-800 text-center pb-1 border-b border-slate-100">
                March '22
              </div>

              {/* Wheat */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                  <span>Wheat</span>
                  <span className="font-bold text-slate-800">59%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '59%' }}></div>
                </div>
              </div>

              {/* Rice */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                  <span>Rice</span>
                  <span className="font-bold text-slate-800">81%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-700 rounded-full" style={{ width: '81%' }}></div>
                </div>
              </div>

              {/* Maize */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                  <span>Maize</span>
                  <span className="font-bold text-slate-800">13%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '13%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column (4 cols on large screens): Weather & Harvesting Cost */}
      <div className="xl:col-span-4 space-y-6">
        {/* Weather Forecast Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              Weather forecast
            </h2>
            <div className="flex items-center gap-2">
              <select
                value={selectedMandi}
                onChange={(e) => setSelectedMandi(e.target.value)}
                className="text-[10px] font-bold text-slate-600 bg-slate-100 rounded-lg px-2 py-1 border-none focus:outline-none"
              >
                <option value="Hyderabad">Hyderabad Mandi</option>
                <option value="Sukkur">Sukkur Mandi</option>
                <option value="Karachi">Karachi Sabzi Mandi</option>
              </select>
              <button
                onClick={() => navigate('/weather')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 underline"
              >
                open app
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {/* Main Today Weather Card (Pastel Mint Green) */}
            <div className="p-4 rounded-2xl bg-[#DDF3E4] border border-[#caedd3] shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Weather Illustration */}
                <div className="w-12 h-12 rounded-2xl bg-white/70 flex items-center justify-center text-amber-500 shadow-sm">
                  <CloudSun className="w-7 h-7 text-sky-500" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">Today</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900">{currentMandiWeather.todayTemp}</span>
                    <span className="text-xs font-semibold text-slate-600">/{currentMandiWeather.range.split('/')[1]}</span>
                  </div>
                  <span className="text-[11px] text-slate-600 font-medium block">
                    {currentMandiWeather.condition}
                  </span>
                </div>
              </div>

              {/* Thermometer icon & Sun graphic */}
              <div className="w-12 h-14 bg-white/60 rounded-2xl flex flex-col items-center justify-center text-amber-500 p-1">
                <Sun className="w-5 h-5 text-amber-500 animate-spin-slow mb-0.5" />
                <Thermometer className="w-5 h-5 text-rose-500" />
              </div>
            </div>

            {/* 4-Day Forecast Grid (2x2) */}
            <div className="grid grid-cols-2 gap-2.5">
              {currentMandiWeather.forecast.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.date}
                    className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-center space-y-1 hover:border-slate-200 transition-colors"
                  >
                    <span className="text-[10px] font-bold text-slate-400 block">{item.date}</span>
                    <div className="flex items-center justify-center gap-1 my-1">
                      <Icon className="w-4 h-4 text-slate-600" />
                      <span className="text-lg font-black text-slate-900">{item.temp}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight">{item.condition}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Harvesting Cost / Estimation Widget */}
        <div className="p-5 rounded-3xl bg-[#DDF3E4] border border-[#caedd3] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Harvesting Cost
            </h3>
            <button
              onClick={() => navigate('/calculator')}
              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline"
            >
              Simulator
            </button>
          </div>

          <div className="flex items-center justify-between gap-4">
            {/* Left Breakdown */}
            <div className="space-y-3 flex-1">
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium">Wheat</span>
                  <span className="font-bold text-slate-800">$76K</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium">Rice</span>
                  <span className="font-bold text-slate-800">$24K</span>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-300/40">
                <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
                  Total estimation
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 block mt-0.5">
                  $100K
                </span>
              </div>
            </div>

            {/* Right Pie Chart */}
            <div className="w-24 h-24 relative flex items-center justify-center shrink-0">
              <svg viewBox="0 0 36 36" className="w-24 h-24 transform -rotate-90">
                {/* Yellow / Lime slice (24%) */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="transparent"
                  stroke="#E2FA8A"
                  strokeWidth="31.8"
                  strokeDasharray="24 76"
                  strokeDashoffset="0"
                />
                {/* Green slice (76%) */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="transparent"
                  stroke="#16A34A"
                  strokeWidth="31.8"
                  strokeDasharray="76 24"
                  strokeDashoffset="-24"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
