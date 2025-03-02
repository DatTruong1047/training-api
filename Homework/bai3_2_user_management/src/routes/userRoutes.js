const router = require('express').Router();
const {getUsers, updatedUserProfile, getUserProfile, changeUserPassword} = require('../controllers/usersController');
const authMiddleware = require('../middleware/auth/authMiddleware');
const {validateUpdateUser, validateChangePasswork} = require('../middleware/validations/usersValidations')
const adminMiddleware = require('../middleware/auth/adminMiddleware');

// GET /users
router.get('/',authMiddleware,adminMiddleware,getUsers);

// GET /users/profile
router.get('/profile',authMiddleware,getUserProfile);

// PUT /users/profile
router.put('/profile',validateUpdateUser,authMiddleware,updatedUserProfile);

// PUT /users/change-password
router.put('/password',validateChangePasswork,authMiddleware,changeUserPassword);


module.exports = router;