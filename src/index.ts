import express from "express";
import dotenv from 'dotenv';
dotenv.config();
import path from "path";
import cors from "cors";
import { connectDB } from "./model/connection";
import userRouter from "./routes/userRouter";
import { ALLOWED_ORIGIN, PORT, VSA_CRM_ORIGIN } from "./config";
import adminRouter from "./routes/adminRouter";
import http from "http";
import { Server } from "socket.io";
import morgan from "morgan";
import logger from "./utilities/logger";
import driveRoutes from './routes/driveRoutes';



const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
  path: "/socket.io",
  transports: ["websocket", "polling"],
});

const morganFormat = ":method :url :status :response-time ms";

// Connect to the database
connectDB();

// CORS middleware
app.use(cors({
  origin: [ALLOWED_ORIGIN, VSA_CRM_ORIGIN],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message: string) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };

        // Log 4xx and 5xx status codes as errors
        if (parseInt(logObject.status) >= 400) {
          logger.error(logObject);
        } else {
          logger.info(logObject);
        }
      },
    },
  })
);

app.use("/user", userRouter);
app.use("/admin", adminRouter);
app.use("/drive", driveRoutes);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    status: 500, // Default to 500 if no status is provided
  });
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("A User Connected:", socket.id);

  socket.on("sendMessage", (message) => {
    io.emit("receiveMessage", message);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});