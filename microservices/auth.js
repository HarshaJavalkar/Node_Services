// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models/UserSchema");
const asyncHandler = require("express-async-handler");
const logger = require("../logger/logger");

const fs = require("fs");
const privateKey = fs.readFileSync("private.pem", "utf8");

const { error } = require("winston");
const register = asyncHandler(async (req, res) => {
  const { email, password, googleId = "", name, photo = "", isGoogleLogin = false } = req.body;

    const user = User.findOne({email});
    console.log("data",user)
    if(user){
      res.json({message:"This email has been already registered please login"}).status(400);
    }
    const hashedPassword = isGoogleLogin
    ? password
    : await bcrypt.hash(password, 10);
  const newUser = new User({
    email,
    password: hashedPassword,
    name,
    photo,
    googleId,
  });
  await newUser.save();
  logger.info(`User ${email} registered successfully`);
  res.json({
    message: "User registered successfully",
    code: 200,
  });
});
const login = async (req, res) => {
  const { email, name, photo, password, isGoogleLogin } = req.body;
  logger.info(`🔹 Login attempt for user: ${email}`);

  if (!isGoogleLogin) {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        logger.warn(`⚠️ Login failed: User '${email}' not found`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        logger.warn(`⚠️ Login failed: Incorrect password for user '${email}'`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.email }, process.env.user_SIGN_SECRET, {
        expiresIn: "1h",
      });
      logger.info(`✅ User '${email}' logged in successfully`);
      res.json({ token });
    } catch (err) {
      logger.error(`❌ Login error for user '${email}': ${err.message}`, {
        stack: err.stack,
      });
      res.status(500).json({ error: "Internal server error" });
    }
  }
  const token = jwt.sign({ id: email }, privateKey, {
    expiresIn: "1h",
  });
  logger.info(`✅ User '${email}' logged in successfully`);
  res.json({ token, userData: { email, name, photo } });
};
// Middleware to Verify Token
const authenticate = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access Denied" });
  try {
    const verified = jwt.verify(token, publicKey);
    req.user = verified;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Session Expired. Please log in again." });
    }
    return res.status(403).json({ error: "Invalid Token" });
  }
};

module.exports = { register, login, authenticate };
