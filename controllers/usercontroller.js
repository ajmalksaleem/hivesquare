import Verification from "../models/emailVerification.js"
import FriendRequest from "../models/friendRequest.js";
import PasswordReset from "../models/passwordReset.js";
import Users from "../models/userModel.js";
import { errorHandler } from "../utils/ErrorHandler.js";
import { compareString, createJWT, hashString } from "../utils/index.js";
import { resetPassworLink } from "../utils/sendEmail.js";

export const verifyEmail = async (req, res) => {
    const { userId, token } = req.params;

    try {
        const result = await Verification.findOne({ userId });

        if (result) {
            const { expiresAt, token: hashedToken } = result;

            // token has expires
            if (expiresAt < Date.now()) {
                Verification.findOneAndDelete({ userId })
                    .then(() => {
                        Users.findOneAndDelete({ _id: userId })
                            .then(() => {
                                const message = "Verification token has expired.";
                                res.redirect(`/users/verified?status=error&message=${message}`);
                            })
                            .catch((err) => {
                                res.redirect(`/users/verified?status=error&message=`);
                            });
                    })
                    .catch((error) => {
                        console.log(error);
                        res.redirect(`/users/verified?message=`);
                    });
            } else {
                //token valid
                compareString(token, hashedToken)
                    .then((isMatch) => {
                        if (isMatch) {
                            Users.findOneAndUpdate({ _id: userId }, { verified: true })
                                .then(() => {
                                    Verification.findOneAndDelete({ userId }).then(() => {
                                        const message = "Email verified successfully";
                                        res.redirect(
                                            `/users/verified?status=success&message=${message}`
                                        );
                                    });
                                })
                                .catch((err) => {
                                    console.log(err);
                                    const message = "Verification failed or link is invalid";
                                    res.redirect(
                                        `/users/verified?status=error&message=${message}`
                                    );
                                });
                        } else {
                            // invalid token
                            const message = "Verification failed or link is invalid";
                            res.redirect(`/users/verified?status=error&message=${message}`);
                        }
                    })
                    .catch((err) => {
                        console.log(err);
                        res.redirect(`/users/verified?message=`);
                    });
            }
        } else {
            const message = "Invalid verification link. Try again later.";
            res.redirect(`/users/verified?status=error&message=${message}`);
        }
    } catch (error) {
        console.log(err);
        res.redirect(`/users/verified?message=`);
    }
};

export const requestPasswordReset = async (req, res, next) => {
    try {
        const { email } = req.body;
        const foundUser = await Users.findOne({ email })
        if (!foundUser) return next(errorHandler(404, 'Email address not found'))
        const existingRequest = await PasswordReset.findOne({ email })
        if (existingRequest) {
            if (existingRequest.expiresAt > Date.now()) return next(errorHandler(400, "Reset password link already been sent to your email"))
            await PasswordReset.findOneAndDelete({ email })
        }
        await resetPassworLink(foundUser, res);

    } catch (error) {
        next(error)
    }
};

export const resetPassword = async (req, res, next) => {
    const { userId, token } = req.params;
    try {
        const user = await Users.findById(userId)
        if (!user) {
            const message = 'Invalid password resetlink. Tryagain'
            res.redirect(`/users/resetpassword?status=error&message=${message}`)
        }
        const resetPwd = await PasswordReset.findOne({ userId })
        if (!resetPwd) {
            const message = 'Invalid password resetlink. Tryagain'
            res.redirect(`/users/resetpassword?status=error&message=${message}`)
        }
        const { expiresAt, token: resetToken } = resetPwd
        if (expiresAt < Date.now()) {
            const message = "Reset password link has expired. Please try again"
            res.redirect(`/users/resetpassword?status=error&message=${message}`)
        } else {
            const isMatch = await compareString(token, resetToken)
            if (!isMatch) {
                const message = 'Invalid password resetlink. Tryagain'
                res.redirect(`/users/resetpassword?status=error&message=${message}`)
            } else {
                res.redirect(`/users/resetpassword?type=reset&id=${userId}`);
            }
        }
    } catch (error) {
        next(error)
    }
};

export const changePassword = async (req, res, next) => {
    try {
        const { userId, password } = req.body;
        const hashedPassword = await hashString(password)
        const user = await Users.findByIdAndUpdate(
            { _id: userId },
            { password: hashedPassword }
        );
        if (user) {
            await PasswordReset.findOneAndDelete({ userId });
            res.status(200).json({
                ok: true,
            });
        }
    } catch (error) {
        console.log(error);
        next(error)
    }
}

export const getUser = async (req, res, next) => {
    try {
        const { userId } = req.body.user
        const { id } = req.params
        const user = await Users.findById(id ?? userId).populate({
            path: "friends",
            select: '-password'
        })
        if (!user) return next(errorHandler(200, 'user not found'))
        user.password = undefined;
        res.status(200).json({
            success: true,
            user: user,
        });
    } catch (error) {
        console.log(error)
        next(error)
    }
}

export const updateUser = async (req, res, next) => {
    try {
        const { firstName, lastName, location, profileUrl, profession } = req.body
        if (!(firstName || lastName || location || profileUrl || profession)) {
            return next(errorHandler(404, 'Please provide all required fields'))
        }
        const { userId } = req.body.user
        const updatedField = {
            firstName, lastName, location, profileUrl, profession, _id: userId
        }
        const updatedUser = await Users.findByIdAndUpdate(userId, updatedField, {
            new: true
        });
        await updatedUser.populate({ path: "friends", select: "-password" })
        const token = createJWT(updatedUser?._id);
        res.status(200).json({
            success: true,
            message: "User updated successfully",
            updatedUser,
            token,
        })
    } catch (error) {
        next(error)
    }
}

////////////////////////friend requests///////////////////////////////////

export const friendsRequest = async (req, res, next) => {
    try {
        const { userId } = req.body.user;
        const { requestTo } = req.body;
        const requestExist = await FriendRequest.findOne({
            requestFrom: userId,
            requestTo,
        });
        if (requestExist) return next(errorHandler(404, 'Friend Request already sent.'))
        const accountExist = await FriendRequest.findOne({
            requestFrom: requestTo,
            requestTo: userId
        })
        if (accountExist) return next(errorHandler(404, 'Friend Request already sent.'))
        const newReq = await FriendRequest.create({
            requestFrom: userId,
            requestTo
        })
        res.status(201).json({
            success: true,
            message: "Friend Request sent successfully",
        })
    } catch (error) {
        next(error)
    }
};

export const getFriendRequest = async (req, res, next) => {
    try {
        const { userId } = req.body.user
        const request = await FriendRequest.find({
            requestTo: userId,
            requestStatus: 'Pending'
        })
            .populate({
                path: 'requestFrom',
                select: 'firstName lastName profileUrl profession -password'
            })
            .limit(10)
            .sort({
                _id: -1,
            })
        res.status(200).json({
            success: true,
            data: request
        })
    } catch (error) {
        next(error)
    }
};

export const acceptRequest = async (req, res, next) => {
    try {
        const id = req.body.user.userId;
        const { rid, status } = req.body;
        const requestExist = await FriendRequest.findById(rid);
        if (!requestExist) return next(errorHandler(404, "No Friend request found"))
        const newRes = await FriendRequest.findByIdAndUpdate(
            { _id: rid },
            { requestStatus: status }
        );
        if (status === 'Accepted') {
            const user = await Users.findById(id)
            user.friends.push(newRes?.requestFrom)
            await user.save();
            const friend = await Users.findById(newRes?.requestFrom);
            friend.friends.push(newRes?.requestTo)
            await friend.save();
        }
        res.status(201).json({
            success: true,
            message: "Friend Request" + status,
        });
    } catch (error) {
        next(error)
    }
};

export const profileViews = async (req, res, next) => {
    try {
        const { userId } = req.body.user
        const { id } = req.body
        const user = await Users.findById(id);
        user.views.push(userId)
        await user.save()
        res.status(201).json({
            success: true,
            message: "Successfully"
        });
    } catch (error) {
        next(error)
    }
}

export const suggestedFriends = async (req, res, next) => {
    try {
        const { userId } = req.body.user;
        let queryObject = {}
        queryObject._id = { $ne: userId };
        queryObject.friends = { $nin: userId };
        let queryResult = Users.find(queryObject)
            .limit(15)
            .select('firstName lastName profileUrl profession -password');
        const suggestedFriends = await queryResult;
        res.status(200).json({
            success: true,
            data: suggestedFriends
        });
    } catch (error) {
        next(error)
    }
}