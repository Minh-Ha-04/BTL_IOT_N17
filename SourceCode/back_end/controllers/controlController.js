const mqttClient = require('../services/mqttService');

exports.sendControl = (req, res) => {
    const { command, value } = req.body;

    const payload = JSON.stringify({ command, value });

    mqttClient.publish('fire-alarm/control', payload);

    res.status(200).json({
        message: `Published command ${command}: ${value}`,
        payload
    });
};
