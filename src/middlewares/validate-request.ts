import type { RequestHandler } from 'express'
import { AppError } from '../errors/app-error.js'

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const isEmail = (value: unknown): value is string =>
  isNonEmptyString(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export const validateCreateUser: RequestHandler = (req, _res, next) => {
  const { name, email, password } = req.body as Record<string, unknown>

  if (!isNonEmptyString(name)) {
    next(new AppError('VALIDATION_ERROR', 'Nome é obrigatório'))
    return
  }

  if (!isEmail(email)) {
    next(new AppError('VALIDATION_ERROR', 'E-mail inválido'))
    return
  }

  if (!isNonEmptyString(password)) {
    next(new AppError('VALIDATION_ERROR', 'Senha é obrigatória'))
    return
  }

  next()
}

export const validateLogin: RequestHandler = (req, _res, next) => {
  const { email, password } = req.body as Record<string, unknown>

  if (!isEmail(email)) {
    next(new AppError('VALIDATION_ERROR', 'E-mail inválido'))
    return
  }

  if (!isNonEmptyString(password)) {
    next(new AppError('VALIDATION_ERROR', 'Senha é obrigatória'))
    return
  }

  next()
}

export const validateTask: RequestHandler = (req, _res, next) => {
  const { title, description, status } = req.body as Record<string, unknown>

  if (!isNonEmptyString(title)) {
    next(new AppError('VALIDATION_ERROR', 'Título é obrigatório'))
    return
  }

  if (!isNonEmptyString(description)) {
    next(new AppError('VALIDATION_ERROR', 'Descrição é obrigatória'))
    return
  }

  if (!isNonEmptyString(status)) {
    next(new AppError('VALIDATION_ERROR', 'Status é obrigatório'))
    return
  }

  next()
}

export const validateTaskId: RequestHandler = (req, _res, next) => {
  const id = req.params.id
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  if (typeof id !== 'string' || !uuidPattern.test(id)) {
    next(new AppError('VALIDATION_ERROR', 'Identificador de tarefa inválido'))
    return
  }

  next()
}
