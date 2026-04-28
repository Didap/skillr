import { pgTable, text, timestamp, boolean, integer, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum('role', ['professional', 'company']);
export const rateTypeEnum = pgEnum('rate_type', ['ral_annual', 'daily', 'hourly']);
export const matchStatusEnum = pgEnum('match_status', ['pending', 'liked', 'passed']);

export const users = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: roleEnum("role"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: [account.provider, account.providerAccountId],
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: [vt.identifier, vt.token],
  })
);

export const professionalProfiles = pgTable("professional_profiles", {
  userId: text("user_id").references(() => users.id).primaryKey(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  title: text("title"),
  photoUrl: text("photo_url"),
  city: text("city"),
  remoteOk: boolean("remote_ok").default(false),
  yearsExperience: integer("years_experience"),
  rateType: rateTypeEnum("rate_type"),
  rateAmountEur: integer("rate_amount_eur"),
  bioShort: text("bio_short"),
  bioLong: text("bio_long"),
  topSkills: text("top_skills").array(),
  secondarySkills: text("secondary_skills").array(),
  clusters: text("clusters").array(),
  isActive: boolean("is_active").default(true),
});

export const companyProfiles = pgTable("company_profiles", {
  userId: text("user_id").references(() => users.id).primaryKey(),
  companyName: text("company_name"),
  vatNumber: text("vat_number"),
  vatVerifiedAt: timestamp("vat_verified_at"),
  logoUrl: text("logo_url"),
  city: text("city"),
  industry: text("industry"),
  description: text("description"),
  websiteUrl: text("website_url"),
});

export const jobs = pgTable("jobs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  skills: text("skills").array(),
  budgetMinEur: integer("budget_min_eur"),
  budgetMaxEur: integer("budget_max_eur"),
  rateType: rateTypeEnum("rate_type"),
  location: text("location"),
  remoteOk: boolean("remote_ok").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const matches = pgTable("matches", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  professionalId: text("professional_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyId: text("company_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobId: text("job_id").references(() => jobs.id, { onDelete: "set null" }),
  professionalStatus: matchStatusEnum("professional_status").default("pending"),
  companyStatus: matchStatusEnum("company_status").default("pending"),
  matchedAt: timestamp("matched_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const proposedSlots = pgTable("proposed_slots", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  matchId: text("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isAccepted: boolean("is_accepted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const availability = pgTable("availability", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  professionalId: text("professional_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  timeSlot: text("time_slot").notNull(), // e.g., '09:00-09:30'
  isBooked: boolean("is_booked").default(false),
  bookedByCompanyId: text("booked_by_company_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clusters = pgTable("clusters", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
});

export const skills = pgTable("skills", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clusterId: text("cluster_id").notNull().references(() => clusters.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
});

// RELATIONS
export const usersRelations = relations(users, ({ one, many }) => ({
  professionalProfile: one(professionalProfiles, {
    fields: [users.id],
    references: [professionalProfiles.userId],
  }),
  companyProfile: one(companyProfiles, {
    fields: [users.id],
    references: [companyProfiles.userId],
  }),
  jobs: many(jobs),
  professionalMatches: many(matches, { relationName: "professionalMatches" }),
  companyMatches: many(matches, { relationName: "companyMatches" }),
  availabilities: many(availability, { relationName: "professionalAvailabilities" }),
  bookings: many(availability, { relationName: "companyBookings" }),
}));

export const professionalProfilesRelations = relations(professionalProfiles, ({ one }) => ({
  user: one(users, {
    fields: [professionalProfiles.userId],
    references: [users.id],
  }),
}));

export const companyProfilesRelations = relations(companyProfiles, ({ one }) => ({
  user: one(users, {
    fields: [companyProfiles.userId],
    references: [users.id],
  }),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  company: one(users, {
    fields: [jobs.companyId],
    references: [users.id],
  }),
  matches: many(matches),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  professional: one(users, {
    fields: [matches.professionalId],
    references: [users.id],
    relationName: "professionalMatches",
  }),
  company: one(users, {
    fields: [matches.companyId],
    references: [users.id],
    relationName: "companyMatches",
  }),
  job: one(jobs, {
    fields: [matches.jobId],
    references: [jobs.id],
  }),
  proposedSlots: many(proposedSlots),
}));

export const proposedSlotsRelations = relations(proposedSlots, ({ one }) => ({
  match: one(matches, {
    fields: [proposedSlots.matchId],
    references: [matches.id],
  }),
}));

export const availabilityRelations = relations(availability, ({ one }) => ({
  professional: one(users, {
    fields: [availability.professionalId],
    references: [users.id],
    relationName: "professionalAvailabilities",
  }),
  bookedByCompany: one(users, {
    fields: [availability.bookedByCompanyId],
    references: [users.id],
    relationName: "companyBookings",
  }),
}));

export const clustersRelations = relations(clusters, ({ many }) => ({
  skills: many(skills),
}));

export const skillsRelations = relations(skills, ({ one }) => ({
  cluster: one(clusters, {
    fields: [skills.clusterId],
    references: [clusters.id],
  }),
}));
