const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();


// Middleware to verify the JWT token from cookies


const verifyToken = (req, res, next) => {
    // const token =req.headers['authorization']?.split(' ')[1]; // Getting token from query param or Authorization header
    const token = req.query.token; // Extract token from the query parameter

    if (!token) {
        return res.status(401).send('Unauthorized: No token provided');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user details to request
        next();
    } catch (err) {
        return res.status(403).send('Unauthorized: Invalid token');
    }
};

module.exports = verifyToken;
