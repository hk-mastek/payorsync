import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import OpenAI from "openai";
import multer from "multer";
import { 
  insertClauseTemplateSchema, 
  insertClauseCategorySchema,
  insertContractSchema,
  insertVarianceSchema,
  insertPayorSchema,
  type ExtractedClause
} from "@shared/schema";
import { fromError } from "zod-validation-error";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

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

  // ===== CONTRACT PDF UPLOAD =====
  app.post("/api/contracts/upload-pdf", upload.single("pdf"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No PDF file provided" });
      }

      // Create upload record with pending status
      const uploadRecord = await storage.createContractUpload({
        fileName: req.file.originalname,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        status: "processing",
      });

      // Extract text from PDF using dynamic import
      let extractedText = "";
      try {
        const pdfModule = await import("pdf-parse");
        const PDFParse = pdfModule.PDFParse;
        // Convert Buffer to Uint8Array as required by pdf-parse
        const uint8Array = new Uint8Array(req.file.buffer);
        const parser = new PDFParse(uint8Array);
        await parser.load();
        const info = await parser.getInfo();
        const pageCount = info.pages || 0;
        // Extract text from all pages
        const textPromises = [];
        for (let i = 0; i < pageCount; i++) {
          textPromises.push(parser.getPageText(i));
        }
        const pageTexts = await Promise.all(textPromises);
        extractedText = pageTexts.join("\n\n");
      } catch (pdfError) {
        console.error("PDF parsing error:", pdfError);
        await storage.updateContractUpload(uploadRecord.id, {
          status: "failed",
          processingError: "Failed to parse PDF file",
        });
        return res.status(400).json({ error: "Failed to parse PDF file" });
      }

      // Use AI to extract clauses from the text
      const prompt = `You are a legal contract analyst specializing in healthcare payor contracts. Analyze the following contract text and extract all distinct clauses. For each clause, identify:
1. A short descriptive title
2. The full clause text
3. A likely category (e.g., "Reimbursement", "Timely Filing", "Termination", "Definitions", "Compliance", "Appeals", "Authorization")
4. Any variables or placeholders in the clause (amounts, dates, percentages)
5. Brief rationale for why this clause is important

Return a JSON object with an array of clauses in this exact format:
{
  "clauses": [
    {
      "id": "clause-1",
      "title": "Clause Title",
      "text": "Full clause text...",
      "categoryGuess": "Category Name",
      "rationale": "Why this clause matters",
      "variables": ["$500", "30 days"]
    }
  ]
}

CONTRACT TEXT:
${extractedText.substring(0, 30000)}`; // Limit text to avoid token limits

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-5.1",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          max_completion_tokens: 4000,
        });

        const result = JSON.parse(response.choices[0]?.message?.content || "{}");
        const extractedClauses: ExtractedClause[] = (result.clauses || []).map((c: any, i: number) => ({
          id: c.id || `clause-${i + 1}`,
          title: c.title || `Clause ${i + 1}`,
          text: c.text || "",
          categoryGuess: c.categoryGuess,
          rationale: c.rationale,
          variables: c.variables || [],
        }));

        // Update the upload record with extracted clauses
        const updated = await storage.updateContractUpload(uploadRecord.id, {
          extractedText,
          extractedClauses,
          status: "completed",
        });

        res.json(updated);
      } catch (aiError) {
        console.error("AI extraction error:", aiError);
        await storage.updateContractUpload(uploadRecord.id, {
          extractedText,
          status: "failed",
          processingError: "Failed to extract clauses using AI",
        });
        return res.status(500).json({ error: "Failed to extract clauses using AI" });
      }
    } catch (error) {
      console.error("Error uploading PDF:", error);
      res.status(500).json({ error: "Failed to process PDF upload" });
    }
  });

  // Get contract upload by ID
  app.get("/api/contract-uploads/:id", async (req: Request, res: Response) => {
    try {
      const upload = await storage.getContractUpload(req.params.id);
      if (!upload) {
        return res.status(404).json({ error: "Upload not found" });
      }
      res.json(upload);
    } catch (error) {
      console.error("Error fetching upload:", error);
      res.status(500).json({ error: "Failed to fetch upload" });
    }
  });

  // Update clause decisions (Accept/Negotiate)
  app.patch("/api/contract-uploads/:id/decisions", async (req: Request, res: Response) => {
    try {
      const { clauseDecisions } = req.body;
      const updated = await storage.updateContractUpload(req.params.id, {
        clauseDecisions,
      });
      if (!updated) {
        return res.status(404).json({ error: "Upload not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating decisions:", error);
      res.status(500).json({ error: "Failed to update decisions" });
    }
  });

  // Add accepted clauses to library
  app.post("/api/contract-uploads/:id/add-to-library", async (req: Request, res: Response) => {
    try {
      const upload = await storage.getContractUpload(req.params.id);
      if (!upload) {
        return res.status(404).json({ error: "Upload not found" });
      }

      const { clauseIds } = req.body;
      const extractedClauses = upload.extractedClauses || [];
      const clausesToAdd = extractedClauses.filter((c: ExtractedClause) => clauseIds.includes(c.id));

      const addedClauses = [];
      for (const clause of clausesToAdd) {
        // Generate a unique clause code
        const clauseCode = `PDF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        
        const newClause = await storage.createClauseTemplate({
          clauseCode,
          clauseTitle: clause.title,
          clauseText: clause.text,
          clauseVersion: "1.0.0",
          status: "draft",
          tags: ["imported", "pdf-upload"],
        });
        addedClauses.push(newClause);
      }

      res.json({ added: addedClauses.length, clauses: addedClauses });
    } catch (error) {
      console.error("Error adding to library:", error);
      res.status(500).json({ error: "Failed to add clauses to library" });
    }
  });

  // Generate negotiation letter for negotiate clauses
  app.post("/api/contract-uploads/:id/negotiation-letter", async (req: Request, res: Response) => {
    try {
      const upload = await storage.getContractUpload(req.params.id);
      if (!upload) {
        return res.status(404).json({ error: "Upload not found" });
      }

      const { clauseIds } = req.body;
      const extractedClauses = upload.extractedClauses || [];
      const clausesToNegotiate = extractedClauses.filter((c: ExtractedClause) => clauseIds.includes(c.id));

      if (clausesToNegotiate.length === 0) {
        return res.status(400).json({ error: "No clauses selected for negotiation" });
      }

      const clauseDetails = clausesToNegotiate.map((c: ExtractedClause, i: number) => 
        `${i + 1}. ${c.title}\n   Current Text: "${c.text.substring(0, 300)}..."\n   Concern: ${c.rationale || "Standard negotiation point"}`
      ).join("\n\n");

      const prompt = `You are a healthcare revenue cycle manager drafting a professional negotiation letter to a payor regarding contract terms. Write a formal business letter requesting reconsideration of the following contract clauses.

The letter should:
1. Be professional and courteous
2. Clearly identify each clause being negotiated
3. Explain why each clause is problematic from the provider's perspective
4. Propose reasonable alternatives
5. Request a meeting or call to discuss

CLAUSES TO NEGOTIATE:
${clauseDetails}

Write the complete letter in professional business format.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 2000,
      });

      const letter = response.choices[0]?.message?.content || "";

      // Save the letter to the upload record
      await storage.updateContractUpload(upload.id, {
        negotiationLetter: letter,
      });

      res.json({ letter });
    } catch (error) {
      console.error("Error generating letter:", error);
      res.status(500).json({ error: "Failed to generate negotiation letter" });
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

  // ===== GLOBAL SEARCH =====
  app.get("/api/search", async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      const query = (q as string || "").toLowerCase().trim();
      
      if (!query || query.length < 2) {
        return res.json({ contracts: [], variances: [], clauses: [] });
      }

      // Levenshtein distance for fuzzy matching with typo tolerance
      const levenshteinDistance = (a: string, b: string): number => {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        const matrix: number[][] = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
          for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
              matrix[i][j] = matrix[i - 1][j - 1];
            } else {
              matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
          }
        }
        return matrix[b.length][a.length];
      };

      // Fuzzy search helper - matches substrings, partial matches, and typos
      const fuzzyMatch = (text: string, searchQuery: string): { match: boolean; score: number } => {
        const normalizedText = text.toLowerCase();
        const terms = searchQuery.split(/\s+/).filter(t => t.length > 0);
        let totalScore = 0;
        
        for (const term of terms) {
          // Exact substring match
          if (normalizedText.includes(term)) {
            totalScore += 100;
            continue;
          }
          // Check each word in text for fuzzy match
          const words = normalizedText.split(/\s+/);
          let bestWordScore = 0;
          for (const word of words) {
            // Prefix match (typing "blu" matches "bluecross")
            if (word.startsWith(term) || term.startsWith(word.substring(0, Math.min(word.length, term.length)))) {
              bestWordScore = Math.max(bestWordScore, 80);
              continue;
            }
            // Levenshtein distance for typo tolerance (allow 1-2 char errors for short terms)
            const maxDistance = term.length <= 3 ? 1 : term.length <= 6 ? 2 : 3;
            const distance = levenshteinDistance(term, word.substring(0, Math.min(word.length, term.length + maxDistance)));
            if (distance <= maxDistance) {
              bestWordScore = Math.max(bestWordScore, 60 - distance * 10);
            }
          }
          if (bestWordScore === 0) return { match: false, score: 0 };
          totalScore += bestWordScore;
        }
        return { match: true, score: totalScore / terms.length };
      };

      // Search contracts with scoring
      const allContracts = await storage.getContracts({});
      const scoredContracts = allContracts.map(c => {
        const nameMatch = fuzzyMatch(c.contractName || "", query);
        const numberMatch = fuzzyMatch(c.contractNumber || "", query);
        const payorMatch = fuzzyMatch(c.payorName || "", query);
        const jurisdictionMatch = fuzzyMatch(c.jurisdiction || "", query);
        const bestScore = Math.max(
          nameMatch.match ? nameMatch.score : 0,
          numberMatch.match ? numberMatch.score : 0,
          payorMatch.match ? payorMatch.score : 0,
          jurisdictionMatch.match ? jurisdictionMatch.score : 0
        );
        return { contract: c, score: bestScore };
      }).filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      const matchedContracts = scoredContracts.map(({ contract: c }) => ({
        id: c.id,
        type: "contract",
        title: c.contractName,
        subtitle: `${c.contractNumber} • ${c.payorName || ""} • ${c.jurisdiction || ""}`,
        status: c.contractStatus,
        url: `/drafter/${c.id}`
      }));

      // Search variances with scoring
      const allVariances = await storage.getVariances({});
      const scoredVariances = allVariances.map(v => {
        const codeMatch = fuzzyMatch(v.varianceCode || "", query);
        const patientIdMatch = fuzzyMatch(v.patientId || "", query);
        const patientNameMatch = fuzzyMatch(v.patientName || "", query);
        const payorMatch = fuzzyMatch(v.payorName || "", query);
        const claimMatch = fuzzyMatch(v.claimNumber || "", query);
        const bestScore = Math.max(
          codeMatch.match ? codeMatch.score : 0,
          patientIdMatch.match ? patientIdMatch.score : 0,
          patientNameMatch.match ? patientNameMatch.score : 0,
          payorMatch.match ? payorMatch.score : 0,
          claimMatch.match ? claimMatch.score : 0
        );
        return { variance: v, score: bestScore };
      }).filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      const matchedVariances = scoredVariances.map(({ variance: v }) => ({
        id: v.id,
        type: "variance",
        title: v.varianceCode,
        subtitle: `${v.patientName || v.patientId || ""} • ${v.payorName || ""} • $${v.varianceAmount?.toFixed(2) || "0.00"}`,
        status: v.status,
        url: `/variances`
      }));

      // Search clauses with scoring
      const allClauses = await storage.getClauseTemplates({});
      const scoredClauses = allClauses.map(c => {
        const titleMatch = fuzzyMatch(c.clauseTitle || "", query);
        const codeMatch = fuzzyMatch(c.clauseCode || "", query);
        const textMatch = fuzzyMatch((c.clauseText || "").substring(0, 200), query); // Limit text search
        const bestScore = Math.max(
          titleMatch.match ? titleMatch.score : 0,
          codeMatch.match ? codeMatch.score : 0,
          textMatch.match ? textMatch.score : 0
        );
        return { clause: c, score: bestScore };
      }).filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      const matchedClauses = scoredClauses.map(({ clause: c }) => ({
        id: c.id,
        type: "clause",
        title: c.clauseTitle,
        subtitle: c.clauseCode,
        status: c.status,
        url: `/clause-library`
      }));

      res.json({
        contracts: matchedContracts,
        variances: matchedVariances,
        clauses: matchedClauses,
        total: matchedContracts.length + matchedVariances.length + matchedClauses.length
      });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Search failed" });
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
