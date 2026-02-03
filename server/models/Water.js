import mongoose from 'mongoose';

const waterSchema = new mongoose.Schema({
    date: { type: String, required: true }, // YYYY-MM-DD
    amount: { type: Number, required: true }, // in ml
    timestamp: { type: Date, default: Date.now }
});

const Water = mongoose.model('Water', waterSchema);

export default Water;
