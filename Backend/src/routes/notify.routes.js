import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";

import { deleteNotification, deleteOneNotification, getNotification } from "../controllers/notification.controller.js";

const notifyRoutes = express.Router();

notifyRoutes.get("/",protectRoute, getNotification); 
notifyRoutes.delete("/",protectRoute, deleteNotification);
notifyRoutes.delete("/:id",protectRoute, deleteOneNotification);



export default notifyRoutes;