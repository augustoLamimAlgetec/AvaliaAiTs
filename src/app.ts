import cookieParser from 'cookie-parser';
import cors from 'cors';
import multer from 'multer'; // Import Multer
import routes from './routes';
import express, { Request, Response, NextFunction } from 'express'
class App {
    server: any;

    constructor() {
        this.server = express();
        this.middlewares();
        this.routes();
    }

    middlewares() {
        this.server.use(express.json());
        this.server.use(cors());
        this.server.use(cookieParser());
        const upload = multer({ dest: 'uploads/' }).single('file');

        // Custom middleware function to handle file uploads
        this.server.use((req: Request, res: Response, next: NextFunction) => {
            upload(req, res, (err: any) => {
                if (err) {
                    return res.status(400).json({ error: 'Error uploading file' });
                }
                next(); // Continue to next middleware or route handler
            });
        })

    }

    routes() {
        this.server.use(routes);
    }
}

export default new App().server;
