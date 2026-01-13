import { db } from "./db";
import { clauseCategories, clauseTemplates, payors } from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding database...");

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
  ]).returning();

  console.log(`✅ Created ${payorData.length} payors`);
  console.log("✅ Database seeding complete!");
}

seed()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
