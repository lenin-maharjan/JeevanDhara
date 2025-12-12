const bcrypt = require('bcryptjs');
const Requester = require('../models/Requester');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');
const BloodBank = require('../models/BloodBank');

// =====================================================
// FIREBASE AUTH ENDPOINTS
// =====================================================

/**
 * Get current authenticated user's profile
 * Requires Firebase Auth middleware + linkMongoUser middleware
 */
const getCurrentUser = async (req, res) => {
  try {
    const { mongoUser, userType } = req.user;

    if (!mongoUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user without password
    const userObj = mongoUser.toObject();
    delete userObj.password;

    res.status(200).json({
      ...userObj,
      userType
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user', error: error.message });
  }
};

/**
 * Create MongoDB user after Firebase signup
 * Requires Firebase Auth middleware (firebaseUser attached to req)
 */
const createUserAfterFirebaseSignup = async (req, res) => {
  try {
    const { uid: firebaseUid, email } = req.firebaseUser;
    const { userType, password, ...userData } = req.body;

    // Check if user already exists
    const existingRequester = await Requester.findOne({ $or: [{ email }, { firebaseUid }] });
    const existingDonor = await Donor.findOne({ $or: [{ email }, { firebaseUid }] });
    const existingHospital = await Hospital.findOne({ $or: [{ email }, { firebaseUid }] });
    const existingBloodBank = await BloodBank.findOne({ $or: [{ email }, { firebaseUid }] });

    if (existingRequester || existingDonor || existingHospital || existingBloodBank) {
      return res.status(400).json({ message: 'User already exists' });
    }

    let newUser;

    switch (userType) {
      case 'requester':
        newUser = new Requester({
          ...userData,
          email,
          firebaseUid
        });
        break;
      case 'donor':
        newUser = new Donor({
          ...userData,
          email,
          firebaseUid
        });
        break;
      case 'hospital':
        newUser = new Hospital({
          ...userData,
          email,
          firebaseUid
        });
        break;
      case 'blood_bank':
        newUser = new BloodBank({
          ...userData,
          email,
          firebaseUid
        });
        break;
      default:
        return res.status(400).json({ message: 'Invalid user type' });
    }

    await newUser.save();

    // Return user without password
    const userObj = newUser.toObject();
    delete userObj.password;

    res.status(201).json({
      message: 'User created successfully',
      user: { ...userObj, userType }
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

/**
 * Link existing MongoDB user to Firebase UID
 * For migrating existing users to Firebase Auth
 */
const linkFirebaseUser = async (req, res) => {
  try {
    const { uid: firebaseUid, email } = req.firebaseUser;
    const { userType } = req.body;

    let Model;
    switch (userType) {
      case 'requester': Model = Requester; break;
      case 'donor': Model = Donor; break;
      case 'hospital': Model = Hospital; break;
      case 'blood_bank': Model = BloodBank; break;
      default: return res.status(400).json({ message: 'Invalid user type' });
    }

    const user = await Model.findOneAndUpdate(
      { email },
      { firebaseUid },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Firebase user linked successfully',
      user: { ...user.toObject(), userType }
    });
  } catch (error) {
    res.status(500).json({ message: 'Linking failed', error: error.message });
  }
};

/**
 * Get user profile by ID (public endpoint for viewing other users)
 */
const getProfile = async (req, res) => {
  try {
    const { userId, userType } = req.params;

    let user;
    switch (userType) {
      case 'requester':
        user = await Requester.findById(userId).select('-password');
        break;
      case 'donor':
        user = await Donor.findById(userId).select('-password');
        break;
      case 'hospital':
        user = await Hospital.findById(userId).select('-password');
        break;
      case 'blood_bank':
        user = await BloodBank.findById(userId).select('-password');
        break;
      default:
        return res.status(400).json({ message: 'Invalid user type' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ ...user.toObject(), userType });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get profile', error: error.message });
  }
};

/**
 * Update FCM token for push notifications
 * Requires Firebase Auth middleware
 */
const updateFCMToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const { userId, userType } = req.user;

    let updatedUser = null;

    switch (userType) {
      case 'requester':
        updatedUser = await Requester.findByIdAndUpdate(userId, { fcmToken }, { new: true });
        break;
      case 'donor':
        updatedUser = await Donor.findByIdAndUpdate(userId, { fcmToken }, { new: true });
        break;
      case 'hospital':
        updatedUser = await Hospital.findByIdAndUpdate(userId, { fcmToken }, { new: true });
        break;
      case 'blood_bank':
        updatedUser = await BloodBank.findByIdAndUpdate(userId, { fcmToken }, { new: true });
        break;
    }

    if (updatedUser) {
      console.log(`Updated FCM token for ${userType} ${userId}`);
    }

    res.status(200).json({ message: 'FCM token updated successfully' });
  } catch (error) {
    console.error("Error updating FCM token:", error);
    res.status(500).json({ message: 'Failed to update FCM token', error: error.message });
  }
};

/**
 * Update user profile
 * Requires Firebase Auth middleware
 */
const updateProfile = async (req, res) => {
  try {
    const { userId, userType } = req.user;
    const updates = req.body;

    // Prevent updating sensitive fields
    delete updates.password;
    delete updates.email;
    delete updates.firebaseUid;
    delete updates._id;
    delete updates.userType;

    let updatedUser = null;

    switch (userType) {
      case 'requester':
        updatedUser = await Requester.findByIdAndUpdate(userId, updates, { new: true });
        break;
      case 'donor':
        updatedUser = await Donor.findByIdAndUpdate(userId, updates, { new: true });
        break;
      case 'hospital':
        updatedUser = await Hospital.findByIdAndUpdate(userId, updates, { new: true });
        break;
      case 'blood_bank':
        updatedUser = await BloodBank.findByIdAndUpdate(userId, updates, { new: true });
        break;
      default:
        return res.status(400).json({ message: 'Invalid user type' });
    }

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: { ...updatedUser.toObject(), userType }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

module.exports = {
  getCurrentUser,
  createUserAfterFirebaseSignup,
  linkFirebaseUser,
  getProfile,
  updateFCMToken,
  updateProfile
};
