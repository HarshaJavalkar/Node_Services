const mongoose = require("mongoose");
const { nanoid } = require("nanoid");
const validator = require("validator");
const mailChecker = require("mailchecker");
const path = require("path");
const logger = require("../utils/logger");

const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  userId: { type: String, unique: true, default: () => nanoid(10) },
  password: { type: String, required: true },
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  photo: { type: String, required: true },
  blockedStatus: { type: Boolean, default: false },
  suspiciousCount: { type: Number, default: 0 },
  lastRidePaymentReceived: { type: Boolean, default: true },
  vehicles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" }],
});
const User = mongoose.model("User", UserSchema, "users");

module.exports = { User };
