import 'dotenv/config'

const getRequiredEnv = (name: 'DATABASE_URL' | 'SECRET') => {
  const value = process.env[name]

  if (!value) {
    throw new Error(`A variável de ambiente ${name} não foi definida`)
  }

  return value
}

const parsePort = (value: string | undefined) => {
  if (!value) {
    return 3000
  }

  const port = Number(value)

  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error('A variável de ambiente PORT deve ser uma porta válida')
  }

  return port
}

export const env = {
  databaseUrl: getRequiredEnv('DATABASE_URL'),
  jwtSecret: getRequiredEnv('SECRET'),
  port: parsePort(process.env.PORT),
  serverUrl: process.env.URL,
}
