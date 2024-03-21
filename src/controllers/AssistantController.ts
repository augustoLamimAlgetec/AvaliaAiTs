import { Response, Request } from 'express'
import * as Yup from 'yup';
import { db } from '../database';

class QuestionController {

    async index(request: Request, response: Response) {
        try {

            const assistants = await db
                .selectFrom('assistant')
                .selectAll()
                .execute()
            return response.status(200).json(
                assistants,
            );
        } catch (error) {
            return response.status(500).json({
                error: 'Ocorreu um erro ao carregar os dados.',
                stack: error,
                local: 'assistants.index',
            });
        }
    }

    async show(request: Request, response: Response) {

        try {
            const { id }: { id?: number } = request.params;
            if (!id) {
                return response.status(400).json({
                    error: 'O ID deve ser informado.'
                })
            }
            const assistant = await db
                .selectFrom('assistant')
                .where('id', '=', id)
                .selectAll()
                .limit(1)
                .execute()
            if (assistant.length === 0) {
                return response.status(400).json({ error: 'Assistente não encontrado.' });
            }


            return response.status(200).json(
                assistant[0]
            );
        } catch (error) {
            return response.status(500).json({
                error: 'Ocorreu um erro ao carregar os dados.',
                stack: error,
                local: 'Assistant.show',
            });
        }
    }
    async store(request: Request, response: Response) {
        try {
            const schema = Yup.object().shape({
                modelId: Yup.string().required(),
                type: Yup.string().required(),
            });


            try {
                await schema.validate(request.body, { abortEarly: false });
            } catch (validationError: any) {
                console.log(typeof validationError)
                return response.status(400).json({ errors: validationError.errors });
            }

            const { modelId, type } = request.body;


            const newAssistant = await db
                .insertInto('assistant')
                .values({
                    model_id: modelId,
                    type: type,
                    status: 'Active'
                })
                .returning(['id', 'model_id', 'type', 'status'])
                .executeTakeFirstOrThrow()

            return response.status(201).json({
                id: newAssistant.id,
                model_id: newAssistant.model_id,
                type: newAssistant.type,
                status: newAssistant.status
            });
        } catch (error) {
            return response.status(500).json({
                error: 'Ocorreu um erro ao salvar os dados.',
                stack: error,
                local: 'Questions.store',
            });
        }
    }

    async update(request: Request, response: Response) {
        try {
            const schema = Yup.object().shape({
                status: Yup.string().required().oneOf(['Active', 'Inactive']),
            });


            try {
                await schema.validate(request.body, { abortEarly: false });
            } catch (validationError: any) {
                console.log(typeof validationError)
                return response.status(400).json({ errors: validationError.errors });
            }

            const { status } = request.body;
            const { id }: { id?: number } = request.params;
            if (!id) {
                return response.status(400).json({
                    error: 'O ID deve ser informado.'
                })
            }
            await db
                .updateTable('assistant')
                .set({
                    status: status,
                })
                .where('id', '=', id)
                .returning(['id', 'status'])
                .executeTakeFirstOrThrow()


            return response.status(200).json({
                id: id,
                status: status
            });
        } catch (error) {
            return response.status(500).json({
                error: 'Ocorreu um erro ao salvar os dados.',
                stack: error,
                local: 'Assistants.update',
            });
        }
    }

}


export default new QuestionController();
