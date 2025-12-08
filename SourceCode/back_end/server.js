const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const mqtt = require('mqtt');
const bodyParser = require('body-parser');
const SensorData = require('./models/SensorData'); // <-- Đảm bảo có trường 'temperature' ở đây

const app = express();
const PORT = 5000;
const MONGO_URI = 'mongodb://localhost:27017/fire_alarm_db';
const MQTT_BROKER = 'mqtt://broker.hivemq.com'; 
const DATA_TOPIC = 'fire-alarm/data'; 
const CONTROL_TOPIC = 'fire-alarm/control'; 

const authRoutes = require ('./routes/auth.js');
app.use(bodyParser.json());
app.use('/api/auth', authRoutes);
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

// --- Kết nối MongoDB ---
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB connected.'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// --- Cấu hình và Xử lý MQTT ---
const mqttClient = mqtt.connect(MQTT_BROKER);

mqttClient.on('connect', () => {
    console.log('✅ Connected to MQTT Broker.');
    mqttClient.subscribe(DATA_TOPIC);
});

mqttClient.on('message', async (topic, message) => {
    if (topic === DATA_TOPIC) {
        try {
            const data = JSON.parse(message.toString());
            
            const newData = new SensorData({
                temperature: data.temperature,
                mq2Value: data.mq2Value,
                flameValue: data.flameValue,
                alarm: data.alarm,
                alarmEnabled: data.alarmEnabled,  // <-- chỉ còn alarmEnabled
                timestamp: Date.now()
            });
            await newData.save();

            io.emit('sensorUpdate', newData);

        } catch (error) {
            console.error('❌ Error processing MQTT data or saving to DB:', error.message);
        }
    }
});

// --- API Điều khiển (Từ React tới ESP32) (Giữ nguyên) ---
app.post('/api/control', (req, res) => {
    const { command, value } = req.body; 
    
    const payload = JSON.stringify({ command, value });
    
    mqttClient.publish(CONTROL_TOPIC, payload);
    console.log(`📡 Published control command [${command}: ${value}] to topic: ${CONTROL_TOPIC}`);
    
    res.status(200).send({ message: 'Control command published.', payload });
});

// --- API Lịch sử (Dành cho React) (Giữ nguyên) ---
app.get('/api/history', async (req, res) => {
    try {
        const history = await SensorData.find().sort({ timestamp: -1 }).limit(50);
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch history.' });
    }
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`🌍 Server running on http://0.0.0.0:${PORT}`);
  });
  