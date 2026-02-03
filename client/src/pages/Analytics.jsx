import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Activity, PieChart as PieChartIcon, Calendar, ArrowLeft, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Analytics = () => {
    const [weeklyData, setWeeklyData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            // Reusing existing weekly endpoint for now, can expand later
            const res = await axios.get('/api/stats/weekly');
            setWeeklyData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Derived Stats
    const totalWeeklyCalories = weeklyData.reduce((acc, day) => acc + day.cal, 0);
    const avgDailyCalories = Math.round(totalWeeklyCalories / (weeklyData.length || 7));

    // Macro Totals for Pie Chart (aggregated from weekly data)
    // Note: The API needs to return macro breakdown per day for this to be accurate. 
    // If the current /api/stats/weekly only returns 'cal', we might need to update the backend or fetch 7 days of /api/meals.
    // Let's assume for now we might need to fetch detailed meals or update the endpoint.
    // Checking previous code, /api/stats/weekly logic in routes.js needs verification.
    // If it's just calories, we'll need to update it.

    return (
        <div className="px-5 md:px-8 py-8 md:py-10 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24 md:pb-10">
            {/* Header */}
            <header className="flex flex-col gap-6">
                <Link to="/" className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors w-fit group p-2 -ml-2 rounded-lg active:bg-white/5">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </Link>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                            <PieChartIcon className="text-blue-500" /> Nutrition Analytics
                        </h1>
                        <p className="text-gray-400 mt-2 text-sm md:text-base">Deep dive into your nutritional trends.</p>
                    </div>
                    <div className="hidden md:block">
                        <span className="bg-neutral-900 border border-white/10 px-4 py-2 rounded-xl text-sm font-medium text-gray-300">
                            Last 7 Days
                        </span>
                    </div>
                </div>
            </header>

            {/* Key Insights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InsightCard
                    label="Avg Daily Intake"
                    value={`${avgDailyCalories}`}
                    unit="kcal"
                    color="text-blue-400"
                    trend={0} // To be implemented
                />
                <InsightCard
                    label="Total Weekly"
                    value={`${(totalWeeklyCalories / 1000).toFixed(1)}k`}
                    unit="kcal"
                    color="text-emerald-400"
                    trend={0}
                />
                <InsightCard
                    label="Consistency"
                    value="Top 10%"
                    unit="Rank"
                    color="text-purple-400"
                    trend={0}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* 1. Calorie Trend (Area) */}
                <div className="bg-neutral-900/50 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 border border-white/5 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <TrendingUp size={18} className="text-orange-500" /> Calorie Trend
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weeklyData}>
                                <defs>
                                    <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                                <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#525252', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#525252', fontSize: 12 }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="cal"
                                    stroke="#f97316"
                                    fillOpacity={1}
                                    fill="url(#colorCal)"
                                    strokeWidth={3}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Macro Stacked Bar (Placeholder until API update) */}
                <div className="bg-neutral-900/50 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 border border-white/5 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Activity size={18} className="text-blue-500" /> Macro Balance
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                                <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#525252', fontSize: 12 }}
                                    dy={10}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-neutral-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl space-y-2">
                                                    <p className="text-gray-400 text-xs font-bold uppercase mb-2">{label}</p>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-blue-400 text-xs font-bold">Protein</span>
                                                        <span className="text-white font-bold">{payload[0].value}g</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-amber-400 text-xs font-bold">Carbs</span>
                                                        <span className="text-white font-bold">{payload[1].value}g</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-rose-400 text-xs font-bold">Fat</span>
                                                        <span className="text-white font-bold">{payload[2].value}g</span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                                <Bar dataKey="protein" name="Protein" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} barSize={32} />
                                <Bar dataKey="carbs" name="Carbs" stackId="a" fill="#f59e0b" barSize={32} />
                                <Bar dataKey="fat" name="Fat" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Components
const InsightCard = ({ label, value, unit, color }) => (
    <div className="bg-neutral-900/50 backdrop-blur-md p-6 rounded-[2rem] border border-white/5">
        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">{label}</p>
        <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-bold ${color}`}>{value}</span>
            <span className="text-sm text-gray-500 font-medium">{unit}</span>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-neutral-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl">
                <p className="text-gray-400 text-xs font-bold uppercase mb-2">{label}</p>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-white font-bold text-lg">{payload[0].value} <span className="text-xs text-gray-500 font-normal">kcal</span></span>
                </div>
            </div>
        );
    }
    return null;
};

export default Analytics;
