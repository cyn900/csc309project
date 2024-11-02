import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/utils/auth';

export default async function handler(req, res) {

    // Verify the refresh token
    const decoded = verifyRefreshToken(req.headers.authorization);

    if (!decoded) {
        return res.status(401).json({ message: 'Invalid refresh token.' });
    }

    // Assuming the decoded token has necessary data like `useremail` or `userId`
    try {
        // Generate a new access token
        const newAccessToken = generateAccessToken({ useremail: decoded.useremail });

        // Optionally, you can also issue a new refresh token if you want to implement a sliding session
        const newRefreshToken = generateRefreshToken({ useremail: decoded.useremail });

        // Send the new tokens back to the user
        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        console.error('Error generating token:', error);
        res.status(500).json({ message: 'Failed to generate tokens.' });
    }
}