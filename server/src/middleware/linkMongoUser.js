/**
 * Link MongoDB User Middleware
 * Finds the MongoDB user associated with the Firebase UID and attaches to request
 */

const Requester = require('../models/Requester');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');
const BloodBank = require('../models/BloodBank');

const linkMongoUser = async (req, res, next) => {
    try {
        const { uid: firebaseUid, email } = req.firebaseUser;

        // Find user in MongoDB by Firebase UID or email
        let user = null;
        let userType = null;

        // Check Requester collection
        const requester = await Requester.findOne({
            $or: [{ firebaseUid }, { email }]
        }).select('-password');
        if (requester) {
            user = requester;
            userType = 'requester';
        }

        // Check Donor collection
        if (!user) {
            const donor = await Donor.findOne({
                $or: [{ firebaseUid }, { email }]
            }).select('-password');
            if (donor) {
                user = donor;
                userType = 'donor';
            }
        }

        // Check Hospital collection
        if (!user) {
            const hospital = await Hospital.findOne({
                $or: [{ firebaseUid }, { email }]
            }).select('-password');
            if (hospital) {
                user = hospital;
                userType = 'hospital';
            }
        }

        // Check BloodBank collection
        if (!user) {
            const bloodBank = await BloodBank.findOne({
                $or: [{ firebaseUid }, { email }]
            }).select('-password');
            if (bloodBank) {
                user = bloodBank;
                userType = 'blood_bank';
            }
        }

        if (!user) {
            return res.status(404).json({
                message: 'User not found in database. Please complete registration.'
            });
        }

        // Update Firebase UID if not already set (for existing users migrating)
        if (!user.firebaseUid) {
            user.firebaseUid = firebaseUid;
            await user.save();
        }

        // Attach MongoDB user info to request (compatible with existing code)
        req.user = {
            userId: user._id,
            userType: userType,
            mongoUser: user,
            firebaseUid: firebaseUid
        };

        next();
    } catch (error) {
        console.error('Error linking MongoDB user:', error);
        res.status(500).json({ message: 'Failed to link user' });
    }
};

module.exports = linkMongoUser;
