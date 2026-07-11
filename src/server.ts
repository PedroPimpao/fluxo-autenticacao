import { app } from './app.js'
import { env } from './config/env.js'

app.listen(env.port, () => {
  const address = env.serverUrl ?? `http://localhost:${env.port}`
  console.log(`Servidor rodando em ${address}`)
})
