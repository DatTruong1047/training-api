const { Schema } = require('mongoose');
const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    status: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type:Date
    }
});

module.exports = mongoose.model('Post', postSchema);
