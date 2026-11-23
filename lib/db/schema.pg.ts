import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  txnId: text('txn_id').notNull(),
  category: text('category').notNull(),
  createdAt: text('created_at').notNull(),
});
export const resolutions = pgTable('resolutions', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  exKey: text('ex_key').notNull(),
  resolution: text('resolution').notNull(),
  createdAt: text('created_at').notNull(),
});
export const steps = pgTable('steps', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  step: text('step').notNull(),
  done: integer('done').notNull(),
  createdAt: text('created_at').notNull(),
});
export const audit = pgTable('audit', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  step: text('step').notNull(),
  actor: text('actor').notNull(),
  detail: text('detail').notNull(),
  createdAt: text('created_at').notNull(),
});
export const rateEvents = pgTable('rate_events', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  kind: text('kind').notNull(),
  at: integer('at').notNull(),
});
