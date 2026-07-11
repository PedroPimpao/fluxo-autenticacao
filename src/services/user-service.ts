import { hash } from 'bcryptjs'
import { AppError } from '../errors/app-error.js'
import type { IUserRepository, UserRecord } from '../repositories/user-repository.js'

export interface CreateUserInput {
  name: string
  email: string
  password: string
}

export interface PublicUser {
  id: string
  name: string
  email: string
}

const toPublicUser = ({ id, name, email }: UserRecord): PublicUser => ({
  id,
  name,
  email,
})

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async list() {
    const users = await this.userRepository.findAll()
    return users.map(toPublicUser)
  }

  async create({ name, email, password }: CreateUserInput) {
    const normalizedName = name.trim()
    const normalizedEmail = email.trim().toLowerCase()
    const existingUser = await this.userRepository.findByEmail(normalizedEmail)

    if (existingUser) {
      throw new AppError('EMAIL_ALREADY_EXISTS', 'E-mail já cadastrado')
    }

    const hashPassword = await hash(password, 12)

    const user = await this.userRepository.create({
      name: normalizedName,
      email: normalizedEmail,
      hashPassword,
    })

    return toPublicUser(user)
  }
}
