import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { commentPost, createPost, deletePost, getAllPosts, getlikedPosts, unlikeLikePost } from "../controllers/post.controller.js";

const postRoutes = express.Router();

postRoutes.get("/",protectRoute,getAllPosts);
postRoutes.get("/following",protectRoute,getFollowingPosts);
postRoutes.get("/user/:id",protectRoute, getlikedPosts);
postRoutes.post("/create",protectRoute,createPost);
postRoutes.delete("/delete/:id",protectRoute,deletePost);
postRoutes.post("/like/:id",protectRoute,unlikeLikePost);
postRoutes.post("/comment/:id",protectRoute,commentPost);

export default postRoutes;