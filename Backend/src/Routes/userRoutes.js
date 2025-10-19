import express from "express";
import {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
  exportUsersProto,
} from "../controllers/userController.js";

const userRouter = express();

userRouter.post("/createUser",createUser);
userRouter.get("/ getUsers", getUsers);
userRouter.put("/updateUserById/:id", updateUser);
userRouter.delete("/deleteUserById/:id", deleteUser);
userRouter.get("/exportUsersProto/export", exportUsersProto);

export default userRouter;
