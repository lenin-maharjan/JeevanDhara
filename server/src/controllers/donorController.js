const Donor = require('../models/Donor');

// =====================================================
// DONOR CRUD OPERATIONS (Firebase Auth handles login/register)
// =====================================================

const getAllDonors = async (req, res) => {
  try {
    const donors = await Donor.find().select('-password');
    res.json(donors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getDonorById = async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id).select('-password');
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }
    res.json(donor);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateDonor = async (req, res) => {
  try {
    const donor = await Donor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    res.json({ message: 'Donor updated successfully', donor });
  } catch (error) {
    res.status(400).json({ message: 'Update failed', error: error.message });
  }
};

const deleteDonor = async (req, res) => {
  try {
    const donor = await Donor.findByIdAndDelete(req.params.id);
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }
    res.json({ message: 'Donor deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
};

const searchDonors = async (req, res) => {
  try {
    const { bloodGroup, location, search } = req.query;
    const query = {};

    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (location) query.location = new RegExp(location, 'i');
    if (search) {
      query.$or = [
        { fullName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') }
      ];
    }

    const donors = await Donor.find(query).select('-password');
    res.json(donors);
  } catch (error) {
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
};

module.exports = {
  getAllDonors,
  getDonorById,
  updateDonor,
  deleteDonor,
  searchDonors
};
