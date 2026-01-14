import { db } from "./db";
import { 
  users,
  clauseTemplates, 
  clauseCategories, 
  clauseVariables,
  contracts,
  contractClauses,
  variances,
  payors,
  aiSuggestionsLog,
  contractUploads,
  type User,
  type InsertUser,
  type ClauseTemplate,
  type InsertClauseTemplate,
  type ClauseCategory,
  type InsertClauseCategory,
  type Contract,
  type InsertContract,
  type ContractClause,
  type InsertContractClause,
  type Variance,
  type InsertVariance,
  type Payor,
  type InsertPayor,
  type InsertAiSuggestionLog,
  type ContractUpload,
  type InsertContractUpload,
  type ExtractedClause,
  type ClauseDecision
} from "@shared/schema";
import { eq, desc, and, gte, lte, ilike, or, sql, asc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Clause Categories
  getClauseCategories(): Promise<ClauseCategory[]>;
  getClauseCategory(id: string): Promise<ClauseCategory | undefined>;
  createClauseCategory(data: InsertClauseCategory): Promise<ClauseCategory>;
  
  // Clause Templates
  getClauseTemplates(filters?: {
    categoryId?: string;
    status?: string;
    search?: string;
  }): Promise<ClauseTemplate[]>;
  getClauseTemplate(id: string): Promise<ClauseTemplate | undefined>;
  getClauseTemplateByCode(code: string): Promise<ClauseTemplate | undefined>;
  createClauseTemplate(data: InsertClauseTemplate): Promise<ClauseTemplate>;
  updateClauseTemplate(id: string, data: Partial<InsertClauseTemplate>): Promise<ClauseTemplate | undefined>;
  deleteClauseTemplate(id: string): Promise<void>;
  incrementClauseUsage(id: string): Promise<void>;
  
  // Contracts
  getContracts(filters?: {
    status?: string;
    payorId?: string;
  }): Promise<Contract[]>;
  getContract(id: string): Promise<Contract | undefined>;
  createContract(data: InsertContract): Promise<Contract>;
  updateContract(id: string, data: Partial<InsertContract>): Promise<Contract | undefined>;
  deleteContract(id: string): Promise<void>;
  
  // Contract Clauses
  getContractClauses(contractId: string): Promise<ContractClause[]>;
  saveContractClauses(contractId: string, clauses: InsertContractClause[]): Promise<ContractClause[]>;
  deleteContractClauses(contractId: string): Promise<void>;
  
  // Variances
  getVariances(filters?: {
    status?: string;
    payorId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Variance[]>;
  getVariance(id: string): Promise<Variance | undefined>;
  createVariance(data: InsertVariance): Promise<Variance>;
  updateVariance(id: string, data: Partial<InsertVariance>): Promise<Variance | undefined>;
  
  // Payors
  getPayors(): Promise<Payor[]>;
  getPayor(id: string): Promise<Payor | undefined>;
  createPayor(data: InsertPayor): Promise<Payor>;
  
  // AI Suggestions
  logAiSuggestion(data: InsertAiSuggestionLog): Promise<void>;
  
  // Contract Uploads
  getContractUploads(): Promise<ContractUpload[]>;
  getContractUpload(id: string): Promise<ContractUpload | undefined>;
  createContractUpload(data: InsertContractUpload): Promise<ContractUpload>;
  updateContractUpload(id: string, data: Partial<InsertContractUpload>): Promise<ContractUpload | undefined>;
  deleteContractUpload(id: string): Promise<void>;
}

export const storage: IStorage = {
  // Users
  async getUser(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },

  async getUserByUsername(username: string) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  },

  async createUser(insertUser: InsertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  },

  // Clause Categories
  async getClauseCategories() {
    return db.select().from(clauseCategories).where(eq(clauseCategories.isActive, true));
  },

  async getClauseCategory(id: string) {
    const [category] = await db.select().from(clauseCategories).where(eq(clauseCategories.id, id));
    return category;
  },

  async createClauseCategory(data: InsertClauseCategory) {
    const [category] = await db.insert(clauseCategories).values(data).returning();
    return category;
  },

  // Clause Templates
  async getClauseTemplates(filters = {}) {
    const conditions = [];
    
    if (filters.categoryId) {
      conditions.push(eq(clauseTemplates.categoryId, filters.categoryId));
    }
    
    if (filters.status) {
      conditions.push(eq(clauseTemplates.status, filters.status));
    }
    
    if (filters.search) {
      conditions.push(
        or(
          ilike(clauseTemplates.clauseTitle, `%${filters.search}%`),
          ilike(clauseTemplates.clauseCode, `%${filters.search}%`),
          ilike(clauseTemplates.clauseText, `%${filters.search}%`)
        )
      );
    }
    
    const query = conditions.length > 0 
      ? db.select().from(clauseTemplates).where(and(...conditions))
      : db.select().from(clauseTemplates);
      
    return query.orderBy(desc(clauseTemplates.updatedAt));
  },

  async getClauseTemplate(id: string) {
    const [template] = await db.select().from(clauseTemplates).where(eq(clauseTemplates.id, id));
    return template;
  },

  async getClauseTemplateByCode(code: string) {
    const [template] = await db.select().from(clauseTemplates).where(eq(clauseTemplates.clauseCode, code));
    return template;
  },

  async createClauseTemplate(data: InsertClauseTemplate) {
    const [template] = await db.insert(clauseTemplates).values(data).returning();
    return template;
  },

  async updateClauseTemplate(id: string, data: Partial<InsertClauseTemplate>) {
    const [template] = await db.update(clauseTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clauseTemplates.id, id))
      .returning();
    return template;
  },

  async deleteClauseTemplate(id: string) {
    await db.delete(clauseTemplates).where(eq(clauseTemplates.id, id));
  },

  async incrementClauseUsage(id: string) {
    await db.execute(sql`
      UPDATE clause_templates 
      SET usage_count = usage_count + 1, last_used_at = CURRENT_TIMESTAMP 
      WHERE id = ${id}
    `);
  },

  // Contracts
  async getContracts(filters = {}) {
    const conditions = [];
    
    if (filters.status) {
      conditions.push(eq(contracts.contractStatus, filters.status));
    }
    
    if (filters.payorId) {
      conditions.push(eq(contracts.payorId, filters.payorId));
    }
    
    const query = conditions.length > 0 
      ? db.select().from(contracts).where(and(...conditions))
      : db.select().from(contracts);
      
    return query.orderBy(desc(contracts.createdAt));
  },

  async getContract(id: string) {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract;
  },

  async createContract(data: InsertContract) {
    const [contract] = await db.insert(contracts).values(data).returning();
    return contract;
  },

  async updateContract(id: string, data: Partial<InsertContract>) {
    const [contract] = await db.update(contracts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(contracts.id, id))
      .returning();
    return contract;
  },

  async deleteContract(id: string) {
    await db.delete(contracts).where(eq(contracts.id, id));
  },

  // Contract Clauses
  async getContractClauses(contractId: string) {
    return db.select()
      .from(contractClauses)
      .where(eq(contractClauses.contractId, contractId))
      .orderBy(asc(contractClauses.displayOrder));
  },

  async saveContractClauses(contractId: string, clauses: InsertContractClause[]) {
    // Delete existing clauses and insert new ones
    await db.delete(contractClauses).where(eq(contractClauses.contractId, contractId));
    
    if (clauses.length === 0) return [];
    
    const clausesWithOrder = clauses.map((clause, index) => ({
      ...clause,
      contractId,
      displayOrder: index,
    }));
    
    return db.insert(contractClauses).values(clausesWithOrder).returning();
  },

  async deleteContractClauses(contractId: string) {
    await db.delete(contractClauses).where(eq(contractClauses.contractId, contractId));
  },

  // Variances
  async getVariances(filters = {}) {
    const conditions = [];
    
    if (filters.status) {
      conditions.push(eq(variances.status, filters.status));
    }
    
    if (filters.payorId) {
      conditions.push(eq(variances.payorId, filters.payorId));
    }
    
    if (filters.startDate) {
      conditions.push(gte(variances.serviceDate, filters.startDate.toISOString().split('T')[0]));
    }
    
    if (filters.endDate) {
      conditions.push(lte(variances.serviceDate, filters.endDate.toISOString().split('T')[0]));
    }
    
    const query = conditions.length > 0 
      ? db.select().from(variances).where(and(...conditions))
      : db.select().from(variances);
      
    return query.orderBy(desc(variances.createdAt));
  },

  async getVariance(id: string) {
    const [variance] = await db.select().from(variances).where(eq(variances.id, id));
    return variance;
  },

  async createVariance(data: InsertVariance) {
    const [variance] = await db.insert(variances).values(data).returning();
    return variance;
  },

  async updateVariance(id: string, data: Partial<InsertVariance>) {
    const [variance] = await db.update(variances)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(variances.id, id))
      .returning();
    return variance;
  },

  // Payors
  async getPayors() {
    return db.select().from(payors).where(eq(payors.isActive, true));
  },

  async getPayor(id: string) {
    const [payor] = await db.select().from(payors).where(eq(payors.id, id));
    return payor;
  },

  async createPayor(data: InsertPayor) {
    const [payor] = await db.insert(payors).values(data).returning();
    return payor;
  },

  // AI Suggestions
  async logAiSuggestion(data: InsertAiSuggestionLog) {
    await db.insert(aiSuggestionsLog).values(data);
  },

  // Contract Uploads
  async getContractUploads() {
    return db.select().from(contractUploads).orderBy(desc(contractUploads.createdAt));
  },

  async getContractUpload(id: string) {
    const [upload] = await db.select().from(contractUploads).where(eq(contractUploads.id, id));
    return upload;
  },

  async createContractUpload(data: InsertContractUpload) {
    const [upload] = await db.insert(contractUploads).values(data).returning();
    return upload;
  },

  async updateContractUpload(id: string, data: Partial<InsertContractUpload>) {
    const [upload] = await db.update(contractUploads)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(contractUploads.id, id))
      .returning();
    return upload;
  },

  async deleteContractUpload(id: string) {
    await db.delete(contractUploads).where(eq(contractUploads.id, id));
  },
};
