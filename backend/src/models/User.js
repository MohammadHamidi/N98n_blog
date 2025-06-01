const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, required: true, trim: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 8 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });

/* ─── Hash password before save ─── */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);          // bcryptjs is already in package.json :contentReference[oaicite:0]{index=0}
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/* ─── Helper to compare passwords at login ─── */
userSchema.methods.matchPassword = function (plainPw) {
  return bcrypt.compare(plainPw, this.password);
};

module.exports = mongoose.model('User', userSchema);
