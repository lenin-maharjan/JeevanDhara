const express = require('express');
const {
    getPendingHospitals,
    getVerifiedHospitals,
    verifyHospital,
    rejectHospital,
    getPendingBloodBanks,
    getVerifiedBloodBanks,
    verifyBloodBank,
    rejectBloodBank,
    getAdminStats
} = require('../controllers/adminController');

const router = express.Router();

// Dashboard stats
router.get('/stats', getAdminStats);

// Hospital routes
router.get('/hospitals/pending', getPendingHospitals);
router.get('/hospitals/verified', getVerifiedHospitals);
router.put('/hospitals/:id/verify', verifyHospital);
router.put('/hospitals/:id/reject', rejectHospital);

// Blood bank routes
router.get('/blood-banks/pending', getPendingBloodBanks);
router.get('/blood-banks/verified', getVerifiedBloodBanks);
router.put('/blood-banks/:id/verify', verifyBloodBank);
router.put('/blood-banks/:id/reject', rejectBloodBank);

module.exports = router;
