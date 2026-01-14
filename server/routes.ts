import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import OpenAI from "openai";
import { 
  insertClauseTemplateSchema, 
  insertClauseCategorySchema,
  insertContractSchema,
  insertVarianceSchema,
  insertPayorSchema
} from "@shared/schema";
import { fromError } from "zod-validation-error";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Register integration routes
  registerChatRoutes(app);
  registerImageRoutes(app);

  // ===== CLAUSE CATEGORIES =====
  app.get("/api/clause-categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getClauseCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/clause-categories", async (req: Request, res: Response) => {
    try {
      const validated = insertClauseCategorySchema.parse(req.body);
      const category = await storage.createClauseCategory(validated);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(400).json({ error: fromError(error).toString() });
    }
  });

  // ===== CLAUSE TEMPLATES =====
  app.get("/api/clauses", async (req: Request, res: Response) => {
    try {
      const { categoryId, status, search } = req.query;
      const filters = {
        categoryId: categoryId as string | undefined,
        status: status as string | undefined,
        search: search as string | undefined,
      };
      const clauses = await storage.getClauseTemplates(filters);
      res.json(clauses);
    } catch (error) {
      console.error("Error fetching clauses:", error);
      res.status(500).json({ error: "Failed to fetch clauses" });
    }
  });

  app.get("/api/clauses/:id", async (req: Request, res: Response) => {
    try {
      const clause = await storage.getClauseTemplate(req.params.id);
      if (!clause) {
        return res.status(404).json({ error: "Clause not found" });
      }
      res.json(clause);
    } catch (error) {
      console.error("Error fetching clause:", error);
      res.status(500).json({ error: "Failed to fetch clause" });
    }
  });

  app.post("/api/clauses", async (req: Request, res: Response) => {
    try {
      const validated = insertClauseTemplateSchema.parse(req.body);
      const clause = await storage.createClauseTemplate(validated);
      res.status(201).json(clause);
    } catch (error) {
      console.error("Error creating clause:", error);
      res.status(400).json({ error: fromError(error).toString() });
    }
  });

  app.patch("/api/clauses/:id", async (req: Request, res: Response) => {
    try {
      const clause = await storage.updateClauseTemplate(req.params.id, req.body);
      if (!clause) {
        return res.status(404).json({ error: "Clause not found" });
      }
      res.json(clause);
    } catch (error) {
      console.error("Error updating clause:", error);
      res.status(500).json({ error: "Failed to update clause" });
    }
  });

  app.delete("/api/clauses/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteClauseTemplate(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting clause:", error);
      res.status(500).json({ error: "Failed to delete clause" });
    }
  });

  // ===== AI CLAUSE SUGGESTIONS =====
  app.post("/api/clauses/suggest", async (req: Request, res: Response) => {
    try {
      const { context, currentSection } = req.body;
      
      // Get all active clauses
      const allClauses = await storage.getClauseTemplates({ status: "active" });
      
      // Use AI to recommend relevant clauses
      const prompt = `You are an expert legal contract analyst for dialysis services. Given the following context, recommend the top 3 most relevant clause templates from the library.

Contract Context:
- Payor: ${context.payorName || 'Unknown'}
- Payor Type: ${context.payorType || 'Unknown'}
- Jurisdiction: ${context.jurisdiction || 'Unknown'}
- Current Section: ${currentSection || 'Unknown'}

Available Clauses:
${allClauses.slice(0, 20).map(c => `- ${c.clauseCode}: ${c.clauseTitle}`).join('\n')}

Return JSON array with top 3 recommendations in this format:
[
  {
    "clauseCode": "ESRD-BUNDLE-145",
    "score": 92,
    "rationale": "Brief explanation why this matches"
  }
]`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_completion_tokens: 500,
      });

      const result = JSON.parse(response.choices[0]?.message?.content || "{}");
      const recommendations = result.recommendations || [];
      
      // Enrich with full clause data
      const enriched = await Promise.all(
        recommendations.map(async (rec: any) => {
          const clause = await storage.getClauseTemplateByCode(rec.clauseCode);
          return {
            ...rec,
            clause: clause || null,
          };
        })
      );

      res.json(enriched);
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      res.status(500).json({ error: "Failed to get AI suggestions" });
    }
  });

  // ===== CONTRACTS =====
  app.get("/api/contracts", async (req: Request, res: Response) => {
    try {
      const { status, payorId } = req.query;
      const filters = {
        status: status as string | undefined,
        payorId: payorId as string | undefined,
      };
      const contracts = await storage.getContracts(filters);
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      res.status(500).json({ error: "Failed to fetch contracts" });
    }
  });

  app.get("/api/contracts/:id", async (req: Request, res: Response) => {
    try {
      const contract = await storage.getContract(req.params.id);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      const clauses = await storage.getContractClauses(req.params.id);
      res.json({ ...contract, clauses });
    } catch (error) {
      console.error("Error fetching contract:", error);
      res.status(500).json({ error: "Failed to fetch contract" });
    }
  });

  app.post("/api/contracts", async (req: Request, res: Response) => {
    try {
      const validated = insertContractSchema.parse(req.body);
      const contract = await storage.createContract(validated);
      res.status(201).json(contract);
    } catch (error) {
      console.error("Error creating contract:", error);
      res.status(400).json({ error: fromError(error).toString() });
    }
  });

  app.patch("/api/contracts/:id", async (req: Request, res: Response) => {
    try {
      const contract = await storage.updateContract(req.params.id, req.body);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      console.error("Error updating contract:", error);
      res.status(500).json({ error: "Failed to update contract" });
    }
  });

  app.delete("/api/contracts/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteContract(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting contract:", error);
      res.status(500).json({ error: "Failed to delete contract" });
    }
  });

  // ===== CONTRACT CLAUSES =====
  app.put("/api/contracts/:id/clauses", async (req: Request, res: Response) => {
    try {
      const { clauses } = req.body;
      if (!Array.isArray(clauses)) {
        return res.status(400).json({ error: "clauses must be an array" });
      }
      
      const savedClauses = await storage.saveContractClauses(req.params.id, clauses);
      res.json(savedClauses);
    } catch (error) {
      console.error("Error saving contract clauses:", error);
      res.status(500).json({ error: "Failed to save contract clauses" });
    }
  });

  // Save entire contract with clauses (transactional)
  app.post("/api/contracts/draft", async (req: Request, res: Response) => {
    try {
      const { contract, clauses } = req.body;
      
      // Generate contract number if not provided
      if (!contract.contractNumber) {
        contract.contractNumber = `C-${Date.now()}`;
      }
      
      // Create or update contract
      let savedContract;
      if (contract.id) {
        savedContract = await storage.updateContract(contract.id, contract);
      } else {
        const validated = insertContractSchema.parse(contract);
        savedContract = await storage.createContract(validated);
      }
      
      if (!savedContract) {
        return res.status(500).json({ error: "Failed to save contract" });
      }
      
      // Save clauses
      const savedClauses = await storage.saveContractClauses(savedContract.id, clauses || []);
      
      res.json({ contract: savedContract, clauses: savedClauses });
    } catch (error) {
      console.error("Error saving draft:", error);
      res.status(400).json({ error: "Failed to save draft" });
    }
  });

  // ===== VARIANCES =====
  app.get("/api/variances", async (req: Request, res: Response) => {
    try {
      const { status, payorId, startDate, endDate } = req.query;
      const filters = {
        status: status as string | undefined,
        payorId: payorId as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      };
      const variances = await storage.getVariances(filters);
      res.json(variances);
    } catch (error) {
      console.error("Error fetching variances:", error);
      res.status(500).json({ error: "Failed to fetch variances" });
    }
  });

  app.get("/api/variances/:id", async (req: Request, res: Response) => {
    try {
      const variance = await storage.getVariance(req.params.id);
      if (!variance) {
        return res.status(404).json({ error: "Variance not found" });
      }
      res.json(variance);
    } catch (error) {
      console.error("Error fetching variance:", error);
      res.status(500).json({ error: "Failed to fetch variance" });
    }
  });

  app.post("/api/variances", async (req: Request, res: Response) => {
    try {
      const validated = insertVarianceSchema.parse(req.body);
      const variance = await storage.createVariance(validated);
      res.status(201).json(variance);
    } catch (error) {
      console.error("Error creating variance:", error);
      res.status(400).json({ error: fromError(error).toString() });
    }
  });

  app.patch("/api/variances/:id", async (req: Request, res: Response) => {
    try {
      const variance = await storage.updateVariance(req.params.id, req.body);
      if (!variance) {
        return res.status(404).json({ error: "Variance not found" });
      }
      res.json(variance);
    } catch (error) {
      console.error("Error updating variance:", error);
      res.status(500).json({ error: "Failed to update variance" });
    }
  });

  // ===== PAYORS =====
  app.get("/api/payors", async (req: Request, res: Response) => {
    try {
      const payors = await storage.getPayors();
      res.json(payors);
    } catch (error) {
      console.error("Error fetching payors:", error);
      res.status(500).json({ error: "Failed to fetch payors" });
    }
  });

  app.post("/api/payors", async (req: Request, res: Response) => {
    try {
      const validated = insertPayorSchema.parse(req.body);
      const payor = await storage.createPayor(validated);
      res.status(201).json(payor);
    } catch (error) {
      console.error("Error creating payor:", error);
      res.status(400).json({ error: fromError(error).toString() });
    }
  });

  return httpServer;
}
