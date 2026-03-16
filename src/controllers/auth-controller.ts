import type { Request, Response } from 'express'
import { db } from '../utils/prisma'
import { compare } from 'bcryptjs'
import jwt from 'jsonwebtoken'
import 'dotenv/config'
import { SECRET } from '../app'

// const authRepository = new AuthRepository()

export class AuthController {
    async login(req: Request, res: Response){
        const { email, password } = req.body

        const user = await db.user.findUnique({
            where:{
                email
            }
        })

        if(!user){
            return res.status(404).json({ message: 'Usuário não encontrado' })
        }

        const isValidPassword = await compare(password, user.hashPassword)

        if(!isValidPassword){
            return res.status(401).json({ message: 'Acesso negado' })
        }

        const token = jwt.sign({id: user.id}, SECRET, {expiresIn: '1d'})

        return res.status(200).json({ message: 'Login realizado com sucesso!', user, token })
    }
}