import express, { type Request, type Response } from 'express'
import { errorHandler } from './middlewares/error-handler.js'
import { router } from './routes.js'

export const app = express()

app.use(express.json())
app.use(router)

app.get('/', (_req: Request, res: Response) => {
  return res.json({ message: 'Hello, TypeScript!' })
})

app.use(errorHandler)
