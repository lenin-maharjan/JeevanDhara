const mongoose = require('mongoose');

const requesterSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  hospitalName: { type: String },
  hospitalLocation: { type: String },
  hospitalPhone: { type: String },
  location: { type: String },
  fullAddress: { type: String }, // ADD: Store full readable address from geocoding
  latitude: { type: Number },
  longitude: { type: Number },
  age: { type: Number },
  gender: { type: String },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  password: { type: String },
  fcmToken: { type: String, default: null },
  firebaseUid: { type: String, unique: true, sparse: true }
}, { timestamps: true });

// Indexes for performance
requesterSchema.index({ email: 1 }, { unique: true });
requesterSchema.index({ firebaseUid: 1 }, { sparse: true });

module.exports = mongoose.model('Requester', requesterSchema);