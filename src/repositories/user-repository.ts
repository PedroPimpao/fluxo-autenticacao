// Repositório conversa com o DB
import { hash } from "bcryptjs";
import { db } from "../utils/prisma";

interface ICreateUser {
    name: string
    email: string
    password: string
}

export class UserRepository {
    async getUsers(){
        return await db.user.findMany({})
    }

    async createUser({ name, email, password }: ICreateUser){
        const hashPassword = await hash(password, 12)
        await db.user.create({
            data: {
                name: name,
                email: email,
                hashPassword: hashPassword
            }
        })
    }
}