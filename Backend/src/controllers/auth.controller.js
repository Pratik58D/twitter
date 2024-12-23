import { generateTokenAndSetCookie } from "../lib/genrateToken.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

//signup Controller
export const signup = async (req, res) => {
  try {
    const { fullName, userName, email, password } = req.body;
    if (!fullName || !userName || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(422).json({ error: "Invalid email format" });
    }

    const existingUser = await User.findOne({ userName });
    if (existingUser) {
      return res.status(409).json({ error: "UserName is already taken" });
    }
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ error: "Email is already taken" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    //hashing the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      userName,
      email,
      password: hashedPassword,
    });
    if (newUser) {
      generateTokenAndSetCookie(newUser._id, res);
      await newUser.save();
      res.status(201).json({ message: "user is Created", data: newUser });
    } else {
      res.status(422).json({ error: "Invalid user data" });
    }
  } catch (error) {
    console.error("Error in signup controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//login Controller
export const login = async (req, res) => {
  try {
    const { userName, password } = req.body;
    if (!userName || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const user = await User.findOne({ userName });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    generateTokenAndSetCookie(user._id, res);
    res.status(200).json({ message: "login Sucessfull", data: user });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const logout = async (req, res) => {
  try {
    res.cookie("jwtCookie", "", { maxAge: 0 });
    res.status(200).json({ message: "Logout Sucessfull" });
  } catch (error) {
    console.error("Error in logout controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json({ data: user });
  } catch (error) {
    console.error("Error in getMe controller", error.message);
    res.status(500).json({ error: "Internal Server  Error" });
  }
};
