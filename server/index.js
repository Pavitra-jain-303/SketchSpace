import express from 'express';
import http  from "http";
import cors from "cors";
import { Server } from "socket.io";
import path from 'path';

import userRoutes from './routes/userRoutes.js';
import { userJoin, userLeave, getUsers } from './routes/routes.js';

import { config as configDotenv } from 'dotenv';
configDotenv();

import connectDB from './config/db.js';
connectDB();

const app = express();
app.use(express.json()); // to accept json data

//production build
const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname1, "/client/build")));

    app.get("*", (req, res) =>
        res.sendFile(path.resolve(__dirname1, "client", "build", "index.html"))
    );
} else {
    app.get("/", (req, res) => {
        res.send("API is running..");
    });
}
//production

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow requests from any origin, replace "*" with your frontend domain in production
        methods: "*" // Allow all HTTP methods
    },
    pingTimeout: 60000
});

console.log(io);

app.use(cors());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

// socket.io
let imageUrl, userRoom;
io.on("connection", (socket) => {
    console.log(socket);
    socket.on("user-joined", (data) => {
        const { roomId, userId, userName, host, presenter } = data;
        userRoom = roomId;
        const user = userJoin(socket.id, userName, roomId, host, presenter);
        const roomUsers = getUsers(user.room);
        socket.join(user.room);
        socket.emit("message", {
            message: "Welcome to ChatRoom",
        });
        socket.broadcast.to(user.room).emit("message", {
            message: `${user.username} has joined`,
        });

        io.to(user.room).emit("users", roomUsers);
        io.to(user.room).emit("canvasImage", imageUrl);
    });

    socket.on("drawing", (data) => {
        imageUrl = data;
        socket.broadcast.to(userRoom).emit("canvasImage", imageUrl);
    });

    socket.on("disconnect", () => {
        const userLeaves = userLeave(socket.id);
        const roomUsers = getUsers(userRoom);

        if (userLeaves) {
            io.to(userLeaves.room).emit("message", {
                message: `${userLeaves.username} left the chat`,
            });
            io.to(userLeaves.room).emit("users", roomUsers);
        }
    });
});

app.get('/', (req, res) => {
    res.send("API is running");
});

app.use('/api/user', userRoutes);

const PORT = process.env.PORT || 5005;

app.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`);
});

// const server = app.listen(PORT, () => {
//     console.log(`Server is running at port ${PORT}`);
// });
