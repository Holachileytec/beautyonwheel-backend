const Student = require("../models/StudentSchema");
const Codes = require("../models/StoredStudentCodesModel");

const studentLogin = async (req, res) => {
  try {
    const { userName, entryCode, email } = req.body;

    if (!userName || !entryCode || !email) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 1. Check if the student is already in our system
    let student = await Student.findOne({ email });

    if (student) {
      // If they exist, check if the code they entered is the one assigned to them
      if (student.entryCode !== entryCode) {
        return res
          .status(401)
          .json({ message: "Invalid code for this account" });
      }
      return res
        .status(200)
        .json({ message: "Login Successful", user: student });
    }

    // 2. If NEW student, try to claim the code from the pool
    // findOneAndUpdate is ATOMIC - prevents two people from grabbing the same code
    const claimedCode = await Codes.findOneAndUpdate(
      { code: entryCode, isUsed: false },
      { isUsed: true },
      { new: true },
    );

    if (!claimedCode) {
      return res
        .status(401)
        .json({ message: "Code is invalid or already used by someone else" });
    }

    // 3. Create the student and permanently link the code
    const newStudent = await Student.create({
      userName,
      entryCode,
      email,
    });

    // 4. Link the student ID back to the code pool for admin records
    claimedCode.assignedTo = newStudent._id;
    await claimedCode.save();

    return res
      .status(201)
      .json({ message: "Registration & Login Successful", user: newStudent });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { studentLogin };
