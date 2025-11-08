import User from "../models/user.model.js"
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js"
import cloudinary from "../lib/cloudinary.js"

export const signup = async (req, res) => {
    const { fullName, username, email, password } = req.body;
    try {
        if (!fullName || !username || !email || !password) {
            return res.status(400).json({ message: "All Fields are Required!" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password Must Contain Atleast 6 Characters! " });
        }
        const userByEmail = await User.findOne({ email });
        if (userByEmail) return res.status(400).json({ message: "Email Already Exists" });

        const userByUsername = await User.findOne({ username });
        if (userByUsername) return res.status(400).json({ message: "Username Already Taken" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            username,
            email,
            password: hashedPassword
        });

        if (newUser) {
            generateToken(newUser._id, res);
            await newUser.save();

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                username: newUser.username,
                email: newUser.email,
                profilePic: newUser.profilePic
            });
        } else {
            return res.status(400).json({ message: "Invalid User Data" });
        }
    } catch (error) {
        console.log("Error in signup Controller", error.message);
        res.status(500).json({ message: "Internal Server Error " });
    }
}

export const login = async (req, res) => {
    const { loginId, password } = req.body;
    try {
        if (!loginId || !password) {
            return res.status(400).json({ message: "All Fields are Required!" });
        }
        const user = await User.findOne({
            $or: [{ email: loginId }, { username: loginId }],
        });
        if (!user) {
            return res.status(400).json({ message: "Invalid Credentials! " });
        }

        const isPasswordCorrect = await user.isPasswordCorrect(password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid Credentials! " });
        }
        generateToken(user._id, res);
        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            profilePic: user.profilePic,
            usernameLastUpdatedAt: user.usernameLastUpdatedAt
        });
    } catch (error) {
        console.log("Error in Login Controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({ message: "Logged out Successfully!" });
    } catch (error) {
        console.log("Error in Logout Controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const updateProfile = async (req, res) => {
    try {
        const { profilePic, username } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let hasUpdated = false;

        if (profilePic) {
            const uploadResponse = await cloudinary.uploader.upload(profilePic);
            user.profilePic = uploadResponse.secure_url;
            hasUpdated = true;
        }

        if (username && username !== user.username) {
            const sevenDays = 7 * 24 * 60 * 60 * 1000;
            if (user.usernameLastUpdatedAt && (new Date() - new Date(user.usernameLastUpdatedAt)) < sevenDays) {
                const timeLeft = sevenDays - (new Date() - new Date(user.usernameLastUpdatedAt));
                const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
                return res.status(403).json({ message: `You can change your username again in ${daysLeft} day(s).` });
            }

            // Check if new username is already taken
            const existingUser = await User.findOne({ username, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({ message: "Username is already taken." });
            }

            user.username = username;
            user.usernameLastUpdatedAt = new Date();
            hasUpdated = true;
        }

        if (!hasUpdated) {
            return res.status(400).json({ message: "No new data provided to update." });
        }

        const updatedUser = await user.save();

        res.status(200).json({
            _id: updatedUser._id,
            fullName: updatedUser.fullName,
            username: updatedUser.username,
            email: updatedUser.email,
            profilePic: updatedUser.profilePic,
            usernameLastUpdatedAt: updatedUser.usernameLastUpdatedAt
        });

    } catch (error) {
        console.log("Error in Update Profile Controller", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}