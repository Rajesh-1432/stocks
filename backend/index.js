const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http");
const authRoutes = require("./routes/authRoutes");

dotenv.config();
const app = express();
const server = http.createServer(app);
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use("/api/auth", authRoutes);
const dbConnect = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("DB connected");
  } catch (error) {
    console.log("Error connecting to DB", error);
  }
};
const startServer = async () => {
  try {
    await dbConnect();
    server.listen(process.env.PORT, () => {
      console.log(`Server is runnng at http://localhost:${process.env.PORT}`);
    });
  } catch (error) {
    console.log("Failed to start server", error);
    process.exit(1);
  }
};
startServer();
