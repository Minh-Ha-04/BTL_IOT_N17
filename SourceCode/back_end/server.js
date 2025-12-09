const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const http = require('http');
const socketService = require('./services/socketService');
require('./services/mqttService'); // chạy MQTT listener

const authRoutes = require('./routes/auth');
const sensorRoutes = require('./routes/sensorRoutes');
const controlRoutes = require('./routes/controlRoutes');

const app = express();
const server = http.createServer(app);
socketService(server);

// ---------------- CONFIG ----------------
const PORT = 5000;
const MONGO_URI = 'mongodb://localhost:27017/fire_alarm_db';

app.use(bodyParser.json());

// Kết nối MongoDB
mongoose.connect(MONGO_URI)
    .then(() => console.log(" MongoDB connected"))
    .catch(err => console.log(" MongoDB error:", err));

// ---------------- ROUTES ----------------
app.use('/api/auth', authRoutes);
app.use('/api', sensorRoutes);
app.use('/api', controlRoutes);

// ---------------- START SERVER ----------
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🌍 Server running at http://0.0.0.0:${PORT}`);
});
