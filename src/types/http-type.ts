import type { Request, Response } from 'express'

export interface IHttp {
    req: Request
    res: Response
}