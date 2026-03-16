import type { NextFunction, Request, Response } from 'express'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { SECRET } from '../app'

export const AuthMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { authorization } = req.headers

    if(!authorization){
        return res.status(401).json({ error: 'Token não fornecido' })
    }

    const [, token] = authorization.split(" ")
    const tokenValue = token as string

    try {
        const decoded = jwt.verify(tokenValue, SECRET)
        const { id } = decoded as JwtPayload
        req.userId = id   
        next()
    } catch (error) {
        return res.status(401).json({ error: "Token inválido" })
    }
}