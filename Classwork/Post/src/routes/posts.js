const router = require('express').Router();
const User = require('../models/User');
const Post = require('../models/Post');

const {getPosts, createPost, updatePost, deletePost} = require('../controllers/posts')
const {validateCreatePost, validateUpdatePost} = require('../middleware/validations')

// Get posts
router.get('/',getPosts);
// Create post
router.post('/', validateCreatePost , createPost);
// Update posts
router.put('/:id', validateUpdatePost ,updatePost);
// Delete user
router.delete('/:id', deletePost);

module.exports = router;