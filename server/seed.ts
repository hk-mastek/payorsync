import { db } from "./db";
import { clauseCategories, clauseTemplates, payors, contracts, contractClauses } from "@shared/schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");
  
  // Clear existing data (in reverse order of dependencies)
  console.log("🧹 Clearing existing data...");
  await db.delete(contractClauses);
  await db.delete(contracts);
  await db.delete(clauseTemplates);
  await db.delete(clauseCategories);
  await db.delete(payors);

  // Seed Clause Categories
  const categories = await db.insert(clauseCategories).values([
    {
      categoryName: "Reimbursement Methodology",
      description: "Clauses defining payment rates and methodologies",
      displayOrder: 1,
    },
    {
      categoryName: "Timely Filing & Appeals",
      description: "Claims submission deadlines and appeal procedures",
      displayOrder: 2,
    },
    {
      categoryName: "Utilization Management",
      description: "Prior authorization and medical necessity requirements",
      displayOrder: 3,
    },
    {
      categoryName: "Termination & Renewal",
      description: "Contract termination provisions and renewal terms",
      displayOrder: 4,
    },
    {
      categoryName: "Definitions",
      description: "Standard terminology and definitions",
      displayOrder: 5,
    },
    {
      categoryName: "Regulatory Compliance",
      description: "Federal and state regulatory requirements",
      displayOrder: 6,
    },
  ]).returning();

  console.log(`✅ Created ${categories.length} categories`);

  // Find category IDs
  const reimbursementCat = categories.find(c => c.categoryName === "Reimbursement Methodology");
  const timelyFilingCat = categories.find(c => c.categoryName === "Timely Filing & Appeals");
  const definitionsCat = categories.find(c => c.categoryName === "Definitions");

  // Seed Clause Templates
  const clauses = await db.insert(clauseTemplates).values([
    {
      clauseCode: "ESRD-BUNDLE-145",
      clauseTitle: "ESRD Bundled Payment Rate (Commercial)",
      clauseText: `Provider shall be reimbursed for Dialysis Services at a bundled rate of {{REIMBURSEMENT_RATE}} per treatment. This rate includes all standard dialysis services, labs, and supplies necessary for the treatment. The bundled rate applies to all in-center hemodialysis treatments provided to Members with End-Stage Renal Disease (ESRD).`,
      clauseVersion: "2.1.0",
      categoryId: reimbursementCat?.id,
      payorTypes: ["commercial", "medicare_advantage"],
      jurisdictions: ["federal", "CA", "TX", "FL"],
      serviceTypes: ["dialysis"],
      status: "active",
      tags: ["bundled_payment", "esrd", "hemodialysis"],
      regulatoryReferences: ["42 CFR 405", "Medicare Manual Chapter 8"],
    },
    {
      clauseCode: "TF-180-STD",
      clauseTitle: "Timely Filing Limit - 180 Days",
      clauseText: `Claims must be submitted within one hundred eighty (180) days from the date of service. Claims submitted after this period shall be denied with no subscriber liability unless Provider can demonstrate good cause for late filing as determined by Payor in its sole discretion.`,
      clauseVersion: "1.5.0",
      categoryId: timelyFilingCat?.id,
      payorTypes: ["commercial", "managed_medicaid"],
      jurisdictions: ["CA", "TX"],
      serviceTypes: ["dialysis", "pharmacy"],
      status: "active",
      tags: ["timely_filing", "administrative"],
      complianceNotes: "Standard industry practice for commercial payors",
    },
    {
      clauseCode: "TRN-ADD-50",
      clauseTitle: "Training Add-on Reimbursement",
      clauseText: `Provider shall be reimbursed an additional {{TRAINING_FEE}} per session for home dialysis training services provided to Member. Training reimbursement is limited to the first {{MAX_TRAINING_SESSIONS}} sessions per Member per training period. Training must be documented in accordance with ESRD conditions of coverage.`,
      clauseVersion: "1.0.0",
      categoryId: reimbursementCat?.id,
      payorTypes: ["commercial", "medicare_advantage"],
      jurisdictions: ["federal"],
      serviceTypes: ["dialysis"],
      status: "active",
      tags: ["home_dialysis", "training", "add_on"],
      regulatoryReferences: ["42 CFR 494"],
    },
    {
      clauseCode: "SL-HIGH-10K",
      clauseTitle: "Stop-Loss Threshold (High Acuity)",
      clauseText: `For claims exceeding {{STOP_LOSS_THRESHOLD}} in total billed charges during a single treatment session, Provider shall be reimbursed at {{PERCENTAGE_OF_CHARGES}} percent of billed charges in accordance with Payor's fee schedule. This provision applies to high-acuity cases requiring extraordinary interventions as documented by Provider.`,
      clauseVersion: "1.2.0",
      categoryId: reimbursementCat?.id,
      payorTypes: ["commercial"],
      jurisdictions: ["CA", "TX", "FL"],
      serviceTypes: ["dialysis"],
      status: "active",
      tags: ["stop_loss", "high_acuity", "outlier"],
    },
    {
      clauseCode: "DEF-MED-NEC",
      clauseTitle: "Definition: Medically Necessary",
      clauseText: `"Medically Necessary" or "Medical Necessity" means health care services or supplies needed to diagnose or treat an illness, injury, condition, disease or its symptoms and that meet accepted standards of medicine. Services must be: (a) consistent with the diagnosis and customary medical treatment; (b) required for reasons other than the convenience of the Member or Provider; and (c) the most appropriate supply or level of service that can safely be provided.`,
      clauseVersion: "3.0.0",
      categoryId: definitionsCat?.id,
      payorTypes: ["commercial", "medicare_advantage", "managed_medicaid"],
      jurisdictions: ["federal", "CA", "TX", "FL", "NY"],
      serviceTypes: ["dialysis", "pharmacy", "physician"],
      status: "active",
      tags: ["definition", "medical_necessity"],
    },
    {
      clauseCode: "APPEAL-2TIER",
      clauseTitle: "Two-Tier Appeal Process",
      clauseText: `Provider may appeal any denial or reduction of payment by submitting a written appeal to Payor within {{APPEAL_DAYS}} days of the adverse determination. Payor shall conduct a first-level review within 30 days. If Provider is not satisfied with the first-level decision, Provider may request a second-level review within 30 days of the first-level decision. The second-level review shall be conducted by personnel not involved in the initial determination.`,
      clauseVersion: "1.8.0",
      categoryId: timelyFilingCat?.id,
      payorTypes: ["commercial", "managed_medicaid"],
      jurisdictions: ["CA", "TX"],
      serviceTypes: ["dialysis"],
      status: "active",
      tags: ["appeals", "dispute_resolution"],
      complianceNotes: "Meets California Department of Managed Health Care requirements",
    },
  ]).returning();

  console.log(`✅ Created ${clauses.length} clause templates`);

  // Seed Payors
  const payorData = await db.insert(payors).values([
    {
      payorName: "BlueCross BlueShield of California",
      payorCode: "BCBS-CA",
      payorType: "commercial",
      headquartersState: "CA",
      operatingStates: ["CA", "NV", "AZ"],
      contactInfo: { phone: "1-800-555-0100", email: "provider@bcbsca.com" },
    },
    {
      payorName: "Anthem Blue Cross",
      payorCode: "ANTHEM-CA",
      payorType: "commercial",
      headquartersState: "CA",
      operatingStates: ["CA"],
      contactInfo: { phone: "1-800-555-0200", email: "provider@anthem.com" },
    },
    {
      payorName: "UnitedHealthcare Community Plan",
      payorCode: "UHC-MED",
      payorType: "managed_medicaid",
      headquartersState: "CA",
      operatingStates: ["CA", "TX", "FL"],
      contactInfo: { phone: "1-800-555-0300", email: "provider@uhc.com" },
    },
    {
      payorName: "Aetna",
      payorCode: "AETNA",
      payorType: "commercial",
      headquartersState: "CT",
      operatingStates: ["CT", "NY", "NJ", "PA"],
      contactInfo: { phone: "1-800-555-0400", email: "provider@aetna.com" },
    },
    {
      payorName: "Cigna HealthCare",
      payorCode: "CIGNA",
      payorType: "commercial",
      headquartersState: "CT",
      operatingStates: ["CT", "TX", "FL", "GA"],
      contactInfo: { phone: "1-800-555-0500", email: "provider@cigna.com" },
    },
    {
      payorName: "Humana",
      payorCode: "HUMANA",
      payorType: "medicare_advantage",
      headquartersState: "KY",
      operatingStates: ["KY", "FL", "TX", "OH"],
      contactInfo: { phone: "1-800-555-0600", email: "provider@humana.com" },
    },
    {
      payorName: "Kaiser Permanente",
      payorCode: "KAISER",
      payorType: "commercial",
      headquartersState: "CA",
      operatingStates: ["CA", "OR", "WA", "CO"],
      contactInfo: { phone: "1-800-555-0700", email: "provider@kaiserpermanente.org" },
    },
    {
      payorName: "Molina Healthcare",
      payorCode: "MOLINA",
      payorType: "managed_medicaid",
      headquartersState: "CA",
      operatingStates: ["CA", "TX", "WA", "OH", "MI"],
      contactInfo: { phone: "1-800-555-0800", email: "provider@molinahealthcare.com" },
    },
    {
      payorName: "Florida Blue",
      payorCode: "FL-BLUE",
      payorType: "commercial",
      headquartersState: "FL",
      operatingStates: ["FL"],
      contactInfo: { phone: "1-800-555-0900", email: "provider@floridablue.com" },
    },
    {
      payorName: "BlueCross BlueShield of Texas",
      payorCode: "BCBS-TX",
      payorType: "commercial",
      headquartersState: "TX",
      operatingStates: ["TX"],
      contactInfo: { phone: "1-800-555-1000", email: "provider@bcbstx.com" },
    },
  ]).returning();

  console.log(`✅ Created ${payorData.length} payors`);

  // Seed 13 Contracts across various states and payors
  const contractsData = await db.insert(contracts).values([
    {
      contractNumber: "C-2024-BCBS-CA-001",
      contractName: "BlueCross Shield California 2024",
      payorId: payorData.find(p => p.payorCode === "BCBS-CA")?.id,
      payorName: "BlueCross BlueShield of California",
      payorType: "commercial",
      jurisdiction: "California",
      contractStatus: "active",
      effectiveDate: "2024-01-01",
      terminationDate: "2026-12-31",
      renewalTerms: "Auto-renews annually unless terminated with 90-day notice",
    },
    {
      contractNumber: "C-2024-ANTHEM-001",
      contractName: "Anthem Blue Cross PPO Agreement",
      payorId: payorData.find(p => p.payorCode === "ANTHEM-CA")?.id,
      payorName: "Anthem Blue Cross",
      payorType: "commercial",
      jurisdiction: "California",
      contractStatus: "negotiation",
      effectiveDate: "2024-06-01",
      terminationDate: "2027-05-31",
    },
    {
      contractNumber: "C-2024-UHC-TX-001",
      contractName: "UnitedHealthcare Texas Medicaid",
      payorId: payorData.find(p => p.payorCode === "UHC-MED")?.id,
      payorName: "UnitedHealthcare Community Plan",
      payorType: "managed_medicaid",
      jurisdiction: "Texas",
      contractStatus: "active",
      effectiveDate: "2024-01-01",
      terminationDate: "2025-12-31",
    },
    {
      contractNumber: "C-2024-AETNA-NY-001",
      contractName: "Aetna New York Commercial",
      payorId: payorData.find(p => p.payorCode === "AETNA")?.id,
      payorName: "Aetna",
      payorType: "commercial",
      jurisdiction: "New York",
      contractStatus: "draft",
      effectiveDate: "2025-01-01",
      terminationDate: "2027-12-31",
    },
    {
      contractNumber: "C-2024-CIGNA-FL-001",
      contractName: "Cigna Florida Dialysis Services",
      payorId: payorData.find(p => p.payorCode === "CIGNA")?.id,
      payorName: "Cigna HealthCare",
      payorType: "commercial",
      jurisdiction: "Florida",
      contractStatus: "active",
      effectiveDate: "2023-07-01",
      terminationDate: "2025-06-30",
      renewalTerms: "Requires 60-day renewal notice",
    },
    {
      contractNumber: "C-2024-HUMANA-KY-001",
      contractName: "Humana Kentucky Medicare Advantage",
      payorId: payorData.find(p => p.payorCode === "HUMANA")?.id,
      payorName: "Humana",
      payorType: "medicare_advantage",
      jurisdiction: "Kentucky",
      contractStatus: "active",
      effectiveDate: "2024-01-01",
      terminationDate: "2026-12-31",
    },
    {
      contractNumber: "C-2024-KAISER-OR-001",
      contractName: "Kaiser Permanente Oregon",
      payorId: payorData.find(p => p.payorCode === "KAISER")?.id,
      payorName: "Kaiser Permanente",
      payorType: "commercial",
      jurisdiction: "Oregon",
      contractStatus: "negotiation",
      effectiveDate: "2025-01-01",
      terminationDate: "2027-12-31",
    },
    {
      contractNumber: "C-2024-MOLINA-OH-001",
      contractName: "Molina Ohio Medicaid",
      payorId: payorData.find(p => p.payorCode === "MOLINA")?.id,
      payorName: "Molina Healthcare",
      payorType: "managed_medicaid",
      jurisdiction: "Ohio",
      contractStatus: "active",
      effectiveDate: "2024-03-01",
      terminationDate: "2026-02-28",
    },
    {
      contractNumber: "C-2024-FLBLUE-001",
      contractName: "Florida Blue Statewide Agreement",
      payorId: payorData.find(p => p.payorCode === "FL-BLUE")?.id,
      payorName: "Florida Blue",
      payorType: "commercial",
      jurisdiction: "Florida",
      contractStatus: "active",
      effectiveDate: "2024-01-01",
      terminationDate: "2026-12-31",
      renewalTerms: "3-year term with annual rate adjustments",
    },
    {
      contractNumber: "C-2024-BCBS-TX-001",
      contractName: "BlueCross BlueShield Texas",
      payorId: payorData.find(p => p.payorCode === "BCBS-TX")?.id,
      payorName: "BlueCross BlueShield of Texas",
      payorType: "commercial",
      jurisdiction: "Texas",
      contractStatus: "active",
      effectiveDate: "2023-01-01",
      terminationDate: "2025-12-31",
    },
    {
      contractNumber: "C-2024-HUMANA-FL-001",
      contractName: "Humana Florida Medicare Advantage",
      payorId: payorData.find(p => p.payorCode === "HUMANA")?.id,
      payorName: "Humana",
      payorType: "medicare_advantage",
      jurisdiction: "Florida",
      contractStatus: "draft",
      effectiveDate: "2025-01-01",
      terminationDate: "2027-12-31",
    },
    {
      contractNumber: "C-2024-CIGNA-GA-001",
      contractName: "Cigna Georgia Regional",
      payorId: payorData.find(p => p.payorCode === "CIGNA")?.id,
      payorName: "Cigna HealthCare",
      payorType: "commercial",
      jurisdiction: "Georgia",
      contractStatus: "negotiation",
      effectiveDate: "2025-03-01",
      terminationDate: "2028-02-28",
    },
    {
      contractNumber: "C-2024-MOLINA-MI-001",
      contractName: "Molina Michigan Medicaid",
      payorId: payorData.find(p => p.payorCode === "MOLINA")?.id,
      payorName: "Molina Healthcare",
      payorType: "managed_medicaid",
      jurisdiction: "Michigan",
      contractStatus: "active",
      effectiveDate: "2024-01-01",
      terminationDate: "2025-12-31",
      renewalTerms: "State contract renewable annually",
    },
  ]).returning();

  console.log(`✅ Created ${contractsData.length} contracts`);

  // Add clauses to each contract
  const clauseAssignments = [];
  
  for (const contract of contractsData) {
    // Assign 3-5 relevant clauses to each contract
    const numClauses = 3 + Math.floor(Math.random() * 3);
    const selectedClauses = clauses.slice(0, numClauses);
    
    for (let i = 0; i < selectedClauses.length; i++) {
      const clause = selectedClauses[i];
      clauseAssignments.push({
        contractId: contract.id,
        clauseTemplateId: clause.id,
        clauseCode: clause.clauseCode,
        clauseTitle: clause.clauseTitle,
        sectionName: categories.find(c => c.id === clause.categoryId)?.categoryName || "General",
        displayOrder: i,
        clauseText: clause.clauseText,
        variableValues: getDefaultVariables(clause.clauseCode),
        status: "active",
      });
    }
  }

  const savedClauses = await db.insert(contractClauses).values(clauseAssignments).returning();
  console.log(`✅ Added ${savedClauses.length} clauses to contracts`);

  console.log("✅ Database seeding complete!");
}

function getDefaultVariables(clauseCode: string): Record<string, string> {
  switch (clauseCode) {
    case "ESRD-BUNDLE-145":
      return { REIMBURSEMENT_RATE: "$285.00" };
    case "TRN-ADD-50":
      return { TRAINING_FEE: "$45.00", MAX_TRAINING_SESSIONS: "25" };
    case "SL-HIGH-10K":
      return { STOP_LOSS_THRESHOLD: "$10,000", PERCENTAGE_OF_CHARGES: "80" };
    case "APPEAL-2TIER":
      return { APPEAL_DAYS: "60" };
    default:
      return {};
  }
}

seed()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
