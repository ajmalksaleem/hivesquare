import express from "express";
const app = express();
import { config } from 'dotenv'
import cors from 'cors'
import morgan from 'morgan'
import ConnectToDatabase from "./db/connection.js";
import path from 'path';
const __dirname = path.resolve(path.dirname(""));


// security packages

import helmet from "helmet";
import router from "./routes/index.js";
config();

app.use(express.static(path.join(__dirname, "views/build")));
app.use(helmet())
app.use(cors())
app.use(express.json());
//app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(router)
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "internal server Error";
    res.status(statusCode).json({
        success: false,
        statusCode,
        message
    })
})



const PORT = process.env.PORT
ConnectToDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log('server start running on ' + PORT);
        })
    })
    .catch((err) => {
        console.log(err);
    })