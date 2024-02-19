import bcrypt from 'bcryptjs'
import JWT from 'jsonwebtoken'

export const hashString = async (useValue) => {
    const Salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(useValue, Salt)
    return hashedPassword
};

export const compareString = async (userPassword, password) => {
    const isMatch = await bcrypt.compare(userPassword, password)
    return isMatch;
};

export const createJWT = (id) => {
    return JWT.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '1d' })
}