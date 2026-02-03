import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db.js';
import router from './routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: [
        'https://calorietracker12.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000'
    ],
    credentials: true
}));
app.use(express.json());

// Serve static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', router);

app.get('/', (req, res) => {
    res.send('Calorie Tracker API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

