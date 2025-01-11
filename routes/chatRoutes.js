const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, getChat, getMessagesJson } = require('../controllers/chatController');
const verifyToken = require('../middleware/auth');


// Route to send a message
router.post('/send',verifyToken, sendMessage);

// Route to get messages between two users
router.get('/messages/:friendId', verifyToken, getMessages);

router.get('/messages/:friendId/json',getMessagesJson)
module.exports = router;
