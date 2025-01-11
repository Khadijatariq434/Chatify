const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePicture: { type: String }, // Add profilePicture field
  resetToken:{
    type:String,
  },
  resetTokenExpiration:{
    type: Date,
  },
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  friends:[{
    type:mongoose.Schema.Types.ObjectId, ref:'User'
  }]
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password") && !this.skipPasswordHashing) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});


userSchema.methods.comparePassword = async function (password) {
  console.log('Plain password:', password);
  console.log('Stored hashed password:', this.password);
    return await bcrypt.compare(password, this.password);

};

const User = mongoose.model("User", userSchema);
module.exports = User;
