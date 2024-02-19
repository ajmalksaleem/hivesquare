import Users from "../models/userModel.js";
import { errorHandler } from "../utils/ErrorHandler.js";
import { compareString, createJWT, hashString } from "../utils/index.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";

export const registerUser = async (req, res, next) => {
    const { firstName, lastName, email, password } = req.body;
    if (!(firstName || lastName || email || password)) {
        next(errorHandler(404, 'Provide rquired fields'))
        return
    }
    try {
        const existUser = await Users.findOne({ email })
        if (existUser) {
            next(errorHandler(403, 'email already exist'))
            return
        }
        const hashedPassword = await hashString(password)
        const user = await Users.create({ firstName, lastName, email, password: hashedPassword })
        //email verification
        sendVerificationEmail(user, res)
    } catch (error) {
        next(error)
    }
}

export const loginUser = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const foundUser = await Users.findOne({ email }).select("+password").populate({
            path: "friends",
            select: "firstName lastName location profileUrl -password",
        });
        if (!foundUser) return next(errorHandler(404, "incorrect username or password"))
        if (!(foundUser?.verified)) return next(errorHandler(402, 'Your account is not verified, check your email verify your account'))
        const isMatch = await compareString(password, foundUser?.password);
        if (!isMatch) return next(errorHandler(403, 'Invalid Username or Password'))
        foundUser.password = undefined;
        const token = createJWT(foundUser?._id)
        res.status(201).json({
            success: true,
            message: 'LoggedIn successfully',
            foundUser,
            token
        })
    } catch (error) {
        next(error)
    }
}
