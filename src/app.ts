import express from 'express'
import 'dotenv/config'
import type { IHttp } from './types/http-type.js'

const app = express()
const PORT = process.env.PORT

app.use(express.json())

app.get('/', ({ req, res }: IHttp) => {
  res.json({ message: 'Hello, TypeScript!' })
})

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})