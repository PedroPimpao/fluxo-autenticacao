import type { Request, Response } from 'express'
import type { UserService } from '../services/user-service.js'

export class UserController {
  constructor(private readonly userService: UserService) {}

  getAll = async (_req: Request, res: Response) => {
    const users = await this.userService.list()
    return res.status(200).json(users)
  }

  create = async (req: Request, res: Response) => {
    const { name, email, password } = req.body as {
      name: string
      email: string
      password: string
    }

    await this.userService.create({ name, email, password })
    return res.status(201).json({ message: 'Usuário criado com sucesso!' })
  }
}
