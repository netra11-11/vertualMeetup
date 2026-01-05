import express from 'express'
import {Server} from "socket.io"
import mongoose from "mongoose";
import {createServer} from "node:http";
//the server of the socket and express are differet we have to connect them using createServer
import cors from "cors";
import {initSocket} from './controllers/socketManeger.js';
import userRoutes from './routes/users.routes.js';
const app = express();
//add the app server with createSever 
const server =createServer(app);
const io = initSocket(server);

//set anything form env variable(type of local storage)
app.set("port",(process.env.PORT || 8000));

//CORS
app.use(cors());
app.use(express.json({limit:"40kb"}));
app.use(express.urlencoded({limit:"40kb",extended:true}));

app.use("/api/v1/users",userRoutes);
// app.use("/api/v2/users",newUserRoutes);


app.get("/home",(req,res)=>{
    return res.json({"helllo":"World"})
});
const start = async ()=>{
app.set("mongo_user")
    const connectionDb=await mongoose.connect("mongodb+srv://sunetrabarofficial2025_db_user:Amina_Dipu@cluster0.19yqx2h.mongodb.net/");
    console.log(`Mongo Connescted DB Host: ${connectionDb.connection.host}`)
    server.listen(app.get("port"), ()=>{
        console.log("Listining on port 8000")
    })
}

start();