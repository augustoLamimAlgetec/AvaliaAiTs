import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('assistant')
        .addColumn('id', 'serial', (col) => col.primaryKey())
        .addColumn('model_id', 'varchar', (col) => col.unique())
        .addColumn('type', 'varchar')
        .addColumn('status', 'varchar')
        .addColumn('created_at', 'timestamp', (col) =>
            col.defaultTo(sql`now()`).notNull()
        )
        .execute()

    await db.schema
        .createTable('thread')
        .addColumn('id', 'serial', (col) => col.primaryKey())
        .addColumn('thread_id', 'varchar', (col) => col.notNull().unique())
        .addColumn('message_id', 'varchar', (col) => col.notNull().unique())
        .addColumn('in_use', 'boolean', (col) => col.defaultTo(false).notNull())
        .addColumn('created_at', 'timestamp', (col) =>
            col.defaultTo(sql`now()`).notNull()
        )
        .execute()

}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable('thread').execute()
    await db.schema.dropTable('assistant').execute()
}