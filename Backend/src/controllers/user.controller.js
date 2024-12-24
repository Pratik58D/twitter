import User from "../models/user.model.js";
import Notification from "../models/notfication.model.js";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

export const getUserProfile = async (req, res) => {
  try {
    const { username: userName } = req.params;
    const user = await User.findOne({ userName }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("error in getUserProfile", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// export const getSuggestedUsers = async (req, res) => {
//   try {
//     const currentUserId = req.user._id;

//     // Fetch the current user to get the list of users they follow
//     const usersFollowedByMe = await User.findById(currentUserId).select("following");
//     const followedByMe = usersFollowedByMe.following.map((id) => id.toString()); // Convert ObjectIds to strings
//
//   //Fetch All Users Except the Current User
//     const users = await User.aggregate([
//       {
//         $match : {
//           _id : { $ne : currentUserId},  // Exclude the current user(not equal)
//         },
//       },
//       { $sample : { size : 10}},   // Randomly sample 10 users
//     ]);

//       //Filter Out Users Already Followed by the Current User
//     const filteredUsers = users.filter((user) => !usersFollowedByMe.following.includes(user._id.tostring()));

//     const suggestedUsers = filteredUsers.slice(0,4);
//     suggestedUsers.forEach((user)=> (user.password = null));

//     res.status(200).json(suggestedUsers);

//   } catch (error) {
//     console.error("error in getSuggestedUsers", error.message);
//     res.status(500).json({ message: "Internal server error" });

//   }
// };

//more optimized way to get suggested users

export const getSuggestedUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Fetch the current user to get the list of users they follow
    const currentUser = await User.findById(currentUserId).select("following");

    // Use aggregation to fetch suggested users in a single step
    const suggestedUsers = await User.aggregate([
      {
        $match: {
          _id: { $ne: currentUserId }, // Exclude the current user(not equal)
          _id: { $nin: currentUser.following }, // Exclude already followed users(not in)
        },
      },
      { $sample: { size: 4 } }, // Randomly sample 4 users directly
      {
        $project: {
          password: 0, // Exclude the password field
        },
      },
    ]);

    res.status(200).json(suggestedUsers);
  } catch (error) {
    console.error("Error in getSuggestedUsers:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userToFollow = await User.findById(id);
    if (!userToFollow) {
      return res.status(404).json({ message: "User not found" });
    }
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    //checks whether a specific user (id) is present in the following array of the currentUse
    const isFollowing = currentUser.following.includes(id);
    if (isFollowing) {
      //unfollow
      //removes the current user from the followers array of the user identified by id and vice versa
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
      res.status(200).json({ message: "User unfollowed successfully" });
    } else {
      //follow the user
      //adds the current user as a follower of the user identified by id and vice versa
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });

      //Send notification to the user
      const newNotification = new Notification({
        type: "follow",
        from: req.user._id,
        to: userToFollow._id,
      });
      await newNotification.save();

      res.status(200).json({ message: "User followed successfully" });
    }
  } catch (error) {
    console.error("error in followUnfollowUsers", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const {
      fullName,
      userName,
      email,
      currentPassword,
      newPassword,
      bio,
      link,
    } = req.body;
    let { profileImg, coverImg } = req.body;
    const userId = req.user._id;
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (
      (!newPassword && currentPassword) ||
      (!currentPassword && newPassword)
    ) {
      return res
        .status(400)
        .json({ message: "Please provide both current and new password" });
    }

    if (currentPassword && newPassword) {
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isPasswordValid) {
        return res
          .status(400)
          .json({ message: "current password doesnot matched" });
      }
      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ message: "Password must be atleast 6 characters long" });
      }
      if (currentPassword === newPassword) {
        return res
          .status(400)
          .json({ message: "New password cannot be same as current password" });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    if (profileImg) {
      if (user.profileImg) {
        //https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/image.png
        await cloudinary.uploader.destroy(
          user.profileImg.split("/").pop().split(".")[0]
        );
      }
      const uploadResponse = await cloudinary.uploader.upload(profileImg);
      profileImg = uploadResponse.secure_url;
    }
    if (coverImg) {
      if (user.coverImg) {
        await cloudinary.uploader.destroy(
          user.coverImg.split("/").pop().split(".")[0]
        );
      }
      const uploadResponse = await cloudinary.uploader.upload(coverImg);
      coverImg = uploadResponse.secure_url;
    }
    user.fullName = fullName || user.fullName;
    user.userName = userName || user.userName;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;

    user = await user.save();
    user.password = null;

    return res.status(200).json(user);
  } catch (error) {
    console.error("error in updateUserProfile", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
