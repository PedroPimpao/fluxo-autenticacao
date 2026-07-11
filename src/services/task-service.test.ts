import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { AppError } from '../errors/app-error.js'
import type {
  CreateTaskData,
  ITaskRepository,
  TaskRecord,
  UpdateTaskData,
} from '../repositories/task-repository.js'
import { TaskService } from './task-service.js'

class InMemoryTaskRepository implements ITaskRepository {
  tasks: TaskRecord[] = []

  async findAllByUserId(userId: string) {
    return this.tasks.filter((task) => task.userId === userId)
  }

  async findByIdAndUserId(id: string, userId: string) {
    return this.tasks.find((task) => task.id === id && task.userId === userId) ?? null
  }

  async create(data: CreateTaskData) {
    const task = { id: crypto.randomUUID(), ...data }
    this.tasks.push(task)
    return task
  }

  async update(id: string, userId: string, data: UpdateTaskData) {
    const index = this.tasks.findIndex(
      (task) => task.id === id && task.userId === userId,
    )
    const currentTask = this.tasks[index]

    if (!currentTask) {
      throw new Error('Tarefa ausente no repository de teste')
    }

    const task = { ...currentTask, ...data }
    this.tasks[index] = task
    return task
  }

  async delete(id: string, userId: string) {
    this.tasks = this.tasks.filter(
      (task) => task.id !== id || task.userId !== userId,
    )
  }
}

const createTask = (overrides: Partial<TaskRecord> = {}): TaskRecord => ({
  id: crypto.randomUUID(),
  title: 'Tarefa',
  description: 'Descrição',
  status: 'pendente',
  userId: 'user-id',
  ...overrides,
})

describe('TaskService', () => {
  it('cria uma tarefa vinculada ao usuário autenticado', async () => {
    const repository = new InMemoryTaskRepository()
    const service = new TaskService(repository)

    const task = await service.create(
      {
        title: '  Estudar TypeScript  ',
        description: '  Revisar services  ',
        status: '  pendente  ',
      },
      'user-id',
    )

    assert.deepEqual(task, {
      id: repository.tasks[0]?.id,
      title: 'Estudar TypeScript',
      description: 'Revisar services',
      status: 'pendente',
      userId: 'user-id',
    })
  })

  it('lista somente as tarefas do usuário autenticado', async () => {
    const repository = new InMemoryTaskRepository()
    const ownTask = createTask()
    repository.tasks.push(ownTask, createTask({ userId: 'other-user' }))

    const tasks = await new TaskService(repository).list('user-id')

    assert.deepEqual(tasks, [ownTask])
  })

  it('consulta uma tarefa pertencente ao usuário', async () => {
    const repository = new InMemoryTaskRepository()
    const task = createTask()
    repository.tasks.push(task)

    const result = await new TaskService(repository).findById(task.id, 'user-id')

    assert.deepEqual(result, task)
  })

  it('atualiza uma tarefa pertencente ao usuário', async () => {
    const repository = new InMemoryTaskRepository()
    const task = createTask()
    repository.tasks.push(task)

    const result = await new TaskService(repository).update(
      task.id,
      {
        title: 'Tarefa atualizada',
        description: 'Nova descrição',
        status: 'concluída',
      },
      'user-id',
    )

    assert.equal(result.title, 'Tarefa atualizada')
    assert.equal(result.description, 'Nova descrição')
    assert.equal(result.status, 'concluída')
  })

  it('exclui uma tarefa pertencente ao usuário', async () => {
    const repository = new InMemoryTaskRepository()
    const task = createTask()
    repository.tasks.push(task)

    await new TaskService(repository).delete(task.id, 'user-id')

    assert.deepEqual(repository.tasks, [])
  })

  it('trata tarefas de outro usuário como inexistentes', async () => {
    const repository = new InMemoryTaskRepository()
    const task = createTask({ userId: 'other-user' })
    repository.tasks.push(task)
    const service = new TaskService(repository)

    await assert.rejects(
      service.findById(task.id, 'user-id'),
      (error: unknown) =>
        error instanceof AppError &&
        error.code === 'TASK_NOT_FOUND' &&
        error.message === 'Tarefa não encontrada',
    )

    await assert.rejects(
      service.update(
        task.id,
        { title: 'Inválida', description: 'Inválida', status: 'concluída' },
        'user-id',
      ),
      (error: unknown) =>
        error instanceof AppError && error.code === 'TASK_NOT_FOUND',
    )

    await assert.rejects(
      service.delete(task.id, 'user-id'),
      (error: unknown) =>
        error instanceof AppError && error.code === 'TASK_NOT_FOUND',
    )
    assert.deepEqual(repository.tasks, [task])
  })
})
