import type { Request, Response } from 'express'
import type { TaskService } from '../services/task-service.js'

export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  list = async (req: Request, res: Response) => {
    const tasks = await this.taskService.list(req.userId)
    return res.status(200).json(tasks)
  }

  findById = async (req: Request, res: Response) => {
    const task = await this.taskService.findById(req.params.id as string, req.userId)
    return res.status(200).json(task)
  }

  create = async (req: Request, res: Response) => {
    const { title, description, status } = req.body as {
      title: string
      description: string
      status: string
    }
    const task = await this.taskService.create(
      { title, description, status },
      req.userId,
    )

    return res.status(201).json(task)
  }

  update = async (req: Request, res: Response) => {
    const { title, description, status } = req.body as {
      title: string
      description: string
      status: string
    }
    const task = await this.taskService.update(
      req.params.id as string,
      { title, description, status },
      req.userId,
    )

    return res.status(200).json(task)
  }

  delete = async (req: Request, res: Response) => {
    await this.taskService.delete(req.params.id as string, req.userId)
    return res.status(204).send()
  }
}
