
import { Server } from "socket.io";

let io;

export const initSocket = (httpServer, corsOptions) => {
    // console.log("Socket.io initialized");
    io = new Server(httpServer, {
        cors: corsOptions
    });

    io.on("connection", (socket) => {
        console.log(`New client connected: ${socket.id}`);

        socket.on("join_room", (sessionId) => {
            socket.join(sessionId);
            console.log(`User ${socket.id} joined room ${sessionId}`);
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected");
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
