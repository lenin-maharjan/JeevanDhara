const express = require('express');
const {
  getAllRequesters,
  updateRequesterProfile,
} = require('../controllers/requesterController');
const { getMyBloodRequests } = require('../controllers/bloodRequestController');

const router = express.Router();

router.get('/', getAllRequesters);
router.put('/:id', updateRequesterProfile);
router.get('/:id/blood-requests', getMyBloodRequests);

module.exports = router;