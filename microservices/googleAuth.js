const express = require("express");
const { Router } = require("express");
const expressAsyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/UserSchema");
const jwt = require("jsonwebtoken");
const { sign } = require("jsonwebtoken");
const { register, login } = require("./auth");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const googleAuthApiObj = Router();
dotenv.config({ path: "./config/.env" });

// async function getUserDetails(access_token) {
//   const response = await fetch(
//     `https://www.googleapis.com/oauth2/v3/userinfo?access_token${access_token}`
//   );
//   const data = response.json();
//   console.log("data", data);
// }
const client_url = process.env.CLIENT_URL;
const server_url = process.env.SERVER_URL;
const REDIRECT_URI = `${client_url}/auth/callback`;
const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

const loginWithGoogle = expressAsyncHandler(async (req, res, next) => {
  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["profile", "email"],
  });
  res.json({ authorizeUrl });
});

const callBack = expressAsyncHandler(async (req, res) => {
  const code = req.body.code;
  try {
    const { tokens } = await oAuth2Client.getToken(code); // Exchange code for tokens
    oAuth2Client.setCredentials(tokens);

    const ticket = await oAuth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    // Save user to MongoDB (upsert)
    // Check if the user already exists in the database
    let user = await User.findOne({ googleId: sub });

    if (user) {
      // User already exists: Update details if needed
      if (
        user.email !== email ||
        user.name !== name ||
        user.photo !== picture
      ) {
        user.email = email;
        user.name = name;
        user.photo = picture;
        await user.save();
      }

      Object.assign(req.body, {
        googleId: sub,
        email,
        name,
        picture,
        ...user.toObject(), // Convert Mongoose user object to a plain object
        isGoogleLogin: true,
      });

      login(req, res);
    } else {
      // New user: Create an entry
      const generateAndHashPassword = async () => {
        // Step 1: Generate a random password (12 characters)
        const plainPassword = crypto
          .randomBytes(9)
          .toString("base64")
          .slice(0, 12);

        // Step 2: Hash the password using bcryptjs.hash directly with 10 salt rounds
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        return hashedPassword;
      };
      const genHashpass = await generateAndHashPassword();
      user = new User({
        googleId: sub,
        email,
        name,
        photo: picture,
        password: genHashpass,
      });

      Object.assign(req.body, {
        googleId: sub,
        email,
        name,
        picture,
        password: genHashpass,
        ...user.toObject(),
        isGoogleLogin: true,
        registrationType: 'google'
      });
      register(req, res);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Authentication failed" });
  }
});

module.exports = { loginWithGoogle, callBack };
