const express=require('express');
const { getLogin, postLogin, postRegister, getDashboard, getRegister, getUpdatePage, updateUserDetails, getForgetPwd, postForgetPwd, getPwdReset, postPwdReset, searchUsers } = require('../controllers/userController');
const upload  = require('../middleware/upload');

const router=express.Router();

router.get('/',getLogin);
router.get('/register',getRegister);

router.post('/login',  postLogin);
router.post('/register',postRegister);
router.get('/dashboard',  getDashboard);

router.get('/users/update/:id',getUpdatePage);
router.post('/users/update/:id',upload.single('profilePicture'),updateUserDetails)

router.get('/forget-password',getForgetPwd);
router.post('/forget-password',postForgetPwd);
router.get('/reset-password/:token',getPwdReset);
router.post('/reset-password/:token',postPwdReset);

router.get('/searchUsers',searchUsers)

module.exports=router;