const Requester = require('../models/Requester');

// =====================================================
// REQUESTER CRUD OPERATIONS (Firebase Auth handles login/register)
// =====================================================

const getAllRequesters = async (req, res) => {
  try {
    const requesters = await Requester.find().select('-password');
    res.json(requesters);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching requesters', error: error.message });
  }
};

const getRequesterById = async (req, res) => {
  try {
    const requester = await Requester.findById(req.params.id).select('-password');
    if (!requester) {
      return res.status(404).json({ message: 'Requester not found' });
    }
    res.json(requester);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateRequesterProfile = async (req, res) => {
  try {
    const { hospitalName, hospitalLocation, hospitalPhone, location, latitude, longitude, ...otherFields } = req.body;
    const requesterId = req.params.id;

    const updateData = {
      hospitalName,
      hospitalLocation,
      hospitalPhone,
      ...otherFields
    };

    if (location) updateData.location = location;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;

    const requester = await Requester.findByIdAndUpdate(
      requesterId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!requester) {
      return res.status(404).json({ message: 'Requester not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        ...requester.toObject(),
        userType: 'requester'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};

const deleteRequester = async (req, res) => {
  try {
    const requester = await Requester.findByIdAndDelete(req.params.id);
    if (!requester) {
      return res.status(404).json({ message: 'Requester not found' });
    }
    res.json({ message: 'Requester deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
};

module.exports = {
  getAllRequesters,
  getRequesterById,
  updateRequesterProfile,
  deleteRequester
};
