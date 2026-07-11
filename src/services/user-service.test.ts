import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { compare } from 'bcryptjs'
import { AppError } from '../errors/app-error.js'
import type {
  CreateUserData,
  IUserRepository,
  UserRecord,
} from '../repositories/user-repository.js'
import { UserService } from './user-service.js'

class InMemoryUserRepository implements IUserRepository {
  users: UserRecord[] = []

  async findAll() {
    return this.users
  }

  async findByEmail(email: string) {
    return this.users.find((user) => user.email === email) ?? null
  }

  async findById(id: string) {
    return this.users.find((user) => user.id === id) ?? null
  }

  async create(data: CreateUserData) {
    const user = { id: crypto.randomUUID(), ...data }
    this.users.push(user)
    return user
  }
}

describe('UserService', () => {
  it('cria um usuário com senha protegida e e-mail normalizado', async () => {
    const repository = new InMemoryUserRepository()
    const service = new UserService(repository)

    const user = await service.create({
      name: '  Pedro  ',
      email: 'PEDRO@EXEMPLO.COM',
      password: 'senha-segura',
    })

    assert.deepEqual(user, {
      id: repository.users[0]?.id,
      name: 'Pedro',
      email: 'pedro@exemplo.com',
    })
    assert.equal(await compare('senha-segura', repository.users[0]!.hashPassword), true)
    assert.equal('hashPassword' in user, false)
  })

  it('impede o cadastro de um e-mail já utilizado', async () => {
    const repository = new InMemoryUserRepository()
    const service = new UserService(repository)

    await service.create({
      name: 'Pedro',
      email: 'pedro@exemplo.com',
      password: 'senha-segura',
    })

    await assert.rejects(
      service.create({
        name: 'Outro Pedro',
        email: 'PEDRO@EXEMPLO.COM',
        password: 'outra-senha',
      }),
      (error: unknown) =>
        error instanceof AppError &&
        error.code === 'EMAIL_ALREADY_EXISTS' &&
        error.message === 'E-mail já cadastrado',
    )
  })

  it('lista usuários sem expor hashes de senha', async () => {
    const repository = new InMemoryUserRepository()
    repository.users.push({
      id: 'user-id',
      name: 'Pedro',
      email: 'pedro@exemplo.com',
      hashPassword: 'hash-confidencial',
    })

    const users = await new UserService(repository).list()

    assert.deepEqual(users, [
      { id: 'user-id', name: 'Pedro', email: 'pedro@exemplo.com' },
    ])
    assert.equal('hashPassword' in users[0]!, false)
  })
})
