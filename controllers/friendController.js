const User = require("../models/User");

// Send Friend Request
const mongoose = require("mongoose");

// Send Friend Request
exports.sendRequest = async (req, res) => {
    const { senderId, receiverId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
        return res.status(400).json({ error: "Invalid user IDs." });
    }

    try {
        // Ensure the user isn't trying to add themselves
        if (senderId === receiverId) {
            return res.status(400).json({ error: "Cannot send a friend request to yourself." });
        }

        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);

        if (!sender || !receiver) {
            return res.status(404).json({ error: "User not found." });
        }

        // Check if a friend request already exists
        if (receiver.friendRequests.includes(senderId)) {
            return res.status(400).json({ error: "Friend request already sent." });
        }

        receiver.friendRequests.push(senderId);
        await receiver.save();

        res.status(200).json({ message: "Friend request sent successfully." });
    } catch (error) {
        console.error("Error in sendRequest:", error);
        res.status(500).json({ error: "Failed to send friend request." });
    }
};


// Accept Friend Request
exports.acceptRequest = async (req, res) => {
    const { userId, friendId } = req.body;
    try {
        console.log("User ID:", userId);
        console.log("Friend ID:", friendId);

        // Validate input
        if (!userId || !friendId) {
            return res.status(400).json({ error: "User ID and Friend ID are required." });
        }

        const user = await User.findById(userId);
        const friend = await User.findById(friendId);

        // Check if both users exist
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }
        if (!friend) {
            return res.status(404).json({ error: "Friend not found." });
        }

        // Ensure the friend request exists
        if (!user.friendRequests.includes(friendId)) {
            return res.status(400).json({ error: "No friend request found from this user." });
        }

        // Add each other to friends list if not already added
        if (!user.friends.includes(friendId)) user.friends.push(friendId);
        if (!friend.friends.includes(userId)) friend.friends.push(userId);

        // Remove friendId from user's friendRequests list
        user.friendRequests = user.friendRequests.filter(id => id.toString() !== friendId.toString());
        await user.save();

        // Optionally remove userId from friend's friendRequests list
        friend.friendRequests = friend.friendRequests.filter(id => id.toString() !== userId.toString());
        await friend.save();

        res.status(200).json({ message: "Friend request accepted successfully." });
    } catch (error) {
        console.error("Error in acceptRequest:", error);
        res.status(500).json({ error: "Failed to accept friend request." });
    }
};


const Chat = require('../models/Chat'); // Replace with the correct path to your Chat model

const checkForNewMessages = async (userId, friendId) => {
    try {
        // Check for messages where:
        // - receiverId is the current user (userId)
        // - senderId is the friend (friendId)
        // - message is unread (add a field `isRead: false` in your Chat schema)
        console.log("Checking messages for userId:", userId, "and friendId:", friendId.toString());
        const unreadMessages = await Chat.find({
            senderId: friendId,
            receiverId:userId,
            isRead: false, // Assuming `isRead` is a field indicating if the message was read
        });
        console.log("Unread messages for", friendId, "->", userId, ":", unreadMessages);
        return unreadMessages.length > 0; // Return true if there are unread messages
    } catch (error) {
        console.error('Error checking for new messages:', error);
        return false; // Return false if an error occurs
    }
};

// Get Friends List
// Ensure the user ID in the URL parameter is valid
// exports.getFriends = async (req, res) => {
//     const { userId } = req.params; // Get user ID from the route parameter
//     const { token } = req.query;

//     console.log("userID",userId)
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//         return res.status(400).json({ error: "Invalid user ID." });
//     }

//     try {
//         const user = await User.findById(userId).populate("friends", "name email profilePicture");

//         if (!user) {
//             return res.status(404).json({ error: "User not found." });
//         }

//         res.render("friend", {
//             friends: user.friends,
//             userName: user.name,
//             token,
//             user
//         });
//     } catch (error) {
//         console.error("Error fetching friends:", error);
//         res.status(500).json({ error: "Failed to fetch friends." });
//     }
// };
exports.getFriends = async (req, res) => {
    const { userId } = req.params;
    const { token } = req.query;

    console.log("userID", userId);
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid user ID." });
    }

    try {
        const user = await User.findById(userId).populate("friends", "name email profilePicture");

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // Add `hasNewMessages` to each friend
        const friends = await Promise.all(
            user.friends.map(async friend => {
                const hasNewMessages = await checkForNewMessages(userId, friend._id);
                console.log(`Friend: ${friend.name}, hasNewMessages: ${hasNewMessages}`);
console.log("Friend ID as string:", friend._id.toString());
 return {
                    ...friend._doc, // Spread the friend's document
                    hasNewMessages, // Add hasNewMessages flag
                };
            })
        );

        console.log("Friends with hasNewMessages:", friends);
        res.render("friend", {
            friends,
            userName: user.name,
            token,
            user
        });
    } catch (error) {
        console.error("Error fetching friends:", error);
        res.status(500).json({ error: "Failed to fetch friends." });
    }
};



// Get Pending Friend Requests
// Get Pending Friend Requests

// const userIdFromToken = (token) => {
//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         console.log('decode token',decoded)
//         if (!decoded.id) {
//             console.error("Token does not contain a valid user ID.");
//             return null;
//         }
//         console.log("Decoded user ID:", decoded.id);
//         return decoded.id;
//     } catch (error) {
//         console.error("Failed to decode token:", error.message);
//         return null;
//     }
// };

// exports.getPendingRequests = async (req, res) => {
//     const { token } = req.query;

//     if (!token) {
//         return res.status(400).json({ error: "Token is required." });
//     }

//     const userId = userIdFromToken(token);
//     console.log("Extracted User ID:", userId);
//     if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
//         return res.status(400).json({ error: "Invalid token or user ID." });
//     }
//     console.log('token ree=cerive', token)
//     try {
//         // Find the user by ID
//         const user = await User.findById(userId);

//         console.log('user found',user)
//         if (!user) {
//             return res.status(404).json({ error: "User not found." });
//         }

//         // Ensure friendRequests array is valid
//         const validFriendRequests = user.friendRequests.filter((id) => mongoose.Types.ObjectId.isValid(id));
//         if (validFriendRequests.length === 0) {
//             return res.status(200).json({ message: "No pending friend requests." });
//         }

//         // Fetch users for valid friend requests
//         const pendingRequests = await User.find({ _id: { $in: validFriendRequests } });
//         if (pendingRequests.length === 0) {
//             return res.status(200).json({ message: "No valid pending requests found." });
//         }

//         res.status(200).json(pendingRequests);
//     } catch (error) {
//         console.error("Error fetching pending requests:", error.message);
//         res.status(500).json({ error: "Failed to fetch pending requests." });
//     }
// };



// exports.getPendingRequests = async (req, res) => {
//     try {
//         const userId = req.user.id; // Extracted from the token (or hardcoded if testing)
//         const user = await User.findById(userId);

//         if (!user) {
//             return res.status(404).json({ error: "User not found" });
//         }

//         // Fetch details of the users in the friendRequests array
//         const pendingRequests = await User.find({ _id: { $in: user.friendRequests } }, "name email profilePicture"); // Fetch specific fields

//         return res.status(200).json(pendingRequests);
//     } catch (error) {
//         console.error("Error fetching pending requests:", error.message);
//         return res.status(500).json({ error: "Internal server error" });
//     }
// };

exports.getPendingRequests = async (req, res) => {
    const { userId } = req.params; // Get user ID from the route parameter
    const { token } = req.query;

    console.log("userID",userId)
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid user ID." });
    }

    try {
        const user = await User.findById(userId).populate("friendRequests", "name email profilePicture");

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

      return res.status(200).json(user.friendRequests);
} catch (error) {
        console.error("Error fetching friends:", error);
        res.status(500).json({ error: "Failed to fetch friends." });
    }
};




