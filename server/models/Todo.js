import mongoose from 'mongoose';

const todoSchema = new mongoose.Schema({
    text: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'completed', 'partial'],
        default: 'pending'
    },
    notes: { type: String, default: '' },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    timestamp: { type: Date, default: Date.now }
});

const Todo = mongoose.model('Todo', todoSchema);

export default Todo;
