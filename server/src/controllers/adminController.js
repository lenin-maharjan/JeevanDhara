const Hospital = require('../models/Hospital');
const BloodBank = require('../models/BloodBank');

// ========================================
// HOSPITAL VERIFICATION
// ========================================

/**
 * Get all pending hospitals awaiting verification
 */
const getPendingHospitals = async (req, res) => {
    try {
        const hospitals = await Hospital.find({
            verificationStatus: 'pending'
        }).select('-password').sort({ createdAt: -1 });

        res.json({
            count: hospitals.length,
            hospitals
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch pending hospitals', error: error.message });
    }
};

/**
 * Get all verified hospitals
 */
const getVerifiedHospitals = async (req, res) => {
    try {
        const hospitals = await Hospital.find({
            verificationStatus: 'verified'
        }).select('-password').sort({ createdAt: -1 });

        res.json({
            count: hospitals.length,
            hospitals
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch verified hospitals', error: error.message });
    }
};

/**
 * Verify/Approve a hospital
 */
const verifyHospital = async (req, res) => {
    try {
        const { id } = req.params;

        const hospital = await Hospital.findByIdAndUpdate(
            id,
            {
                isVerified: true,
                verificationStatus: 'verified'
            },
            { new: true }
        ).select('-password');

        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }

        res.json({
            message: 'Hospital verified successfully',
            hospital
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to verify hospital', error: error.message });
    }
};

/**
 * Reject a hospital
 */
const rejectHospital = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const hospital = await Hospital.findByIdAndUpdate(
            id,
            {
                isVerified: false,
                verificationStatus: 'rejected',
                rejectionReason: reason || 'Not specified'
            },
            { new: true }
        ).select('-password');

        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }

        res.json({
            message: 'Hospital rejected',
            hospital
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to reject hospital', error: error.message });
    }
};

// ========================================
// BLOOD BANK VERIFICATION
// ========================================

/**
 * Get all pending blood banks awaiting verification
 */
const getPendingBloodBanks = async (req, res) => {
    try {
        const bloodBanks = await BloodBank.find({
            verificationStatus: 'pending'
        }).select('-password').sort({ createdAt: -1 });

        res.json({
            count: bloodBanks.length,
            bloodBanks
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch pending blood banks', error: error.message });
    }
};

/**
 * Get all verified blood banks
 */
const getVerifiedBloodBanks = async (req, res) => {
    try {
        const bloodBanks = await BloodBank.find({
            verificationStatus: 'verified'
        }).select('-password').sort({ createdAt: -1 });

        res.json({
            count: bloodBanks.length,
            bloodBanks
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch verified blood banks', error: error.message });
    }
};

/**
 * Verify/Approve a blood bank
 */
const verifyBloodBank = async (req, res) => {
    try {
        const { id } = req.params;

        const bloodBank = await BloodBank.findByIdAndUpdate(
            id,
            {
                isVerified: true,
                verificationStatus: 'verified'
            },
            { new: true }
        ).select('-password');

        if (!bloodBank) {
            return res.status(404).json({ message: 'Blood bank not found' });
        }

        res.json({
            message: 'Blood bank verified successfully',
            bloodBank
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to verify blood bank', error: error.message });
    }
};

/**
 * Reject a blood bank
 */
const rejectBloodBank = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const bloodBank = await BloodBank.findByIdAndUpdate(
            id,
            {
                isVerified: false,
                verificationStatus: 'rejected',
                rejectionReason: reason || 'Not specified'
            },
            { new: true }
        ).select('-password');

        if (!bloodBank) {
            return res.status(404).json({ message: 'Blood bank not found' });
        }

        res.json({
            message: 'Blood bank rejected',
            bloodBank
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to reject blood bank', error: error.message });
    }
};

// ========================================
// DASHBOARD STATS
// ========================================

/**
 * Get admin dashboard statistics
 */
const getAdminStats = async (req, res) => {
    try {
        const [
            pendingHospitals,
            verifiedHospitals,
            rejectedHospitals,
            pendingBloodBanks,
            verifiedBloodBanks,
            rejectedBloodBanks
        ] = await Promise.all([
            Hospital.countDocuments({ verificationStatus: 'pending' }),
            Hospital.countDocuments({ verificationStatus: 'verified' }),
            Hospital.countDocuments({ verificationStatus: 'rejected' }),
            BloodBank.countDocuments({ verificationStatus: 'pending' }),
            BloodBank.countDocuments({ verificationStatus: 'verified' }),
            BloodBank.countDocuments({ verificationStatus: 'rejected' })
        ]);

        res.json({
            hospitals: {
                pending: pendingHospitals,
                verified: verifiedHospitals,
                rejected: rejectedHospitals,
                total: pendingHospitals + verifiedHospitals + rejectedHospitals
            },
            bloodBanks: {
                pending: pendingBloodBanks,
                verified: verifiedBloodBanks,
                rejected: rejectedBloodBanks,
                total: pendingBloodBanks + verifiedBloodBanks + rejectedBloodBanks
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch admin stats', error: error.message });
    }
};

module.exports = {
    // Hospital endpoints
    getPendingHospitals,
    getVerifiedHospitals,
    verifyHospital,
    rejectHospital,

    // Blood bank endpoints
    getPendingBloodBanks,
    getVerifiedBloodBanks,
    verifyBloodBank,
    rejectBloodBank,

    // Dashboard
    getAdminStats
};
