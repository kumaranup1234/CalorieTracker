import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Droplets, Plus, Minus, Trash2, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const WaterTracker = () => {
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [goal, setGoal] = useState(3000);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWaterData();
    }, []);

    const fetchWaterData = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Fetch logs for today
            const logsRes = await axios.get(`/api/water?date=${today}`);
            setLogs(logsRes.data);

            // Calculate total
            const todayTotal = logsRes.data.reduce((sum, log) => sum + log.amount, 0);
            setTotal(todayTotal);

            // Fetch settings for goal
            const settingsRes = await axios.get('/api/settings');
            if (settingsRes.data.waterGoal) {
                setGoal(settingsRes.data.waterGoal);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addWater = async (amount) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const res = await axios.post('/api/water', {
                date: today,
                amount: amount
            });

            const newLogs = [...logs, res.data];
            setLogs(newLogs);
            setTotal(newLogs.reduce((sum, log) => sum + log.amount, 0));
            toast.success(`+${amount}ml added! 💧`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to log water");
        }
    };

    const undoLastLog = async () => {
        if (logs.length === 0) return;

        try {
            const lastLog = logs[logs.length - 1]; // Get last one (array is already somewhat sorted by insertion or fetch if we trust it pushes to end)
            await axios.delete(`/api/water/${lastLog._id}`);

            const newLogs = logs.slice(0, -1);
            setLogs(newLogs);
            setTotal(newLogs.reduce((sum, log) => sum + log.amount, 0));
            toast.success('Entry removed');
        } catch (err) {
            console.error(err);
            toast.error("Failed to undo");
        }
    };

    const percentage = Math.min((total / goal) * 100, 100);

    return (
        <div className="bg-blue-600/10 backdrop-blur-xl rounded-[2.5rem] p-8 border border-blue-500/20 relative overflow-hidden shadow-xl flex flex-col justify-between h-full group">
            {/* Background Wave Effect (CSS-based simple wave) */}
            <div
                className="absolute bottom-0 left-0 right-0 bg-blue-500/20 transition-all duration-1000 ease-in-out"
                style={{ height: `${percentage}%` }}
            />
            {/* Animated bubbles */}
            <div className="absolute bottom-0 left-10 w-4 h-4 bg-blue-400/30 rounded-full animate-bounce delay-100" style={{ animationDuration: '3s' }} />
            <div className="absolute bottom-10 right-20 w-2 h-2 bg-blue-400/30 rounded-full animate-bounce delay-700" style={{ animationDuration: '5s' }} />

            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <h3 className="text-blue-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                        <Droplets size={14} /> Hydration
                    </h3>
                    <div className="mt-2">
                        <span className="text-4xl font-bold text-white tracking-tighter">{total}</span>
                        <span className="text-blue-300 text-sm font-medium ml-1">/ {goal} ml</span>
                    </div>
                </div>
                {/* Radial Progress Mini */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="24" cy="24" r="20" stroke="#1e3a8a" strokeWidth="4" fill="transparent" />
                        <circle cx="24" cy="24" r="20" stroke="#60a5fa" strokeWidth="4" fill="transparent" strokeDasharray="125" strokeDashoffset={125 - (125 * (percentage / 100))} strokeLinecap="round" className="transition-all duration-1000" />
                    </svg>
                    <span className="absolute text-[10px] font-bold text-blue-200">{Math.round(percentage)}%</span>
                </div>
            </div>

            <div className="relative z-10 mt-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => addWater(250)}
                        className="bg-blue-500 hover:bg-blue-400 text-white p-3 rounded-xl flex flex-col items-center gap-1 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                    >
                        <span className="text-xs font-bold uppercase opacity-80">Glass</span>
                        <span className="text-lg font-bold flex items-center gap-1"><Plus size={14} /> 250</span>
                    </button>
                    <button
                        onClick={() => addWater(500)}
                        className="bg-neutral-900/50 hover:bg-neutral-900 text-blue-300 border border-blue-500/30 p-3 rounded-xl flex flex-col items-center gap-1 transition-all active:scale-95"
                    >
                        <span className="text-xs font-bold uppercase opacity-80">Bottle</span>
                        <span className="text-lg font-bold flex items-center gap-1"><Plus size={14} /> 500</span>
                    </button>
                </div>
                {logs.length > 0 && (
                    <button
                        onClick={undoLastLog}
                        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-blue-300/50 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                    >
                        <RotateCcw size={12} /> Undo Last
                    </button>
                )}
            </div>
        </div>
    );
};

export default WaterTracker;
