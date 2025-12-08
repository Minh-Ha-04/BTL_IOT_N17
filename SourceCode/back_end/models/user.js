const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' }
});

// So khớp password dạng plaintext
userSchema.methods.comparePassword = function (password) {
    return password === this.password;
};

module.exports = mongoose.model('user', userSchema);
