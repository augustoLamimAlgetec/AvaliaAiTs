import { Response, NextFunction } from 'express';
import { ExtendedRequest } from '../../@types';
import bcrypt from 'bcrypt';
export default function auth(request: ExtendedRequest, response: Response, next: NextFunction) {

    const authHeader: any = request.headers['x-api-key'];

    if (!authHeader) {
        return response.status(401).json({ error: "chave de api não encontrada" });
    }
    try {
        const apiKey = process.env.API_KEY as string;
        const result = bcrypt.compare(apiKey, authHeader)
        if (!result) {
            return response.status(401).json({ error: "chave invalida" });
        }

        next();
    } catch (error) {
        return response.status(500).json({ error: "internal server error", stack: error })
    }

}