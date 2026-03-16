// Controller conversa com as requisições http
import { UserRepository } from "../repositories/user-repository";
import type { IHttp } from "../types/http-type";
import type { Request, Response } from 'express'

const userRepository = new UserRepository()

export class UserController {
    async getAll(req: Request, res: Response){
        const users = await userRepository.getUsers()
        return res.status(200).json(users)
    }

    async create(req: Request, res: Response){
        const { name, email, password } = req.body
        await userRepository.createUser({ name, email, password })
        return res.status(201).json({ message: 'Usuário criado com sucesso!' })
    }
}