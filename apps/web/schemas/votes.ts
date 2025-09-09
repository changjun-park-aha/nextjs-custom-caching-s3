import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { posts } from './posts';
import { comments } from './comments';

export const votes = pgTable('votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  targetId: uuid('target_id').notNull(), // ID of post, comment, or reply
  targetType: varchar('target_type', { length: 20 }).notNull(), // 'post', 'comment'
  voteType: varchar('vote_type', { length: 10 }).notNull(), // 'upvote', 'downvote'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // for soft delete
});

export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;