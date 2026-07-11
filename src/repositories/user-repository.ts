import { db } from '../utils/prisma.js'

export interface UserRecord {
  id: string
  name: string
  email: string
  hashPassword: string
}

export interface CreateUserData {
  name: string
  email: string
  hashPassword: string
}

export interface IUserRepository {
  findAll(): Promise<UserRecord[]>
  findByEmail(email: string): Promise<UserRecord | null>
  findById(id: string): Promise<UserRecord | null>
  create(data: CreateUserData): Promise<UserRecord>
}

export class UserRepository implements IUserRepository {
  findAll() {
    return db.user.findMany()
  }

  findByEmail(email: string) {
    return db.user.findUnique({ where: { email } })
  }

  findById(id: string) {
    return db.user.findUnique({ where: { id } })
  }

  create(data: CreateUserData) {
    return db.user.create({ data })
  }
}
