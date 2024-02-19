import { Router } from "express";
import userAuth from "../utils/userAuth.js";
import { createPost, getComments, getPost, getPosts, getUserPost, likePost, likePostComments, commentPost, replyPostComment, deletePost } from "../controllers/postController.js";

const router = Router();

router.post('/create-post', userAuth, createPost)
router.post('/', userAuth, getPosts)
router.post('/:id', userAuth, getPost)
router.post('/get-user-post/:id', userAuth, getUserPost)
//get comments
router.get('/comments/:postId', getComments)
//like and comments on post
router.post("/like/:id", userAuth, likePost)
router.post("/like-comment/:id/:rid?", userAuth, likePostComments);
router.post("/comment/:id", userAuth, commentPost);
router.post("/reply-comment/:id", userAuth, replyPostComment);
//delete post
router.delete("/:id", userAuth, deletePost)
export default router