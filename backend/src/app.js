import express from 'express'
import { Server } from "socket.io"
import mongoose from "mongoose";
import { createServer } from "node:http";
import cors from "cors";
import { initSocket } from './controllers/socketManeger.js';
import userRoutes from './routes/users.routes.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
//add the app server with createSever 
const server = createServer(app);
const io = initSocket(server);

//set anything form env variable(type of local storage)
app.set("port", (process.env.PORT || 8000));

//CORS
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);
// app.use("/api/v2/users",newUserRoutes);


app.get("/home", (req, res) => {
    return res.json({ "helllo": "World" })
});
const start = async () => {
    try {
        const connectionDb = await mongoose.connect(process.env.MONGO_URL);
        console.log(`Mongo Connected DB Host: ${connectionDb.connection.host}`)
        server.listen(app.get("port"), () => {
            console.log("Listening on port 8000")
        })
    } catch (error) {
        console.log("ERROR connecting to DB:", error);
    }
}

start();