import type { NextFunction, Request, Response } from 'express'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { env } from '../config/env.js'

export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authorization = req.headers.authorization

    if (!authorization) {
        return res.status(401).json({ error: 'Token não fornecido' })
    }

    const [scheme, token] = authorization.split(' ')

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Token inválido' })
    }

    try {
        const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload

        if (typeof decoded.id !== 'string') {
            return res.status(401).json({ error: 'Token inválido' })
        }

        req.userId = decoded.id
        return next()
    } catch {
        return res.status(401).json({ error: 'Token inválido' })
    }
}
