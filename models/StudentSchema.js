const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    entryCode: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
  },
  { timestamps: true },
);

const Student = mongoose.model("Student", studentSchema);
module.exports = Student;
