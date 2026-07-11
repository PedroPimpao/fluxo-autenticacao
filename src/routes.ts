import { Router } from 'express'
import { env } from './config/env.js'
import { AuthController } from './controllers/auth-controller.js'
import { UserController } from './controllers/user-controller.js'
import { authMiddleware } from './middlewares/auth.js'
import { validateCreateUser, validateLogin } from './middlewares/validate-request.js'
import { UserRepository } from './repositories/user-repository.js'
import { AuthService } from './services/auth-service.js'
import { UserService } from './services/user-service.js'

export const router = Router()

const userRepository = new UserRepository()
const userService = new UserService(userRepository)
const authService = new AuthService(userRepository, env.jwtSecret)
const userController = new UserController(userService)
const authController = new AuthController(authService)

router.get('/users', authMiddleware, userController.getAll)
router.post('/users', validateCreateUser, userController.create)
router.post('/auth', validateLogin, authController.login)
