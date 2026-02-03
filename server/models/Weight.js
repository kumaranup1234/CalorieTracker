import mongoose from 'mongoose';

const weightSchema = new mongoose.Schema({
    date: {
        type: String, // YYYY-MM-DD
        required: true,
        index: true
    },
    weight: {
        type: Number,
        required: true
    },
    note: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Weight = mongoose.model('Weight', weightSchema);

export default Weight;
