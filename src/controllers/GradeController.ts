import { Response, Request } from 'express'
import * as Yup from 'yup';
import { db } from '../database';
import axios from 'axios';
import fs from 'fs'

const axiosConfig = {
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_SECRET_KEY}`,
        'OpenAI-Beta': 'assistants=v1'
    },
}
async function waitForIntervalToEnd(threadsApiUrl: string, threadId: string, runId: string) {
    return new Promise((resolve, reject) => {
        let counter = 0;
        const interval = setInterval(async () => {
            try {
                const response = await axios.get(`${threadsApiUrl}/${threadId}/runs/${runId}`, axiosConfig);

                if (response.data.status === 'requires_action') {
                    clearInterval(interval); // Stop the interval
                    console.log('Condition met. Stopping the interval.');
                    resolve(response.data.required_action.submit_tool_outputs.tool_calls[0].function.arguments);
                    return; // Exit the interval function
                }
            } catch (error) {
                clearInterval(interval);
                reject(error);
            }

            counter += 5;
            if (counter >= 60) {
                clearInterval(interval);
                resolve(null); // Resolve with null if the interval ends without meeting the condition
            }
        }, 5000);
    });
}
class GradeController {

    async store(request: Request, response: Response) {

        //  try {
        const schema = Yup.object().shape({
            data: Yup.object().shape({
                type: Yup.string().required(),
            }),
        });

        try {
            await schema.validate(request.body, { abortEarly: false });
        } catch (validationError: any) {
            console.log(typeof validationError);
            return response.status(400).json({ errors: validationError.errors });
        }
        if (!request.file) {
            return response.status(400).json({ error: 'No file uploaded' });
        }
        const { type }: { type: string } = JSON.parse(request.body.data)
        const file = request.file

        const assistant = await db
            .selectFrom('assistant')
            .where('type', '=', "Simple")
            .selectAll()
            .limit(1)
            .execute()
        if (assistant.length === 0) {
            return response.status(400).json({ error: 'Assistente não encontrado.' });
        }
        const thread = await db
            .selectFrom('thread')
            .where('in_use', '=', false)
            .selectAll()
            .limit(1)
            .execute()
        const formData = new FormData()
        formData.append('purpose', 'assistants')
            ;
        const fileBlob = new Blob([file.buffer], { type: file.mimetype })
        formData.append('file', fileBlob, file.originalname)


        const filesApiUrl = 'https://api.openai.com/v1/files'
        const postFileApiResponse = await axios.post(filesApiUrl, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${process.env.OPENAI_SECRET_KEY}`,
                'OpenAI-Beta': 'assistants=v1'
            },
        })
        const fileId = postFileApiResponse.data.id
        const threadsApiUrl = 'https://api.openai.com/v1/threads'

        //create new thread
        let threadId = ''
        let messageId = ''

        if (thread.length === 0) {

            const postThreadApiResponse = await axios.post(threadsApiUrl, {}, axiosConfig)

            threadId = postThreadApiResponse.data.id

            const createMessageApiResponse = await axios.post(`${threadsApiUrl}/${threadId}/messages`, {
                "role": "user",
                "content": "Avalie o trabalho",
                "file_ids": [
                    fileId
                ]
            }, axiosConfig)
            await db
                .insertInto('thread')
                .values({
                    thread_id: postThreadApiResponse.data.id,
                    message_id: createMessageApiResponse.data.id,
                    in_use: true
                })
                .executeTakeFirstOrThrow()

            messageId = createMessageApiResponse.data.id
        } else {
            threadId = thread[0].thread_id
            messageId = thread[0].message_id
        }
        /*
        //modify message
        await axios.post(`${threadsApiUrl}/${threadId}/messages/${messageId}`, {
            "role": "user",
            "content": "Avalie o trabalho",
            "file_ids": [
                fileId
            ]
        }, axiosConfig)
        */
        //create run
        const createRunApiResponse = await axios.post(`${threadsApiUrl}/${threadId}/runs`, {
            assistant_id: assistant[0].model_id,
            instructions: "Consulte os arquivos e use a função avaliacaoDoTrabalho"
        }, axiosConfig)
        //data > required_action> submit_tool_outputs> tool_calls > function > arguments
        const responseData: any = await waitForIntervalToEnd(threadsApiUrl, threadId, createRunApiResponse.data.id)

        //delete file from local and gpt
        await axios.delete(`${filesApiUrl}/${fileId}`, axiosConfig)
        //fs.unlinkSync(file.path)
        /*
        //put thread out of use
        await db
            .updateTable('thread')
            .set({
                in_use: false,
            })
            .where('thread_id', '=', threadId)
            .executeTakeFirstOrThrow()
*/
        return response.status(200).json({ data: responseData });

        //} catch (error) {
        //    return response.status(500).json({
        //         error: 'Ocorreu um erro ao salvar os dados.',
        //       stack: error,
        //        local: 'Grade.chatgpt',
        //   });
        // }
    }

}

export default new GradeController();
