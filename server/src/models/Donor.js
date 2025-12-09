const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  location: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  age: { type: Number, required: true },
  bloodGroup: { type: String, required: true, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  password: { type: String },
  healthProblems: { type: String },
  lastDonationDate: { type: Date },
  isAvailable: { type: Boolean, default: false },
  donationCapability: { type: String, required: true, enum: ['Yes', 'No'] },
  totalDonations: { type: Number, default: 0 },
  fcmToken: { type: String, default: null },
  firebaseUid: { type: String, unique: true, sparse: true }
}, { timestamps: true });

// Indexes for performance
donorSchema.index({ email: 1 }, { unique: true });
donorSchema.index({ firebaseUid: 1 }, { sparse: true });
donorSchema.index({ bloodGroup: 1, isAvailable: 1 });
donorSchema.index({ location: 'text', fullName: 'text' });

module.exports = mongoose.model('Donor', donorSchema);