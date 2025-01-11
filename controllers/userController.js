const User = require("../models/User");
const jwt=require('jsonwebtoken');
const dotenv=require('dotenv');
const mongoose=require('mongoose')
const bcrypt=require('bcrypt')
dotenv.config();

exports.getLogin=(req,res)=>{
res.render('login')
}

exports.postRegister=async(req,res)=>{
    const {name, email, password }=req.body;
    console.log("body",req.body)
    try {
        const userExists=await User.findOne({email});
        if(userExists){
            return res.status(400).send('Email already exists');
        }

        const newUSer=new User({name,email, password});
        await newUSer.save();

        res.redirect('/');
    } catch(err){
        console.error("error",err)
        res.status(500).send('Error')
    }
}

exports.postLogin=async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the user in the database
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send('User not found');
        }

        // Check if the password is correct
        const isPasswordValid = await user.comparePassword(password);
        console.log('password compare',isPasswordValid)
        if (!isPasswordValid) {
            return res.status(400).send('Invalid password');
        }
       

        // Generate a JWT token
        const token = jwt.sign({ id:user._id,email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        res.cookie('token', token, {
            // Prevent access via JavaScript
            secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
            maxAge: 3600000, // Token expires in 1 hour
            sameSite: 'Strict' // Restrict cross-origin requests
        });
        console.log("tpkem",token)
        // Example: In your controller
// res.render('dashboard', { user, token});

        // res.redirect('/dashboard?token=' + token); 
        res.redirect(`/friend/${user._id}?token=${token}`) // Pass token in query string
    } catch (err) {
        console.log(err)
        res.status(500).send('Error logging in user');
    }
}

exports.getRegister=(req,res)=>{
    res.render('register')
}

exports.getDashboard = async (req, res) => {
    const token = req.query.token;
    if (!token) {
        return res.status(403).send('Access denied');
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(403).send('Invalid token');
        }

        try {
            // Find the user using the username from the decoded token
            const user = await User.findOne({ email: decoded.email });

            if (!user) {
                return res.status(404).send('User not found');
            }

            // Pass the name to the EJS template
            res.render('friend', {user , friends: user.friends,userName: user.name, token});
        } catch (err) {
            console.error("Error fetching user:", err);
            res.status(500).send('Error retrieving user details');
        }
    });
};

exports.getUpdatePage = async (req, res) => {
    const userId = req.params.id;
    const token = req.query.token;

    // Validate userId before querying the database
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).send('Invalid user ID');
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.render('edit', { user, token });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Internal server error');
    }
};

// Controller to handle the update user details request
exports.updateUserDetails = async (req, res) => {
    const userId = req.params.id;
    const { name, email } = req.body;

    // Check if a new profile picture is uploaded
    const profilePicture = req.file ? `/uploads/${req.file.filename}` : null;
    console.log(req.file)
    try {
        // Prepare update data
        const updateData = { name, email };
        if (profilePicture) {
            updateData.profilePicture = profilePicture;
        }

        // Find user by ID and update
        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!user) {
            return res.status(404).send('User not found');
        }
        console.log('update user',user)

        // Generate a new token for updated data
        const token = jwt.sign({userId:user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Redirect to the dashboard with the updated token
        res.redirect('/dashboard?token=' + token);
    } catch (error) {
        console.error('Error updating user:', error);

        // Handle any validation or server errors
        res.status(500).send('Internal Server Error');
    }
};
exports.getForgetPwd=async (req,res)=>{
    res.render('forget-password')
}
exports.postForgetPwd=async(req,res)=>{
        const { email } = req.body;
    
        try {
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).send('User not found');
            }
    
            // Create a JWT token for password reset
            const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
            // Optionally store the token in the user document (optional)
            user.resetToken = resetToken;
            user.resetTokenExpiration = Date.now() + 3600000; // 1 hour from now
            await user.save();
    
            // Send the reset link to the user's email
            const resetLink = `http://localhost:5000/reset-password/${resetToken}`;
            console.log(`Password reset link: ${resetLink}`); // Replace with email logic
    
           res.render('password-reset-link')
        } catch (err) {
            console.error('Error:', err);
            res.status(500).send('Internal server error');
        }
    
     
}
exports.getPwdReset=async(req,res)=>{
    {
        const { token } = req.params;
        try {
            const user = await User.findOne({
                resetToken: token,
                resetTokenExpiration: { $gt: Date.now() }, // Ensure token is still valid
            });
    
            if (!user) {
                return res.status(400).send('Invalid or expired token');
            }
    
            res.render('reset-password', { userId: user._id, token }); // Render the reset password form
        } catch (err) {
            console.error('Error:', err);
            res.status(500).send('Internal server error');
        }
    }
    
}

// exports.postPwdReset=async (req, res) => {
//     const { password } = req.body;
//     const { token } = req.params;

//     try {
//         // Verify the reset token
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         const user = await User.findById(decoded.id);

//         if (!user || user.resetToken !== token || user.resetTokenExpiration < Date.now()) {
//             return res.status(400).send('Invalid or expired token');
//         }

//         // Hash the new password
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Save the hashed password
//         user.password = hashedPassword;
//         user.resetToken = undefined; // Clear the reset token
//         user.resetTokenExpiration = undefined;
//         await user.save();
//         console.log(password)
//         res.send('Password reset successfully');

//     } catch (err) {
//         console.error('Error:', err);
//         res.status(500).send('Internal server error');
//     }
// }
exports.postPwdReset = async (req, res) => {
    const { password } = req.body;
    const { token } = req.params;

    try {
        // Verify the reset token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || user.resetToken !== token || user.resetTokenExpiration < Date.now()) {
            return res.status(400).send('Invalid or expired token');
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("hash", hashedPassword);

        // Update the password and clear the reset token
        await User.updateOne(
            { _id: user._id },
            {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiration: null,
            }
        );

        console.log('Password reset successfully:', password);
        res.render('pwd-reset-success')
    } catch (err) {
        console.error('Error resetting password:', err);
        res.status(500).send('Internal server error');
    }
};

exports.searchUsers=async (req, res) => {
    try {
        const query = req.query.query; // Accessing search query from query string
        if (!query) {
            return res.status(400).json({ error: "Query parameter is missing." });
        }

        // Search for users whose name matches the query (case insensitive)
        const users = await User.find({
            name: { $regex: query, $options: 'i' }
        }).select('name profilePicture _id'); // Select only necessary fields

        if (users.length === 0) {
            return res.status(404).json({ message: "No users found." });
        }

        res.status(200).json(users);
    } catch (error) {
        console.error("Error while searching users:", error);
        res.status(500).json({ error: "An error occurred while searching users." });
    }
}




