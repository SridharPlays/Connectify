import User from "../models/user.model.js"
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js"
import cloudinary from "../lib/cloudinary.js"
import crypto from "crypto";
import { sendResetEmail } from "../lib/email.js";

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
            // Increment failed attempts
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
            await user.save();

            if (user.failedLoginAttempts >= 3) {
                return res.status(400).json({ 
                    message: "Too many failed attempts.", 
                    showReset: true,
                    email: user.email // Send email back so frontend can use it for reset request
                });
            }

            return res.status(400).json({ message: "Invalid Credentials! " });
        }

        // Reset attempts on successful login
        user.failedLoginAttempts = 0;
        await user.save();

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

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString("hex");
        
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

        await sendResetEmail(user.email, resetUrl);

        res.status(200).json({ message: "Password reset link sent to email." });
    } catch (error) {
        console.error("Error in Forgot Password", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.log("Error in resetPassword controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};