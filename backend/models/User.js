const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ["user", "shop_owner", "admin"], default: "shop_owner" },
}, { timestamps: true });
userSchema.pre("save", async function hashPassword() { if (this.isModified("password")) this.password = await bcrypt.hash(this.password, 12); });
userSchema.methods.comparePassword = function comparePassword(password) { return bcrypt.compare(password, this.password); };
module.exports = mongoose.model("User", userSchema);
