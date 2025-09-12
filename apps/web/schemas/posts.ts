import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { users } from './users'

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  renderer: varchar('renderer', { length: 50 }).notNull().default('markdown'), // e.g., 'markdown', 'html'
  authorId: uuid('author_id')
    .references(() => users.id)
    .notNull(),
  upvotes: integer('upvotes').default(0).notNull(),
  downvotes: integer('downvotes').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // for soft delete
})

export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
