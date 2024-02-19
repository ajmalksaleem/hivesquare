import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'FirstName is Required']
    },
    lastName: {
        type: String,
        required: [true, 'lastName is Required']
    },
    email: {
        type: String,
        required: [true, 'Email is Required'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Password is Required'],
        minlength: [6, 'password length shouldbe greater than 6 charector'],
        select: true
    },
    location: {
        type: String
    },
    profileUrl: {
        type: String
    },
    profession: {
        type: String
    },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
    views: [{ types: String }],
    verified: { type: Boolean, default: false }
},
    { timestamps: true }
)
const Users = mongoose.model('Users', userSchema)

export default Users;