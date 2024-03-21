import { Router } from "express";
import auth from './middlewares/auth';
import GradeController from "./controllers/GradeController";
import AssistantController from "./controllers/AssistantController";



const routes = Router();
routes.get('/', (req, res) => {
    res.send('Hello World')
})

routes.use(auth);
routes.post('/grades', GradeController.store)
routes.post('/assistants', AssistantController.store)
routes.put('/assistants/:id', AssistantController.update)
routes.get('/assistants', AssistantController.index)
routes.get('/assistants/:id', AssistantController.show)


export default routes;
