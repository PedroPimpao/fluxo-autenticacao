import { Router } from 'express'
import { env } from './config/env.js'
import { AuthController } from './controllers/auth-controller.js'
import { TaskController } from './controllers/task-controller.js'
import { UserController } from './controllers/user-controller.js'
import { authMiddleware } from './middlewares/auth.js'
import {
  validateCreateUser,
  validateLogin,
  validateTask,
  validateTaskId,
} from './middlewares/validate-request.js'
import { TaskRepository } from './repositories/task-repository.js'
import { UserRepository } from './repositories/user-repository.js'
import { AuthService } from './services/auth-service.js'
import { TaskService } from './services/task-service.js'
import { UserService } from './services/user-service.js'

export const router = Router()

const userRepository = new UserRepository()
const taskRepository = new TaskRepository()
const userService = new UserService(userRepository)
const authService = new AuthService(userRepository, env.jwtSecret)
const taskService = new TaskService(taskRepository)
const userController = new UserController(userService)
const authController = new AuthController(authService)
const taskController = new TaskController(taskService)

router.get('/users', authMiddleware, userController.getAll)
router.post('/users', validateCreateUser, userController.create)
router.post('/auth', validateLogin, authController.login)

router.use('/tasks', authMiddleware)
router.get('/tasks', taskController.list)
router.post('/tasks', validateTask, taskController.create)
router.get('/tasks/:id', validateTaskId, taskController.findById)
router.put('/tasks/:id', validateTaskId, validateTask, taskController.update)
router.delete('/tasks/:id', validateTaskId, taskController.delete)
