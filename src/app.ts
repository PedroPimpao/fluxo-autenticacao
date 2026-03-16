import express from 'express'
import 'dotenv/config'
import type { IHttp } from './types/http-type.js'
import { router } from './routes.js'

const app = express()
const PORT = process.env.PORT
const URL = process.env.URL
export const SECRET = process.env.SECRET as string


app.use(express.json())
app.use(router)

app.get('/', ({ req, res }: IHttp) => {
  return res.json({ message: 'Hello, TypeScript!' })
})

app.listen(PORT, () => {
  console.log(`Servidor rodando em ${URL}`)
})