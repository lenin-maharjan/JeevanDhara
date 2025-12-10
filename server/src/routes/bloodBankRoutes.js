const express = require('express');
const { getAllBloodBanks, getBloodBankProfile, recordDonation, getDonations, recordDistribution, getDistributions, getBloodBankRequests } = require('../controllers/bloodBankController');

const router = express.Router();

router.get('/', getAllBloodBanks);
router.get('/:id', getBloodBankProfile);
router.post('/:id/donations', recordDonation);
router.get('/:id/donations', getDonations);
router.post('/:id/distributions', recordDistribution);
router.get('/:id/distributions', getDistributions);
router.get('/:id/requests', getBloodBankRequests); // Added new route

module.exports = router;