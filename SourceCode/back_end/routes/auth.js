const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// --- ĐĂNG KÝ ---
router.post('/register', authController.register);

// --- ĐĂNG NHẬP ---
router.post('/login', authController.login);

// --- LẤY TẤT CẢ USER (ADMIN) ---
router.get('/users', auth, admin, authController.getUsers);

// --- XÓA USER (ADMIN) ---
router.delete('/users/:id', auth, admin, authController.deleteUser);

module.exports = router;
