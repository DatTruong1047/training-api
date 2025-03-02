const router = require('express').Router();
const {validateCreateUser} = require('../middleware/validations/usersValidations')

const {signIn,signUp, verifyEmail} = require('../controllers/authController')

router.post('/sign-in',signIn)
router.post('/sign-up',validateCreateUser,signUp)
router.get('/email/verify',verifyEmail)

module.exports = router;