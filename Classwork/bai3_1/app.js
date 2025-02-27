const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const routes = require('./src/routes');
require('dotenv').config();

const app = express();

const port = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
// Middleware
app.use(bodyParser.json());

// Database connection
mongoose.connect((MONGODB_URI)
, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Routes
app.use('/api/', routes);

// Error handling middleware
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        status: err.status || 500,
        message: err.message
    });
});

app.listen(port, () => console.log('Server running'));