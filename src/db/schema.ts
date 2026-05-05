import { pgTable, text, timestamp, boolean, integer, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum('role', ['professional', 'company']);
export const rateTypeEnum = pgEnum('rate_type', ['ral_annual', 'daily', 'hourly']);
export const matchStatusEnum = pgEnum('match_status', ['pending', 'liked', 'passed']);
export const paServiceEnum = pgEnum('pa_service', ['match', 'outreach', 'codesign']);
export const paEntityTypeEnum = pgEnum('pa_entity_type', ['municipality', 'region', 'cpi', 'ngo', 'foundation']);
export const interviewBookingStatusEnum = pgEnum('interview_booking_status', ['booked', 'cancelled', 'completed']);
export const paSubscriberStatusEnum = pgEnum('pa_subscriber_status', ['pending', 'active', 'unsubscribed']);


export const users = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
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

export const verificationCodes = pgTable("verification_codes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

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
  averageRating: text("average_rating").default("0"),
  reviewCount: integer("review_count").default(0),
});

export const companyProfiles = pgTable("company_profiles", {
  userId: text("user_id").references(() => users.id).primaryKey(),
  companyName: text("company_name"),
  vatNumber: text("vat_number"),
  vatVerifiedAt: timestamp("vat_verified_at"),
  vatDisclaimerAccepted: boolean("vat_disclaimer_accepted").default(false),
  logoUrl: text("logo_url"),
  city: text("city"),
  industry: text("industry"),
  description: text("description"),
  websiteUrl: text("website_url"),
  averageRating: text("average_rating").default("0"),
  reviewCount: integer("review_count").default(0),
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
  scheduledAt: timestamp("scheduled_at"),
  meetingLink: text("meeting_link"),
  googleEventId: text("google_event_id"),
  callDuration: integer("call_duration"),
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

export const jobCategories = pgTable("job_categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
});

export const jobTitles = pgTable("job_titles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  categoryId: text("category_id").notNull().references(() => jobCategories.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
});

export const paLeads = pgTable("pa_leads", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  organization: text("organization").notNull(),
  entityType: paEntityTypeEnum("entity_type"),
  role: text("role"),
  service: paServiceEnum("service"),
  deadline: timestamp("deadline"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paSubscribers = pgTable("pa_subscribers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  status: paSubscriberStatusEnum("status").default("pending"),
  verificationToken: text("verification_token"),
  createdAt: timestamp("created_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
});


export const interviewEvents = pgTable("interview_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  maxSlots: integer("max_slots").notNull(),
  format: text("format"), // e.g., "5min-5+2"
  meetingLink: text("meeting_link"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const interviewBookings = pgTable("interview_bookings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: text("event_id").notNull().references(() => interviewEvents.id, { onDelete: "cascade" }),
  professionalId: text("professional_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: interviewBookingStatusEnum("status").default("booked"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  matchId: text("match_id").references(() => matches.id, { onDelete: "set null" }),
  interviewBookingId: text("interview_booking_id").references(() => interviewBookings.id, { onDelete: "set null" }),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetId: text("target_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  stars: integer("stars").notNull(),
  text: text("text"),
  createdAt: timestamp("created_at").defaultNow(),
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
  interviewEvents: many(interviewEvents),
  interviewBookings: many(interviewBookings),
  sentReviews: many(reviews, { relationName: "sentReviews" }),
  receivedReviews: many(reviews, { relationName: "receivedReviews" }),
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
  reviews: many(reviews),
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

export const jobCategoriesRelations = relations(jobCategories, ({ many }) => ({
  titles: many(jobTitles),
}));

export const jobTitlesRelations = relations(jobTitles, ({ one }) => ({
  category: one(jobCategories, {
    fields: [jobTitles.categoryId],
    references: [jobCategories.id],
  }),
}));

export const interviewEventsRelations = relations(interviewEvents, ({ one, many }) => ({
  company: one(users, {
    fields: [interviewEvents.companyId],
    references: [users.id],
  }),
  bookings: many(interviewBookings),
}));

export const interviewBookingsRelations = relations(interviewBookings, ({ one, many }) => ({
  event: one(interviewEvents, {
    fields: [interviewBookings.eventId],
    references: [interviewEvents.id],
  }),
  professional: one(users, {
    fields: [interviewBookings.professionalId],
    references: [users.id],
  }),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  author: one(users, {
    fields: [reviews.authorId],
    references: [users.id],
    relationName: "sentReviews",
  }),
  target: one(users, {
    fields: [reviews.targetId],
    references: [users.id],
    relationName: "receivedReviews",
  }),
  match: one(matches, {
    fields: [reviews.matchId],
    references: [matches.id],
  }),
  interviewBooking: one(interviewBookings, {
    fields: [reviews.interviewBookingId],
    references: [interviewBookings.id],
  }),
}));
