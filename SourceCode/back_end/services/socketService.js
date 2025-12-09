const socketIo = require('socket.io');

let io;

module.exports = function(server) {
    io = socketIo(server, {
        cors: { origin: "*", methods: ["GET", "POST"] }
    });

    console.log("🔌 Socket.IO initialized");
};

module.exports.getIO = () => io;
