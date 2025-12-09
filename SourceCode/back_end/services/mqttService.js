const mqtt = require('mqtt');
const SensorData = require('../models/SensorData');
const socketService = require('./socketService');

const MQTT_BROKER = 'mqtt://broker.hivemq.com';
const DATA_TOPIC = 'fire-alarm/data';

const client = mqtt.connect(MQTT_BROKER);

client.on('connect', () => {
    console.log("📡 Connected to MQTT Broker");
    client.subscribe(DATA_TOPIC);
});

client.on('message', async (topic, message) => {
    if (topic !== DATA_TOPIC) return;

    try {
        const data = JSON.parse(message.toString());

        const newData = new SensorData({
            temperature: data.temperature,
            mq2Value: data.mq2Value,
            flameValue: data.flameValue,
            alarm: data.alarm,
            alarmEnabled: data.alarmEnabled,
            timestamp: Date.now()
        });

        await newData.save();

        const io = socketService.getIO();
        if (io) io.emit('sensorUpdate', newData);

    } catch (err) {
        console.log("❌ MQTT Data Error:", err.message);
    }
});

module.exports = client;
    