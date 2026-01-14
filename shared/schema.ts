import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  serial, 
  integer, 
  timestamp, 
  boolean, 
  date, 
  jsonb, 
  real 
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ===== USERS =====
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ===== CHAT (from integration) =====
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// ===== PAYORS =====
export const payors = pgTable("payors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  payorName: text("payor_name").notNull(),
  payorCode: varchar("payor_code", { length: 50 }).unique(),
  payorType: varchar("payor_type", { length: 100 }),
  headquartersState: varchar("headquarters_state", { length: 2 }),
  operatingStates: text("operating_states").array(),
  isActive: boolean("is_active").default(true),
  contactInfo: jsonb("contact_info"),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertPayorSchema = createInsertSchema(payors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Payor = typeof payors.$inferSelect;
export type InsertPayor = z.infer<typeof insertPayorSchema>;

// ===== CLAUSE CATEGORIES =====
export const clauseCategories = pgTable("clause_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryName: varchar("category_name", { length: 200 }).notNull().unique(),
  parentCategoryId: varchar("parent_category_id"),
  description: text("description"),
  displayOrder: integer("display_order"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertClauseCategorySchema = createInsertSchema(clauseCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ClauseCategory = typeof clauseCategories.$inferSelect;
export type InsertClauseCategory = z.infer<typeof insertClauseCategorySchema>;

// ===== CLAUSE TEMPLATES =====
export const clauseTemplates = pgTable("clause_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clauseCode: varchar("clause_code", { length: 50 }).notNull().unique(),
  clauseTitle: varchar("clause_title", { length: 500 }).notNull(),
  clauseText: text("clause_text").notNull(),
  clauseVersion: varchar("clause_version", { length: 20 }).notNull(),
  categoryId: varchar("category_id").references(() => clauseCategories.id),
  
  // Metadata
  payorTypes: text("payor_types").array(),
  jurisdictions: text("jurisdictions").array(),
  serviceTypes: text("service_types").array(),
  effectiveDate: date("effective_date"),
  expirationDate: date("expiration_date"),
  
  // Workflow
  status: varchar("status", { length: 50 }).default("draft"),
  createdBy: varchar("created_by").references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  // Usage tracking
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  
  // Compliance
  regulatoryReferences: text("regulatory_references").array(),
  complianceNotes: text("compliance_notes"),
  tags: text("tags").array(),
  
  // Version control
  isCurrentVersion: boolean("is_current_version").default(true),
  previousVersionId: varchar("previous_version_id"),
  changeSummary: text("change_summary"),
  
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertClauseTemplateSchema = createInsertSchema(clauseTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
});

export type ClauseTemplate = typeof clauseTemplates.$inferSelect;
export type InsertClauseTemplate = z.infer<typeof insertClauseTemplateSchema>;

// ===== CLAUSE VARIABLES =====
export const clauseVariables = pgTable("clause_variables", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clauseId: varchar("clause_id").notNull().references(() => clauseTemplates.id, { onDelete: "cascade" }),
  variableName: varchar("variable_name", { length: 100 }).notNull(),
  variableType: varchar("variable_type", { length: 50 }),
  defaultValue: text("default_value"),
  validationRules: jsonb("validation_rules"),
  description: text("description"),
  isRequired: boolean("is_required").default(false),
});

export const insertClauseVariableSchema = createInsertSchema(clauseVariables).omit({
  id: true,
});

export type ClauseVariable = typeof clauseVariables.$inferSelect;
export type InsertClauseVariable = z.infer<typeof insertClauseVariableSchema>;

// ===== CONTRACTS =====
export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractNumber: varchar("contract_number", { length: 100 }).notNull().unique(),
  contractName: varchar("contract_name", { length: 300 }).notNull(),
  
  payorId: varchar("payor_id").references(() => payors.id),
  payorName: varchar("payor_name", { length: 300 }),
  payorType: varchar("payor_type", { length: 100 }),
  jurisdiction: varchar("jurisdiction", { length: 100 }),
  
  contractStatus: varchar("contract_status", { length: 50 }).default("draft"),
  
  effectiveDate: date("effective_date"),
  terminationDate: date("termination_date"),
  renewalTerms: text("renewal_terms"),
  
  createdBy: varchar("created_by").references(() => users.id),
  assignedTo: varchar("assigned_to").references(() => users.id),
  
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;

// ===== CONTRACT CLAUSES =====
export const contractClauses = pgTable("contract_clauses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  clauseTemplateId: varchar("clause_template_id").references(() => clauseTemplates.id),
  clauseCode: varchar("clause_code", { length: 50 }),
  clauseTitle: varchar("clause_title", { length: 500 }),
  
  sectionName: varchar("section_name", { length: 200 }),
  subsectionName: varchar("subsection_name", { length: 200 }),
  displayOrder: integer("display_order"),
  
  clauseText: text("clause_text").notNull(),
  customizedText: text("customized_text"),
  isCustomized: boolean("is_customized").default(false),
  
  variableValues: jsonb("variable_values"),
  comments: jsonb("comments"),
  
  status: varchar("status", { length: 50 }).default("active"),
  
  addedBy: varchar("added_by").references(() => users.id),
  addedAt: timestamp("added_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  modifiedBy: varchar("modified_by").references(() => users.id),
  modifiedAt: timestamp("modified_at"),
});

export const insertContractClauseSchema = createInsertSchema(contractClauses).omit({
  id: true,
  addedAt: true,
});

export type ContractClause = typeof contractClauses.$inferSelect;
export type InsertContractClause = z.infer<typeof insertContractClauseSchema>;

// ===== VARIANCES =====
export const variances = pgTable("variances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  varianceCode: varchar("variance_code", { length: 50 }).notNull().unique(),
  
  patientId: varchar("patient_id", { length: 100 }),
  patientName: varchar("patient_name", { length: 200 }),
  
  payorId: varchar("payor_id").references(() => payors.id),
  payorName: varchar("payor_name", { length: 300 }),
  
  contractId: varchar("contract_id").references(() => contracts.id),
  
  serviceDate: date("service_date"),
  claimNumber: varchar("claim_number", { length: 100 }),
  
  expectedAmount: real("expected_amount"),
  actualAmount: real("actual_amount"),
  varianceAmount: real("variance_amount"),
  variancePercent: real("variance_percent"),
  
  varianceType: varchar("variance_type", { length: 100 }),
  varianceCategory: varchar("variance_category", { length: 100 }),
  
  status: varchar("status", { length: 50 }).default("pending"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  
  rootCause: text("root_cause"),
  notes: text("notes"),
  
  assignedTo: varchar("assigned_to").references(() => users.id),
  
  appealSubmitted: boolean("appeal_submitted").default(false),
  appealDate: date("appeal_date"),
  appealOutcome: varchar("appeal_outcome", { length: 100 }),
  
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export const insertVarianceSchema = createInsertSchema(variances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Variance = typeof variances.$inferSelect;
export type InsertVariance = z.infer<typeof insertVarianceSchema>;

// ===== AI SUGGESTIONS LOG =====
export const aiSuggestionsLog = pgTable("ai_suggestions_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").references(() => contracts.id),
  userContext: jsonb("user_context"),
  suggestedClauses: jsonb("suggested_clauses"),
  clausesSelected: jsonb("clauses_selected"),
  feedbackRating: integer("feedback_rating"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertAiSuggestionSchema = createInsertSchema(aiSuggestionsLog).omit({
  id: true,
  createdAt: true,
});

export type AiSuggestionLog = typeof aiSuggestionsLog.$inferSelect;
export type InsertAiSuggestionLog = z.infer<typeof insertAiSuggestionSchema>;
