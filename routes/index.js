import { Router } from "express";
import authRouter from "./authRoute.js";
import userRouter from './userRoutes.js'
import postRouter from './postRoute.js'
const router = Router()

router.use('/auth', authRouter)
router.use('/users', userRouter)
router.use('/posts', postRouter)

export default router;