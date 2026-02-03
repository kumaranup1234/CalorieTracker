import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, FileText, Plus, Trash2, Circle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const DailyTasks = () => {
    const [todos, setTodos] = useState([]);
    const [newTodo, setNewTodo] = useState('');
    const [loading, setLoading] = useState(true);

    // Modal state for "Partial" notes
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [noteContent, setNoteContent] = useState('');

    useEffect(() => {
        fetchTodos();
    }, []);

    const fetchTodos = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const res = await axios.get(`/api/todos?date=${today}`);
            setTodos(res.data);
        } catch (err) {
            console.error("Failed to fetch todos", err);
        } finally {
            setLoading(false);
        }
    };

    const addTodo = async (e) => {
        e.preventDefault();
        if (!newTodo.trim()) return;

        try {
            const today = new Date().toISOString().split('T')[0];
            const res = await axios.post('/api/todos', {
                text: newTodo,
                date: today,
                status: 'pending'
            });
            setTodos([...todos, res.data]);
            setNewTodo('');
            toast.success('Task added');
        } catch (err) {
            console.error("Failed to add todo", err);
            toast.error("Failed to add task");
        }
    };

    const updateStatus = async (id, status, notes = '') => {
        try {
            const res = await axios.put(`/api/todos/${id}`, { status, notes });
            setTodos(todos.map(t => t._id === id ? res.data : t));
            if (editingNoteId === id) {
                setEditingNoteId(null);
                setNoteContent('');
            }
        } catch (err) {
            console.error("Failed to update todo", err);
        }
    };

    const deleteTodo = async (id) => {
        try {
            await axios.delete(`/api/todos/${id}`);
            setTodos(todos.filter(t => t._id !== id));
        } catch (err) {
            console.error("Failed to delete todo", err);
        }
    };

    const openPartialModal = (todo) => {
        setEditingNoteId(todo._id);
        setNoteContent(todo.notes || '');
    };

    return (
        <div className="bg-neutral-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="bg-neutral-800 p-2 rounded-xl text-blue-400"><FileText size={20} /></span>
                Today's Focus
            </h2>

            {/* Add Todo Input */}
            <form onSubmit={addTodo} className="mb-6 relative">
                <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder="What needs to be done?"
                    className="w-full bg-neutral-950/50 border border-white/10 rounded-xl px-5 py-4 pl-12 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
                <Plus className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors">
                    <Plus size={16} />
                </button>
            </form>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence>
                    {todos.map(todo => (
                        <motion.div
                            key={todo._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`group flex items-center gap-3 p-4 rounded-xl border transition-all ${todo.status === 'completed' ? 'bg-green-500/5 border-green-500/20' :
                                todo.status === 'partial' ? 'bg-amber-500/5 border-amber-500/20' :
                                    'bg-neutral-800/30 border-white/5 hover:bg-neutral-800/50'
                                }`}
                        >
                            {/* Checkbox / Status Indicator */}
                            <button
                                onClick={() => updateStatus(todo._id, todo.status === 'completed' ? 'pending' : 'completed')}
                                className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${todo.status === 'completed' ? 'bg-green-500 border-green-500 text-white' :
                                    'border-gray-600 hover:border-gray-400 text-transparent'
                                    }`}
                            >
                                <Check size={14} />
                            </button>

                            {/* Text Content */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${todo.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-200'
                                    }`}>
                                    {todo.text}
                                </p>
                                {todo.status === 'partial' && todo.notes && (
                                    <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                                        <AlertCircle size={10} /> {todo.notes}
                                    </p>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {/* Partial Button */}
                                <button
                                    onClick={() => openPartialModal(todo)}
                                    title="Done less / Add notes"
                                    className={`p-2 rounded-lg transition-colors ${todo.status === 'partial' ? 'text-amber-400 bg-amber-400/10' : 'text-gray-500 hover:text-amber-400 hover:bg-amber-400/10'
                                        }`}
                                >
                                    <AlertCircle size={16} />
                                </button>

                                {/* Delete Button */}
                                <button
                                    onClick={() => deleteTodo(todo._id)}
                                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                    {todos.length === 0 && !loading && (
                        <p className="text-center text-gray-500 py-8 text-sm">No tasks for today. Enjoy your day! 🌟</p>
                    )}
                </AnimatePresence>
            </div>

            {/* Partial / Notes Modal */}
            {editingNoteId && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                    >
                        <h3 className="text-lg font-bold text-white mb-2">Partial Completion</h3>
                        <p className="text-gray-400 text-sm mb-4">Add a note about what you accomplished (or didn't).</p>

                        <textarea
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 text-white text-sm min-h-[100px] mb-4 focus:outline-none focus:border-amber-500"
                            placeholder="e.g. Only did 10 minutes..."
                            autoFocus
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setEditingNoteId(null)}
                                className="px-4 py-2 rounded-lg text-sm font-bold text-gray-400 hover:bg-white/5"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => updateStatus(editingNoteId, 'partial', noteContent)}
                                className="px-4 py-2 rounded-lg text-sm font-bold bg-amber-500 text-black hover:bg-amber-400"
                            >
                                Save Note
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default DailyTasks;
