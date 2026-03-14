import express from 'express'
import type { Request, Response } from 'express'
import 'dotenv/config'

const app = express()
const PORT = process.env.PORT

app.use(express.json())

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello, TypeScript!' })
})

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})