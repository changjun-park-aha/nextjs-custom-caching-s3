export * from './users';
export * from './posts';
export * from './comments';
export * from './votes';

// Relations are defined separately to avoid circular dependencies
import { relations } from 'drizzle-orm';
import { users } from './users';
import { posts } from './posts';
import { comments } from './comments';
import { votes } from './votes';

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  votes: many(votes),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
  votes: many(votes),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
  }),
  replies: many(comments),
  mentionedUser: one(users, {
    fields: [comments.mentionedUserId],
    references: [users.id],
  }),
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
}));