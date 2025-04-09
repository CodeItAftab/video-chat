const http = require("http");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const googleRoutes = require("./routes/google");
const { ConnectDB } = require("./utils/database");
const { errorMiddleware } = require("./middlewares/error");
const { ConnectSocket } = require("./utils/socket");

dotenv.config();

const app = express();

const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/google", googleRoutes);
app.use("/api/user", userRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Video Chat API" });
});

app.use(errorMiddleware);

ConnectDB(process.env.MONGO_URI || "mongodb://localhost:27017/videochat")
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB", err);
  });

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  ConnectSocket(server);
});
