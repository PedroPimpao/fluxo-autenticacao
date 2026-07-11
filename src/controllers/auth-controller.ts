import type { Request, Response } from 'express'
import type { AuthService } from '../services/auth-service.js'

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (req: Request, res: Response) => {
    const { email, password } = req.body as { email: string; password: string }
    const result = await this.authService.login({ email, password })

    return res.status(200).json({
      message: 'Login realizado com sucesso!',
      ...result,
    })
  }
}
