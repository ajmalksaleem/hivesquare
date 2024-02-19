import { connect } from "mongoose";

const ConnectToDatabase = async () => {
    try {
        await connect(process.env.MONGODB_URL)
        console.log('mongdb connected to the server')
    } catch (error) {
        console.log(error + "connection error of db")
    }
}

export default ConnectToDatabase