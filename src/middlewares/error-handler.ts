import type { ErrorRequestHandler } from 'express'
import { AppError, type AppErrorCode } from '../errors/app-error.js'

const statusByErrorCode: Record<AppErrorCode, number> = {
  VALIDATION_ERROR: 400,
  USER_NOT_FOUND: 404,
  TASK_NOT_FOUND: 404,
  INVALID_CREDENTIALS: 401,
  EMAIL_ALREADY_EXISTS: 409,
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(statusByErrorCode[error.code]).json({ message: error.message })
    return
  }

  console.error(error)
  res.status(500).json({ message: 'Erro interno do servidor' })
}
