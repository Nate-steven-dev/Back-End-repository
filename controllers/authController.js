import { Student, joiSchema } from "../models/studentModel.js";
import jwt from "jsonwebtoken";

// Generate JWT token
const genToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });

// REGISTER
export const registerStudent = async (req, res) => {
  try {
    const { name, studentWebmail, password } = req.body;

    // Validate input using Joi schema
    const { error } = joiSchema.validate({ name, studentWebmail, password });
    if (error) {
      return res.status(400).json({ msg: error.details[0].message });
    }

    // Check if email already exists
    const existingStudent = await Student.findOne({ 
      studentWebmail: studentWebmail?.toLowerCase()
    });
    
    if (existingStudent) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    // Create new student with trimmed and lowercase email
    const student = await Student.create({
      name: name.trim(),
      studentWebmail: studentWebmail.toLowerCase().trim(),
      password
    });

    // Return student data
    res.status(201).json({
      success: true,
      data: {
        name: student.name,
        studentWebmail: student.studentWebmail,
        createdAt: student.createdAt
      },
    });

  } catch (e) {
    if (e.code === 11000) {
      return res.status(400).json({
        success: false,
        msg: "A student with this email already exists"
      });
    }
    
    if (e.name === 'ValidationError') {
      const messages = Object.values(e.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        msg: messages.join(', ')
      });
    }
    
    console.error('Registration error:', e);
    res.status(500).json({ 
      success: false,
      msg: "An error occurred during registration",
      error: e.message 
    });
  }
};

// LOGIN
export const loginStudent = async (req, res) => {
  try {
    const { studentWebmail, password } = req.body;

    // Validate input
    if (!studentWebmail || !password) {
      return res.status(400).json({ msg: "Email & password required" });
    }

    // Find student
    const student = await Student.findOne({ studentWebmail });
    if (!student) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Success
    res.json({
      student: {
        name: student.name,
        studentWebmail: student.studentWebmail,
      },
     });
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
};

// LOGOUT
export const logoutStudent = async (req, res) => {
  try {
    res.json({ msg: "Logged out successfully" });
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
};
