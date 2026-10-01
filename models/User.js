const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    // superadmin | editor (SRS §2.2). 'admin' = role lama, diganti migrasi 001.
    // 'user' tidak dipakai lagi sejak registrasi publik dihapus.
    role: {
      type: String,
      enum: ['superadmin', 'editor', 'admin', 'user'],
      default: 'editor',
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    profilePhoto: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Hash password only when it is newly set or modified
UserSchema.pre('save', async function encryptPassword(next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

UserSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', UserSchema);
