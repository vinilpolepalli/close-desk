import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ownerId: text('owner_id').notNull(),
  txnId: text('txn_id').notNull(),
  category: text('category').notNull(),
  createdAt: text('created_at').notNull(),
});
export const resolutions = sqliteTable('resolutions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ownerId: text('owner_id').notNull(),
  exKey: text('ex_key').notNull(),
  resolution: text('resolution').notNull(),
  createdAt: text('created_at').notNull(),
});
export const steps = sqliteTable('steps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ownerId: text('owner_id').notNull(),
  step: text('step').notNull(),
  done: integer('done').notNull(),
  createdAt: text('created_at').notNull(),
});
export const audit = sqliteTable('audit', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ownerId: text('owner_id').notNull(),
  step: text('step').notNull(),
  actor: text('actor').notNull(),
  detail: text('detail').notNull(),
  createdAt: text('created_at').notNull(),
});
export const rateEvents = sqliteTable('rate_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ownerId: text('owner_id').notNull(),
  kind: text('kind').notNull(),
  at: integer('at').notNull(),
});
