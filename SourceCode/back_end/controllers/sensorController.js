const SensorData = require('../models/SensorData');

exports.getHistory = async (req, res) => {
    try {
        const history = await SensorData.find()
            .sort({ timestamp: -1 })
            .limit(50);

        res.json(history.reverse());
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch history" });
    }
};

exports.getHistoryByDate = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: "Missing date" });

        const start = new Date(date + "T00:00:00");
        const end = new Date(date + "T23:59:59");

        const history = await SensorData.find({
            timestamp: { $gte: start, $lte: end }
        }).sort({ timestamp: 1 });

        res.json(history);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch" });
    }
};
