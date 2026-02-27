import express from "express"
import{toNodeHandler} from "better-auth/node"
import {auth} from "@/utils/auth"

const authRouter = express.Router();

authRouter.all("/*", toNodeHandler(auth));

export {authRouter};