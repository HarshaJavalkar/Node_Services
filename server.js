const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const corsMiddleware = require("./corsMiddleware");
const cors = require("cors");

const app = express();

const morgan = require("morgan");
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.DBURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const logger = require("./logger/logger");
logger.info("🔹 Winston logger initialized");
morgan.token("username", (req) => {
  return req.body?.username || req.user?.username || "anonymous"; // Handle different cases
});

const customFormat = (tokens, req, res) => {
  const logObject = {
    username: req.user ? req.user.username : "Anonymous", // Handle missing user
    timestamp: tokens.date(req, res, "iso"),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    response_time: tokens["response-time"](req, res) + "ms",
    user_agent: tokens["user-agent"](req, res),
    ip: tokens["remote-addr"](req, res),
  };

  // If status is 4xx or 5xx, log it as an error
  const status = Number(tokens.status(req, res));
  if (status >= 400) {
    logObject.error = res.locals.errorMessage || "Unknown Server error"; // Capture error message
    return JSON.stringify(logObject);
  }

  return JSON.stringify(logObject);
};

// ✅ Middleware to store error messages in res.locals
app.use((err, req, res, next) => {
  res.locals.errorMessage = err.message; // Store error message for logging
  next(err);
});

// ✅ Apply Morgan with Winston
app.use(
  morgan(customFormat, {
    stream: {
      write: (message) => {
        const logData = JSON.parse(message);
        if (logData.status >= 400) {
          logger.error(message.trim()); // Log errors
        } else {
          logger.info(message.trim()); // Log normal requests
        }
      },
    },
  })
);

const db = mongoose.connection;
db.on("error", () => console.log("Error in DB connection"));
db.once("open", () => console.log("DB connected"));
app.use(cors());
app.use(
  cors({
    origin: [process.env.origin, "http://localhost:4200"],
  })
);
// Use Router
console.log("Registering routes...");
const router = require("./router");

app.use("/", router);

app.use((req, res, next) => {
  console.log(`🟡 Incoming request: ${req.method} ${req.url}`);
  next();
});
const PORT = process.env.AUTH_PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
