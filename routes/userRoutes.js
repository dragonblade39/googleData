const express = require("express");
const router = express.Router();
const Schema = require("../schema/schema");
const bcrypt = require("bcrypt");
require("dotenv").config();
const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "chethannv23.csedvit@gmail.com",
    pass: "qosp hecn uhio rpns",
  },
  debug: true, // Enable debugging output
});

transporter.verify((error, success) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Ready for messages");
    console.log(success);
  }
});

router.post("/otp", async (req, res, next) => {
  try {
    const { otp, email } = req.body;
    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: "Verify Your Email",
      html: `<p>Enter <b>${otp}</b> in the app to verify your email address and complete the Signup</p><p>This code <b>expires in 1 hour</b>.</p>`,
    };
    await transporter.sendMail(mailOptions);
    return res.status(200).json("Successfull");
  } catch (error) {
    res.json({
      status: "FAILED",
      message: error.message,
    });
  }
});

router.post("/create", async (req, res, next) => {
  const { name, email, password, verified } = req.body;
  const existingEmail = await Schema.findOne({ email: email });

  if (existingEmail) {
    return res.status(400).json("Email already exists.");
  }
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  try {
    const newUser = new Schema({
      name,
      email,
      password: hashedPassword,
      verified: verified,
    });
    await newUser.save();
    return res.status(200).json("Successfull");
  } catch (error) {
    next(error);
  }
});

router.post("/data", (req, res, next) => {
  const { email } = req.body;
  Schema.findOne({ email: email }).then((login) => {
    if (login) {
      return res.json(login);
    } else {
      return res.status(400).json("No record exits");
    }
  });
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const existingUser = await Schema.findOne({ email });

    if (existingUser) {
      const passwordMatch = await bcrypt.compare(
        password,
        existingUser.password
      );

      if (passwordMatch) {
        // Passwords match, user is authenticated
        return res
          .status(200)
          .json({ message: "Login successful", user: existingUser });
      } else {
        // Passwords do not match
        return res.status(401).json({ message: "Incorrect email or password" });
      }
    } else {
      // User with the provided email does not exist
      return res.status(404).json({ message: "Incorrect email or password" });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/update", async (req, res) => {
  try {
    const { email } = req.body;
    const existingUser = await Schema.findOne({ email });

    if (existingUser) {
      existingUser.verified = true;
      await existingUser.save();

      res.status(200).json({ message: "User data updated successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ message: "Failed to save/update user data" });
  }
});

router.post("/updatePassword", async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await Schema.findOne({ email });

    if (existingUser) {
      const hashedPassword = await bcrypt.hash(password, 10);
      existingUser.password = hashedPassword;
      await existingUser.save();

      res.status(200).json({ message: "Password updated successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ message: "Failed to update password" });
  }
});
module.exports = router;
