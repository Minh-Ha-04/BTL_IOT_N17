const mongoose = require('mongoose');

const SensorDataSchema = new mongoose.Schema({
    temperature: { type: Number },
    mq2Value: { type: Number },
    flameDetected: { type: Boolean },
    alarm: { type: Boolean, default: false },
    alarmEnabled: { type: Boolean },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SensorData', SensorDataSchema);