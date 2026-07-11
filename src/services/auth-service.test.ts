import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { hash } from 'bcryptjs'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { AppError } from '../errors/app-error.js'
import type {
  CreateUserData,
  IUserRepository,
  UserRecord,
} from '../repositories/user-repository.js'
import { AuthService } from './auth-service.js'

class AuthUserRepository implements IUserRepository {
  constructor(private readonly user: UserRecord | null) {}

  async findAll() {
    return this.user ? [this.user] : []
  }

  async findByEmail(email: string) {
    return this.user?.email === email ? this.user : null
  }

  async findById(id: string) {
    return this.user?.id === id ? this.user : null
  }

  async create(data: CreateUserData) {
    return { id: 'created-user', ...data }
  }
}

describe('AuthService', () => {
  it('autentica e devolve um usuário seguro com JWT', async () => {
    const jwtSecret = 'segredo-de-teste'
    const repository = new AuthUserRepository({
      id: 'user-id',
      name: 'Pedro',
      email: 'pedro@exemplo.com',
      hashPassword: await hash('senha-segura', 4),
    })
    const service = new AuthService(repository, jwtSecret)

    const result = await service.login({
      email: 'PEDRO@EXEMPLO.COM',
      password: 'senha-segura',
    })

    assert.deepEqual(result.user, {
      id: 'user-id',
      name: 'Pedro',
      email: 'pedro@exemplo.com',
    })
    assert.equal('hashPassword' in result.user, false)

    const payload = jwt.verify(result.token, jwtSecret) as JwtPayload
    assert.equal(payload.id, 'user-id')
  })

  it('rejeita um usuário inexistente', async () => {
    const service = new AuthService(new AuthUserRepository(null), 'segredo-de-teste')

    await assert.rejects(
      service.login({ email: 'ausente@exemplo.com', password: 'senha' }),
      (error: unknown) =>
        error instanceof AppError &&
        error.code === 'USER_NOT_FOUND' &&
        error.message === 'Usuário não encontrado',
    )
  })

  it('rejeita uma senha inválida', async () => {
    const repository = new AuthUserRepository({
      id: 'user-id',
      name: 'Pedro',
      email: 'pedro@exemplo.com',
      hashPassword: await hash('senha-correta', 4),
    })
    const service = new AuthService(repository, 'segredo-de-teste')

    await assert.rejects(
      service.login({ email: 'pedro@exemplo.com', password: 'senha-incorreta' }),
      (error: unknown) =>
        error instanceof AppError &&
        error.code === 'INVALID_CREDENTIALS' &&
        error.message === 'Acesso negado',
    )
  })
})
