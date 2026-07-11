import { db } from '../utils/prisma.js'

export interface TaskRecord {
  id: string
  title: string
  description: string
  status: string
  userId: string
}

export interface CreateTaskData {
  title: string
  description: string
  status: string
  userId: string
}

export interface UpdateTaskData {
  title: string
  description: string
  status: string
}

export interface ITaskRepository {
  findAllByUserId(userId: string): Promise<TaskRecord[]>
  findByIdAndUserId(id: string, userId: string): Promise<TaskRecord | null>
  create(data: CreateTaskData): Promise<TaskRecord>
  update(id: string, userId: string, data: UpdateTaskData): Promise<TaskRecord>
  delete(id: string, userId: string): Promise<void>
}

export class TaskRepository implements ITaskRepository {
  findAllByUserId(userId: string) {
    return db.tarefa.findMany({ where: { userId } })
  }

  findByIdAndUserId(id: string, userId: string) {
    return db.tarefa.findFirst({ where: { id, userId } })
  }

  create(data: CreateTaskData) {
    return db.tarefa.create({ data })
  }

  update(id: string, userId: string, data: UpdateTaskData) {
    return db.tarefa.update({ where: { id, userId }, data })
  }

  async delete(id: string, userId: string) {
    await db.tarefa.delete({ where: { id, userId } })
  }
}
