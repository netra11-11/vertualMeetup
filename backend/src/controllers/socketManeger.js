
import { Server } from "socket.io";

let connections = {}
let messages = {};
let timeOnline = {};
let users = {}; // Map to store socketId -> username



export const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on("join-call", (path, username) => {
            if (connections[path] === undefined) {
                connections[path] = [];
            }
            if (connections[path].includes(socket.id) === false) {
                connections[path].push(socket.id);
            }

            // Store the username for this socket
            users[socket.id] = username;

            timeOnline[socket.id] = new Date();

            // Notify everyone in the room, including the sender, with the updated list of users in the room
            // We need to send the user map to everyone so they know who is who
            for (let a = 0; a < connections[path].length; a++) {
                io.to(connections[path][a]).emit("user-joined", socket.id, connections[path], users);
            }

            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; ++a) {
                    io.to(socket.id).emit("chat-message", messages[path][a]['data'],
                        messages[path][a]['sender'], messages[path][a]['socket-id-sender']
                    )
                }
            }
            // System message: User Joined
            connections[path].forEach((elem) => {
                io.to(elem).emit("chat-message", `${username} joined the chat`, "System", "SYSTEM")
            })
        });

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        })

        socket.on("chat-message", (roomId, data, sender) => {
            console.log("Backend received chat-message. Room:", roomId, "Data:", data, "Sender:", sender, "Socket:", socket.id);
            if (connections[roomId] === undefined) {
                console.log("Room " + roomId + " does not exist or has no connections.");
                return; // Room doesn't exist?
            }

            console.log("Broadcasting to room", roomId, "Connections count:", connections[roomId].length);

            if (messages[roomId] === undefined) {
                messages[roomId] = [];
            }
            messages[roomId].push({ 'sender': sender, "data": data, "socket-id-sender": socket.id })
            console.log("message", ":", sender, data);

            connections[roomId].forEach((elem) => {
                console.log("Emiting to socket:", elem);
                io.to(elem).emit("chat-message", data, sender, socket.id)
            })
        })

        socket.on("typing", (roomId) => {
            if (connections[roomId]) {
                connections[roomId].forEach((elem) => {
                    io.to(elem).emit("typing", socket.id)
                })
            }
        })

        socket.on("stop-typing", (roomId) => {
            if (connections[roomId]) {
                connections[roomId].forEach((elem) => {
                    io.to(elem).emit("stop-typing", socket.id)
                })
            }
        })

        socket.on("disconnect", () => {
            var difftime = Math.abs(timeOnline[socket.id] - new Date());
            var key;
            for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {
                for (let a = 0; a < v.length; ++a) {
                    if (v[a] === socket.id) {
                        key = k;
                        for (let a = 0; a < connections[key].length; ++a) {
                            io.to(connections[key][a]).emit('user-left', socket.id)
                        }

                        // System message: User Left (using the stored username before deletion)
                        const leavingUsername = users[socket.id] || "User";
                        for (let a = 0; a < connections[key].length; ++a) {
                            io.to(connections[key][a]).emit("chat-message", `${leavingUsername} left the chat`, "System", "SYSTEM")
                        }

                        var index = connections[key].indexOf(socket.id);
                        connections[key].splice(index, 1);

                        // Clean up user data
                        if (users[socket.id]) {
                            delete users[socket.id];
                        }

                        if (connections[key].length === 0) {
                            delete connections[key];
                            delete messages[key];
                        }
                    }
                }
            }
        })
    });

    return io;
}
