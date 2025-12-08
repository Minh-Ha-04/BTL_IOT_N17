const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user.js');
const auth = require('../middleware/auth.js');
const admin = require('../middleware/admin.js');

const router = express.Router();
const SECRET_KEY = "SECRET_FIRE_ALARM";

// 📌 Đăng ký
router.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        const exists = await User.findOne({ username });
        if (exists) return res.status(400).json({ message: "Username đã tồn tại" });

        const user = new User({ username, password, role: role || "user" });
        await user.save();

        res.json({
            message: "Đăng ký thành công",
            user: {
                _id: user._id,
                username: user.username,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📌 Đăng nhập
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const foundUser = await User.findOne({ username });
        if (!foundUser) return res.status(400).json({ message: "Sai tài khoản" });

        const match = foundUser.comparePassword(password);
        if (!match) return res.status(400).json({ message: "Sai mật khẩu" });

        // Tạo token
        const token = jwt.sign({ id: foundUser._id, role: foundUser.role }, SECRET_KEY, { expiresIn: '7d' });

        res.json({
            message: "Đăng nhập thành công",
            user: {
                _id: foundUser._id,
                username: foundUser.username,
                role: foundUser.role
            },
            token
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📌 Lấy tất cả user (chỉ admin)
router.get('/users', auth, admin, async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📌 Xóa user theo id (chỉ admin)
router.delete('/users/:id', auth, admin, async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User không tồn tại" });

        await User.findByIdAndDelete(userId);
        res.json({ message: `Đã xóa user ${user.username}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
