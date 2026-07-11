import { compare } from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AppError } from '../errors/app-error.js'
import type { IUserRepository } from '../repositories/user-repository.js'
import type { PublicUser } from './user-service.js'

export interface LoginInput {
  email: string
  password: string
}

export interface LoginResult {
  user: PublicUser
  token: string
}

export class AuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtSecret: string,
  ) {}

  async login({ email, password }: LoginInput): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(email.trim().toLowerCase())

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'Usuário não encontrado')
    }

    const isValidPassword = await compare(password, user.hashPassword)

    if (!isValidPassword) {
      throw new AppError('INVALID_CREDENTIALS', 'Acesso negado')
    }

    const token = jwt.sign({ id: user.id }, this.jwtSecret, { expiresIn: '1d' })

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    }
  }
}
