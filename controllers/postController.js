import Comments from "../models/commentModel.js";
import Posts from "../models/postModel.js";
import Users from "../models/userModel.js";
import { errorHandler } from "../utils/ErrorHandler.js";

export const createPost = async (req, res, next) => {
    try {
        const { userId } = req.body.user;
        const { description, image } = req.body;
        if (!description) return next(errorHandler(400, 'You must provide a description'))
        const post = await Posts.create({
            userId,
            description,
            image
        })
        res.status(200).json({
            sucess: true,
            message: "Post created successfully",
            data: post,
        })
    } catch (error) {
        next(error)
    }
};

export const getPosts = async (req, res, next) => {
    try {
        const { userId } = req.body.user;
        const { search } = req.body
        const user = await Users.findById(userId);
        const friends = user?.friends?.toString().split(",") ?? [];
        friends.push(userId)
        const searchPostQuery = {
            $or: [
                {
                    description: { $regex: search, $options: 'i' }
                }
            ]
        };
        const posts = await Posts.find(search ? searchPostQuery : {})
            .populate({
                path: "userId",
                select: "firstName lastName profileUrl location -password"
            })
            .sort({ _id: -1 })
        const friendsPosts = posts?.filter((post) => {
            return friends.includes(post?.userId?._id.toString())
        })
        const otherPosts = posts?.filter((post) => {
            !friends.includes(post?.userId?._id.toString())
        });
        let postRes = null;
        if (friendsPosts?.length > 0) {
            postRes = search ? friendsPosts : [...friendsPosts, ...otherPosts]
        } else {
            postRes = posts;
        }
        res.status(200).json({
            sucess: true,
            message: "successfully",
            data: postRes,
        })
    } catch (error) {
        next(error)
    }
}

export const getPost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const post = await Posts.findById(id).populate({
            path: "userId",
            select: "firstName lastName profileUrl location -password"
        });
        res.status(200).json({
            sucess: true,
            message: "successfully",
            data: post,
        })
    } catch (error) {
        next(error)
    }
};

export const getUserPost = async (req, res, next) => {
    try {
        const { id } = req.params
        const post = await Posts.find({ userId: id })
            .populate({
                path: "userId",
                select: "firstName lastName profileUrl location -password"
            })
            .sort({ _id: -1 })
        res.status(200).json({
            sucess: true,
            message: "successfully",
            data: post,
        })
    } catch (error) {
        next(error)
    }
};

export const getComments = async (req, res, next) => {
    try {
        const { postId } = req.params;
        const postComments = await Comments.find({ postId })
            .populate({
                path: "userId",
                select: "firstName lastName location profileUrl -password"
            })
            .populate({
                path: "replies.userId",
                select: "firstName lastName location profileUrl -password"
            })
            .sort({ _id: -1 });
        res.status(200).json({
            success: true,
            message: "successfully",
            data: postComments
        })
    } catch (error) {
        next(error)
    }
};

export const likePost = async (req, res, next) => {
    try {
        const { userId } = req.body.user;
        const { id } = req.params
        const post = await Posts.findById(id)
        const index = post.likes.findIndex((pid) => pid === String(userId))
        if (index === -1) {
            post.likes.push(userId)
        } else {
            post.likes = post.likes.filter((pid) => pid !== String(userId))
        }
        const newPost = await Posts.findByIdAndUpdate(id, post, {
            new: true,
        })
        res.status(200).json({
            sucess: true,
            message: "successfully",
            data: newPost,
        });
    } catch (error) {
        next(error)
    }
};

export const likePostComments = async (req, res, next) => {
    const { userId } = req.body.user;
    const { id, rid } = req.params;
    try {
        if (rid === undefined || rid === null || rid === "false") {
            const comment = await Comments.findById(id)
            const index = comment?.likes?.findIndex((el) => el === String(userId));
            if (index === -1) {
                comment.likes.push(userId)
            } else {
                comment.likes = comment.likes.filter((i) => i !== String(userId))
            }
            const updated = await Comments.findByIdAndUpdate(id, comment, {
                new: true
            })
            res.status(200).json(updated)
        } else {
            const replyComments = await Comments.findOne(
                { _id: id },
                {
                    replies: {
                        $elemMatch: {
                            _id: rid
                        }
                    }
                }
            )
            const index = replyComments?.replies[0]?.likes.findIndex((i) => i === String(userId))
            if (index === -1) {
                replyComments?.replies[0]?.likes.push(userId)
            } else {
                replyComments?.replies[0]?.likes.filter((i) => i !== String(userId))
            }
            const query = { _id: id, "replies._id": rid };

            const updated = {
                $set: {
                    "replies.$.likes": replyComments.replies[0].likes,
                },
            };

            const result = await Comments.updateOne(query, updated, { new: true });

            res.status(201).json(result);
        }
    } catch (error) {

    }
};

export const commentPost = async (req, res, next) => {
    const { id } = req.params;
    const { comment, from } = req.body;
    const { userId } = req.body.user
    try {
        if (comment === null) return next(errorHandler(400, "comment is required"));
        const newComment = new Comments({ postId: id, userId, from, comment })
        await newComment.save()
        //
        const post = await Posts.findById(id);
        post.comments.push(newComment._id);
        const updatedPost = await Posts.findByIdAndUpdate(id, post, {
            new: true,
        })
        res.status(201).json(newComment)
    } catch (error) {
        next(error)
    }
};

export const replyPostComment = async (req, res, next) => {
    const { id } = req.params;
    const { userId } = req.body.user
    const { comment, replyAt, from } = req.body;
    if (comment === null) return next(errorHandler(400, "Comment is required"))
    try {
        const commentInfo = await Comments.findById(id);
        commentInfo.replies.push({
            comment,
            replyAt,
            from,
            userId,
            created_At: Date.now()
        })
        commentInfo.save()
        res.status(200).json(commentInfo);
    } catch (error) {
        next(error)
    }
};

export const deletePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        await Posts.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: "Deleted successfully"
        })
    } catch (error) {
        next(error)
    }
}