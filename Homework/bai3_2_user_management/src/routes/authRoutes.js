const router = require('express').Router();
const {validateCreateUser} = require('../middleware/validations/usersValidations')

const {signIn,signUp, verifyEmail} = require('../controllers/authController')

// POST /auth/sign-in
router.post('/sign-in',signIn)
// POST /auth/sign-up
router.post('/sign-up',validateCreateUser,signUp)
// POST /auth/email/verify
router.get('/email/verify',verifyEmail)

module.exports = router;