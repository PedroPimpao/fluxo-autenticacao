import { Router } from "express";
import { UserController } from "./controllers/user-controller";
import { AuthController } from "./controllers/auth-controller";
import { AuthMiddleware } from "./middlewares/auth";

export const router = Router()

const userController = new UserController()
const authController = new AuthController()

router.get('/users', AuthMiddleware, userController.getAll)
router.post('/users', userController.create)
router.post('/auth', authController.login)