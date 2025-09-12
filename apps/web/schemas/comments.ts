import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { posts } from './posts'
import { users } from './users'

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  authorId: uuid('author_id')
    .references(() => users.id)
    .notNull(),
  postId: uuid('post_id')
    .references(() => posts.id)
    .notNull(),
  parentId: uuid('parent_id'), // for replies - will reference comments.id
  mentionedUserId: uuid('mentioned_user_id').references(() => users.id), // for user mentions
  upvotes: integer('upvotes').default(0).notNull(),
  downvotes: integer('downvotes').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // for soft delete
})

export type Comment = typeof comments.$inferSelect
export type NewComment = typeof comments.$inferInsert
