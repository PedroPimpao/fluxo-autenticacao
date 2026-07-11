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
