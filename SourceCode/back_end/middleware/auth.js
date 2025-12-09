const jwt = require('jsonwebtoken');
const SECRET_KEY = "SECRET_FIRE_ALARM";

module.exports = function(req, res, next) {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token)
        return res.status(401).json({ message: "Không có token, truy cập bị từ chối" });

    try {
        const verified = jwt.verify(token, SECRET_KEY);
        req.user = verified;
        next();
    } catch (err) {
        res.status(401).json({ message: "Token không hợp lệ" });
    }
};
