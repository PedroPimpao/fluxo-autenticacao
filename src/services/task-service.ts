import { AppError } from '../errors/app-error.js'
import type {
  ITaskRepository,
  TaskRecord,
  UpdateTaskData,
} from '../repositories/task-repository.js'

export interface TaskInput {
  title: string
  description: string
  status: string
}

export type Task = TaskRecord

export class TaskService {
  constructor(private readonly taskRepository: ITaskRepository) {}

  list(userId: string) {
    return this.taskRepository.findAllByUserId(userId)
  }

  async findById(id: string, userId: string) {
    return this.getOwnedTask(id, userId)
  }

  create(input: TaskInput, userId: string) {
    return this.taskRepository.create({
      ...this.normalize(input),
      userId,
    })
  }

  async update(id: string, input: TaskInput, userId: string) {
    await this.getOwnedTask(id, userId)
    return this.taskRepository.update(id, userId, this.normalize(input))
  }

  async delete(id: string, userId: string) {
    await this.getOwnedTask(id, userId)
    await this.taskRepository.delete(id, userId)
  }

  private async getOwnedTask(id: string, userId: string) {
    const task = await this.taskRepository.findByIdAndUserId(id, userId)

    if (!task) {
      throw new AppError('TASK_NOT_FOUND', 'Tarefa não encontrada')
    }

    return task
  }

  private normalize({ title, description, status }: TaskInput): UpdateTaskData {
    return {
      title: title.trim(),
      description: description.trim(),
      status: status.trim(),
    }
  }
}
