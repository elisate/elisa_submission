import express from "express"
import { Router } from "express"

import userRouter from "./userRoutes.js";

const mainRouter=Router();
mainRouter.use("/user",userRouter)

export default mainRouter;