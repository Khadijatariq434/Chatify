const Chat = require("../models/Chat");
const mongoose = require("mongoose");
const User = require("../models/User");

// Controller to send a message

exports.sendMessage = async (req, res) => {
  const { receiverId, message } = req.body;
  const senderId = req.user.id; // Assuming user is authenticated and user ID is stored in JWT token

  if (!receiverId || !message) {
    return res
      .status(400)
      .json({ message: "Receiver and message are required" });
  }

  try {
    const newMessage = new Chat({
      sender: senderId,
      receiver: receiverId,
      message: message,
    });

    await newMessage.save();
    console.log("Message saved:", newMessage);

    
    // Send a JSON response with a success message and message details
    res.status(200).json({
      status: "success",
      message: "Message sent successfully",
      data: newMessage, // Optionally, you can include the message data here
    });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Controller to get messages between two users
// exports.getMessages = async (req, res) => {
//     const {currentUserId, friendId}=req.body
//     console.log('req.parama',req.params)
// // const userId=req.params.userId;
// // const friendId=req.params.friendId;
// // const currentUserId = req.user.id;

//     const {token} = req.query; // Extract token from query parameters
//     // const receiverId = '6773b882b3c2dd227140ef52';
//     if (!token) {
//         return res.status(401).send('Unauthorized: Token is required');
//     }

//     console.log('user Id',userId);
//     console.log('receiver Id',friendId)
//     console.log('token heychat',token)

//     try {
//         console.log('iserid',currentUserId)// Ensure this is populated correctly
//         const messages = await Chat.find({
//             $or: [
//                 { sender: currentUserId, receiver: userId },
//                 { sender: userId, receiver: currentUserId },
//             ],
//         }).sort({ timestamp: 1 });

//         res.render('chat', { messages,  token, friendId, currentUserId});
//         // res.json({ messages, token , friendId, currentUserId});
//     } catch (err) {
//         console.error('Error fetching messages:', err);
//         res.status(500).send('Internal server error');
//     }
// };
exports.getMessages = async (req, res) => {
  const { friendId } = req.params;
  const { token } = req.query; // Extract token from query parameters
  const user = await User.findById(req.user.id);
  const currentUserId = req.user.id;
  if (!token) {
    return res.status(401).send("Unauthorized: Token is required");
  }

  console.log("Current User ID:", currentUserId);
  console.log("Friend ID:", friendId);
  console.log("Token:", token);

  try {
    const messages = await Chat.find({
      $or: [
        { sender: currentUserId, receiver: friendId },
        { sender: friendId, receiver: currentUserId },
      ],
    }).sort({ timestamp: 1 });
    const friend = await User.findById(friendId).populate("friends", "name email profilePicture");
    if (!user) {
      return res.status(404).send("Friend not found");
    }

    await User.updateOne(
      { _id: currentUserId },
      { $set: { hasNewMessages: false } }
    );
    // Render EJS template with messages or send JSON response
    res.render("chat", {
      messages,
      token,
      friendName: friend.name,
      friendProfilePicture:friend.profilePicture,
      friendId:friend._id,
      currentUserId,
      user,
    });
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).send("Internal server error");
  }
};

// Controller to get messages as JSON
const jwt = require("jsonwebtoken"); // Import the User model

exports.getMessagesJson = async (req, res) => {
  const { friendId } = req.params;
  const { token } = req.query; // Extract token from query parameters

  if (!token) {
    return res.status(401).send("Unauthorized: Token is required");
  }

  try {
    // Decode the token to get the currentUserId
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    if (!decodedToken || !decodedToken.id) {
      return res.status(401).send("Unauthorized: Invalid token");
    }

    const currentUserId = decodedToken.id;  // Get the current user's ID from the token

    console.log("Current User ID:", currentUserId);
    console.log("Friend ID:", friendId);
    console.log("Token:", token);

    const messages = await Chat.find({
      $or: [
        { sender: currentUserId, receiver: friendId },
        { sender: friendId, receiver: currentUserId },
      ],
    }).sort({ timestamp: 1 });

    const user = await User.findById(friendId).populate("friends", "name email profilePicture");

    if (!user) {
      return res.status(404).send("Friend not found");
    }

    await User.updateOne(
      { _id: currentUserId },
      { $set: { hasNewMessages: false } }
    );
    // Send JSON response with messages
    res.status(200).json({ messages });

  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).send("Internal server error");
  }
};

exports.getFriendsWithNewMessages = async (req, res) => {
  const currentUserId = req.user.id;
  
  try {
    // Get all friends and check for unread messages for each friend
    const friends = await User.find({ _id: { $ne: currentUserId } });

    const friendsWithNewMessages = await Promise.all(friends.map(async (friend) => {
      const unreadMessages = await Chat.find({
        sender: friend._id,
        receiver: currentUserId,
        isRead: false, // Check for unread messages
      });

      friend.hasNewMessages = unreadMessages.length > 0; // Set the flag based on unread messages
      return friend;
    }));

    res.status(200).json(friendsWithNewMessages);
  } catch (err) {
    console.error("Error fetching friends with new messages:", err);
    res.status(500).send("Internal server error");
  }
};


