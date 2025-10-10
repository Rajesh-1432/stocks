const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const fyreDataModel = require("../models/fyreDataModel");
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

class AuthController {
  user_register = async (req, res) => {
    const { name, email, password, role } = req.body;
  
    try {
      const existingUser = await userModel.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: "Email already exists" });
      }
  
      const hashedPassword = await bcrypt.hash(password, 9);
      const user = await userModel.create({ name, email, role, password: hashedPassword });
  
      const token = jwt.sign(
        { _id: user._id, role: user.role, name: user.name, email: user.email },
        JWT_SECRET,
        { expiresIn: "1d" }
      );
  
      return res.status(201).json({ message: "User successfully registered", token });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };

  user_login = async (req, res) => {
    const { email, password } = req.body;

    try {
      const user = await userModel.findOne({ email }).select("+password");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(404).json({ message: "Invalid Password" });
      }

      const token = await jwt.sign(
        {
          _id: user._id,
          role: user.role,
          name: user.name,
          email: user.email,
        },
        JWT_SECRET,
        {
          expiresIn: "1d",
        }
      );

      return res.status(200).json({ message: "Sign In successful", token });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ message: "Internal Server error" });
    }
  };
  get_users = async (req, res) => {
    try {
      // Fetch all users from the database
      const data = await userModel.find();

      // Return success response with users
      res.status(200).json({
        success: true,
        message: "Users fetched successfully",
        data: data,
      });
    } catch (error) {
      console.error("Error fetching users:", error);

      // Return error response
      res.status(500).json({
        success: false,
        message: "Error fetching users",
        error: error.message,
      });
    }
  };
  delete_user = async (req, res) => {
    try {
      const userIdToDelete = req.params.id;
      
      // Get current user ID from the authenticated user
      const currentUserId = req.user._id.toString();
  
      // Prevent user from deleting themselves
      if (userIdToDelete === currentUserId) {
        return res.status(403).json({
          success: false,
          message: "You cannot delete yourself",
        });
      }
  
      // Check if user exists before deleting
      const userExists = await userModel.findById(userIdToDelete);
      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
  
      // Delete the user
      const data = await userModel.deleteOne({ _id: userIdToDelete });
  
      // Check if deletion was successful
      if (data.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found or already deleted",
        });
      }
  
      // Return success response
      res.status(200).json({
        success: true,
        message: "User deleted successfully",
        data: data,
      });
    } catch (error) {
      console.error("Error deleting user:", error);
  
      // Return error response
      res.status(500).json({
        success: false,
        message: "Error deleting user",
        error: error.message,
      });
    }
  };
  get_fyers_data = async (req, res) => {
    try {
      // Fetch all users from the database
      const data = await fyreDataModel.find();

      // Return success response with users
      res.status(200).json({
        success: true,
        message: "Fyers data fetched successfully",
        data: data,
      });
    } catch (error) {
      console.error("Error fetching fyers data:", error);

      // Return error response
      res.status(500).json({
        success: false,
        message: "Error fetching fyers data",
        error: error.message,
      });
    }
  };
}

module.exports = new AuthController();
