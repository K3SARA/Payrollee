const express = require('express');
const router = express.Router();
const { login, me, getDemoAccounts } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', requireAuth, me);
router.get('/demo-accounts', getDemoAccounts);

module.exports = router;
