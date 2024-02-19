import { Router } from "express";
import path from 'path'
import {
    acceptRequest, changePassword, friendsRequest, getFriendRequest, getUser, profileViews, requestPasswordReset,
    resetPassword, suggestedFriends, updateUser, verifyEmail
} from "../controllers/usercontroller.js";
import userAuth from "../utils/userAuth.js";

const router = Router();
const __dirname = path.resolve(path.dirname(""))

//verification-email
router.get("/verify/:userId/:token", verifyEmail)
router.get('/verified', (req, res) => {
    res.sendFile(path.join(__dirname, './views/build', 'index.html'))
})
//reset-password
router.post('/request-passwordreset', requestPasswordReset);
router.get('/reset-password/:userId/:token', resetPassword);
router.get('/resetpassword', (req, res) => {
    res.sendFile(path.join(__dirname, './views/build', 'index.html'))
})
router.post('/reset-password', changePassword)
////
router.post('/get-user/:id?', userAuth, getUser)
router.put('/update-user', userAuth, updateUser)
///friend reuest//////////////////////////////
router.post('/friend-request', userAuth, friendsRequest);
router.post('/get-friend-request', userAuth, getFriendRequest);
//////accept /deny friend request////////////
router.post('/accept-request', userAuth, acceptRequest)
/// view-profile
router.post('/profile-view', userAuth, profileViews)
///suggested friends
router.post('/suggested-friends', userAuth, suggestedFriends)
export default router