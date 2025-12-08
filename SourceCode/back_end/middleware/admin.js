module.exports = function (req, res, next) {
  if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Chỉ admin mới được truy cập" });
  }
  next();
};
