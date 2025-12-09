const express = require('express');
const {
  createBloodRequest,
  getAllBloodRequests,
  getBloodRequestById,
  updateBloodRequest,
  deleteBloodRequest,
  cancelBloodRequest,
  getMyBloodRequests,
  getDonorHistory,
  acceptBloodRequest,
  fulfillBloodRequest
} = require('../controllers/bloodRequestController');

// Firebase Auth middleware only
const verifyFirebaseToken = require('../middleware/firebaseAuth');
const linkMongoUser = require('../middleware/linkMongoUser');

const router = express.Router();

// All routes use Firebase authentication
const authenticate = [verifyFirebaseToken, linkMongoUser];

router.post('/', authenticate, createBloodRequest);
router.get('/', authenticate, getAllBloodRequests);
router.get('/requester/:requesterId', authenticate, getMyBloodRequests);
router.get('/donor/:donorId/history', authenticate, getDonorHistory);
router.get('/:id', authenticate, getBloodRequestById);
router.put('/:id', authenticate, updateBloodRequest);
router.put('/:id/cancel', authenticate, cancelBloodRequest);
router.post('/accept', authenticate, acceptBloodRequest);
router.post('/fulfill', authenticate, fulfillBloodRequest);
router.delete('/:id', authenticate, deleteBloodRequest);

module.exports = router;