const express = require('express');
const router = express.Router();
const controlController = require('../controllers/controlController');

router.post('/control', controlController.sendControl);

module.exports = router;
