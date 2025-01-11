const express=require('express');
const { sendRequest, acceptRequest, getFriends, getPendingRequests } = require('../controllers/friendController');
const verifyToken = require('../middleware/auth');
const router=express.Router();

router.get('/:userId',verifyToken,getFriends);

router.get('/pending/:userId',verifyToken, getPendingRequests)

router.post('/request',sendRequest);

router.post('/accept',acceptRequest);

module.exports=router;