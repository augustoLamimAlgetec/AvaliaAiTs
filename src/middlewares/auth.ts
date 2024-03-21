import { Response, NextFunction } from 'express';
import { ExtendedRequest } from '../../@types';

export default function auth(request: ExtendedRequest, response: Response, next: NextFunction) {

    const authHeader = request.headers['x-api-key'];

    if (!authHeader) {
        return response.status(401).json({ error: "chave de api não encontrada" });
    }

    try {
        const apiKey = process.env.API_KEY as string;

        if (apiKey !== authHeader) {
            return response.status(401).json({ error: "chave invalida" });
        }

        next();
    } catch (error) {
        return response.status(500).json({ error: "internal server error", stack: error })
    }

}