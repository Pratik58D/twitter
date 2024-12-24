import Notification from "../models/notfication.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";

export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let { img } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!text && !img) {
      return res.status(400).json({ message: "Text or image is required" });
    }
    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img, {
        upload_preset: "social-media",
      });
      img = uploadedResponse.secure_url;
    }

    const newPost = new Post({
      user: userId,
      text,
      img,
    });
    await newPost.save();
    res.status(201).json({ message: "Post created successfully", newPost });
  } catch (error) {
    console.error("error in createpost controller", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.user.toString() !== userId.toString()) {
      return res
        .status(401)
        .json({ message: "You are not authorized to delete this post" });
    }
    if (post.img) {
      //  https://res.cloudinary.com/<cloud_name>/image/upload/v1234567890/<folder>/<image_id>.jpg

      const imgId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }
    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log("error in deletePost controller", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const unlikeLikePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    //if user id is already included in likes array that means user has already liked the post
    const isLiked = post.likes.includes(userId);
    if (isLiked) {
      //we unlike the post
      // first argument is the filter criteria, and the second is the update operation.
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
      await User.updateOne({_id : userId},{$pull  : {likedPosts : postId}});
      res.status(200).json({ message: "Post unliked successfully" });
    } else {
      //we like the post
      post.likes.push(userId);
      await User.updateOne({_id : userId},{$push : {likedPosts: postId}})
      await post.save();
      //if liked then create a notification
      const notification = new Notification({
        from: userId,
        to: post.user,
        type: "like",
      });
      await notification.save();
      const updatedlikes = post.likes.length;
      res
        .status(200)
        .json({ message: "Post liked successfully", updatedlikes });
    }
  } catch (error) {
    console.log("error in unlikeLikePost controller", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const commentPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user._id;
    if (!text) {
      return res.status(400).json({ message: "Text is required" });
    }
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const newComment = {
      text,
      user: userId,
    };
    post.comments.push(newComment);
    await post.save();
    //create a new notification for the post owner
    const notification = new Notification({
      from: userId,
      to: post.user,
      type: "comment",
    });
    await notification.save();
    // Send a response back to the client
    res.status(200).json({ message: "Comment added successfully", post });
  } catch (error) {
    console.log("error in commentPost controller", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

//for twitter for you section functionality
export const getAllPosts = async (req, res) => {
  try {
    //sort the posts in descending order of createdAt latest first with deselecting the password field
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      //also populate the comments array with user details except password
    //we are doing all of this  because we want to show the user details who created the post and who commented on the post
      .populate({
        path: "comments.user",
        select: "-password",
      });
    if (posts.length === 0) {
      return res.status(200).json([]);
    }
    res.status(200).json({ posts });
  } catch (error) {
    console.log("error in getAllPosts controller", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

//for twitter all user-liked posts functionality
export const getlikedPosts = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({message : "User not found"});
        }
        // $in operator selects the documents where the value of a field equals any value in the specified array.
        const likedPosts = await Post.find({_id :{$in : user.likedPosts}})   
        .populate({
            path : "user",
            select : "-password"
        })
        .populate({
            path : "comments.user",
            select : "-password"
        });

        res.status(200).json({likedPosts});
        
    } catch (error) {
        console.log("error in getlikedPosts controller", error.message);
        res
          .status(500)
          .json({ message: "Internal server error", error: error.message });
        
    }
}

//for twitter following section posts functionality
export const getFollowingPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    
  } catch (error) {
    console.log("error in getFollowingPosts controller", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
    
  }
}