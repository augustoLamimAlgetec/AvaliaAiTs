import { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely'

export interface Database {
    assistant: AssistantTable
    thread: ThreadTable
}
export interface AssistantTable {
    id: Generated<number>
    model_id: string
    type: string
    status: string
    created_at?: string
}
export type Assistant = Selectable<AssistantTable>
export type NewAssistant = Insertable<AssistantTable>
export type AssistantUpdate = Updateable<AssistantTable>

export interface ThreadTable {
    id: Generated<number>
    thread_id: string
    in_use: boolean
    created_at?: string
    message_id: string
}

export type Thread = Selectable<ThreadTable>
export type NewThread = Insertable<ThreadTable>


export interface Database {
    assistants: AssistantTable
    threads: ThreadTable
}