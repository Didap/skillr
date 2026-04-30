import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "./index";
import { users, professionalProfiles, companyProfiles, jobs, matches, proposedSlots } from "./schema";
import { seedMetadata } from "./seed-metadata";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Starting seed...");

  // 1. Seed Metadata (Clusters & Skills)
  await seedMetadata();

  const hashedPassword = await bcrypt.hash("password123", 10);

  // 2. Create Professionals
  console.log("Creating professionals...");
  const professionals = [
    {
      name: "Mario Rossi",
      email: "mario.rossi@example.com",
      profile: {
        firstName: "Mario",
        lastName: "Rossi",
        title: "Senior Fullstack Developer",
        photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
        city: "Milano",
        remoteOk: true,
        yearsExperience: 8,
        rateType: "hourly" as const,
        rateAmountEur: 55,
        bioShort: "Appassionato di React, Next.js e architetture scalabili.",
        bioLong: "Sviluppatore con oltre 8 anni di esperienza nella creazione di applicazioni web moderne. Esperto in TypeScript, Node.js e cloud computing.",
        topSkills: ["react", "next-js", "typescript", "node-js"],
        clusters: ["developer"],
      }
    },
    {
      name: "Giulia Bianchi",
      email: "giulia.bianchi@example.com",
      profile: {
        firstName: "Giulia",
        lastName: "Bianchi",
        title: "Product Designer",
        photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
        city: "Roma",
        remoteOk: true,
        yearsExperience: 5,
        rateType: "daily" as const,
        rateAmountEur: 400,
        bioShort: "Creo esperienze digitali intuitive e memorabili.",
        bioLong: "Designer con focus su UI/UX e Design Systems. Ho lavorato con startup e grandi aziende per ridefinire la loro presenza digitale.",
        topSkills: ["figma", "ui-design", "ux-design", "design-systems"],
        clusters: ["designer"],
      }
    },
    {
      name: "Elena Verdi",
      email: "elena.verdi@example.com",
      profile: {
        firstName: "Elena",
        lastName: "Verdi",
        title: "Senior Python & AI Developer",
        photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
        city: "Napoli",
        remoteOk: true,
        yearsExperience: 6,
        rateType: "ral_annual" as const,
        rateAmountEur: 50000,
        bioShort: "Specialista in intelligenza artificiale e data science.",
        bioLong: "Oltre 6 anni di esperienza nello sviluppo di modelli di machine learning e backend scalabili in Python. Contributor open source.",
        topSkills: ["python", "data-analysis", "aws", "docker"],
        clusters: ["developer"],
      }
    },
    {
      name: "Luca Neri",
      email: "luca.neri@example.com",
      profile: {
        firstName: "Luca",
        lastName: "Neri",
        title: "Marketing Manager",
        photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
        city: "Milano",
        remoteOk: true,
        yearsExperience: 10,
        rateType: "ral_annual" as const,
        rateAmountEur: 65000,
        bioShort: "Esperto in Growth Hacking e Brand Strategy.",
        bioLong: "Aiuto le aziende a scalare tramite strategie di marketing integrate. Esperto SEO, SEM e performance marketing.",
        topSkills: ["seo", "sem", "growth-hacking", "google-analytics"],
        clusters: ["marketing"],
      }
    },
    {
      name: "Sofia Gialli",
      email: "sofia.gialli@example.com",
      profile: {
        firstName: "Sofia",
        lastName: "Gialli",
        title: "Sales Director",
        photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
        city: "Firenze",
        remoteOk: false,
        yearsExperience: 12,
        rateType: "ral_annual" as const,
        rateAmountEur: 80000,
        bioShort: "Costruisco e gestisco team di vendita ad alte prestazioni.",
        bioLong: "Specializzata in B2B Sales e Account Management internazionale. Passione per la negoziazione e lo sviluppo del business.",
        topSkills: ["lead-generation", "b2b-sales", "negotiation", "crm-management"],
        clusters: ["sales"],
      }
    }
  ];

  const profIds: string[] = [];

  for (const p of professionals) {
    const [user] = await db.insert(users).values({
      name: p.name,
      email: p.email,
      password: hashedPassword,
      role: "professional",
    }).onConflictDoUpdate({
      target: users.email,
      set: { name: p.name }
    }).returning();

    await db.insert(professionalProfiles).values({
      userId: user.id,
      ...p.profile
    }).onConflictDoUpdate({
      target: professionalProfiles.userId,
      set: p.profile
    });
    
    profIds.push(user.id);
  }

  // 3. Create Companies
  console.log("Creating companies...");
  const companies = [
    {
      name: "Tech Solutions SRL",
      email: "hr@techsolutions.it",
      profile: {
        companyName: "Tech Solutions SRL",
        vatNumber: "01234567890",
        vatDisclaimerAccepted: true,
        city: "Torino",
        industry: "Software House",
        description: "Siamo una software house innovativa specializzata in soluzioni AI e Cloud.",
      }
    },
    {
      name: "Visionary Studio",
      email: "hello@visionary.io",
      profile: {
        companyName: "Visionary Studio",
        vatNumber: "98765432109",
        vatDisclaimerAccepted: true,
        city: "Bologna",
        industry: "Design Agency",
        description: "Un'agenzia creativa che trasforma idee in prodotti digitali straordinari.",
      }
    },
    {
      name: "Moda Hub",
      email: "careers@modahub.it",
      profile: {
        companyName: "Moda Hub",
        vatNumber: "11223344556",
        vatDisclaimerAccepted: true,
        city: "Firenze",
        industry: "E-commerce & Fashion",
        description: "La piattaforma leader in Italia per il retail di lusso e lifestyle.",
      }
    },
    {
      name: "Green Tech",
      email: "jointheteam@greentech.org",
      profile: {
        companyName: "Green Tech",
        vatNumber: "55667788990",
        vatDisclaimerAccepted: true,
        city: "Venezia",
        industry: "Renewable Energy",
        description: "Lavoriamo per un futuro sostenibile tramite tecnologie energetiche pulite.",
      }
    }
  ];

  const compIds: string[] = [];

  for (const c of companies) {
    const [user] = await db.insert(users).values({
      name: c.name,
      email: c.email,
      password: hashedPassword,
      role: "company",
    }).onConflictDoUpdate({
      target: users.email,
      set: { name: c.name }
    }).returning();

    await db.insert(companyProfiles).values({
      userId: user.id,
      ...c.profile
    }).onConflictDoUpdate({
      target: companyProfiles.userId,
      set: c.profile
    });
    
    compIds.push(user.id);
  }

  // 4. Create Jobs
  console.log("Creating jobs...");
  
  const techSolutionsId = compIds[0];
  const visionaryStudioId = compIds[1];
  const modaHubId = compIds[2];
  const greenTechId = compIds[3];

  const jobsData = [
    {
      companyId: techSolutionsId,
      title: "Senior React Developer",
      description: "Cerchiamo un talento React per scalare la nostra piattaforma di core banking.",
      skills: ["react", "next-js", "typescript"],
      budgetMinEur: 45000,
      budgetMaxEur: 60000,
      rateType: "ral_annual" as const,
      location: "Milano / Ibrido",
      remoteOk: true,
    },
    {
      companyId: techSolutionsId,
      title: "Cloud Architect (AWS)",
      description: "Definisci l'infrastruttura cloud per i nostri nuovi progetti AI-driven.",
      skills: ["aws", "docker", "kubernetes"],
      budgetMinEur: 65000,
      budgetMaxEur: 85000,
      rateType: "ral_annual" as const,
      location: "Torino",
      remoteOk: true,
    },
    {
      companyId: techSolutionsId,
      title: "Junior QA Engineer",
      description: "Aiutaci a garantire la massima qualità del codice tramite test automatizzati.",
      skills: ["typescript", "testing", "agile"],
      budgetMinEur: 28000,
      budgetMaxEur: 35000,
      rateType: "ral_annual" as const,
      location: "Torino",
      remoteOk: false,
    },
    {
      companyId: visionaryStudioId,
      title: "Lead UI/UX Designer",
      description: "Responsabile del design system per un nuovo prodotto SaaS internazionale.",
      skills: ["figma", "ui-design", "design-systems"],
      budgetMinEur: 350,
      budgetMaxEur: 500,
      rateType: "daily" as const,
      location: "Bologna",
      remoteOk: false,
    },
    {
      companyId: visionaryStudioId,
      title: "Motion Designer",
      description: "Crea animazioni coinvolgenti per le campagne dei nostri clienti top-tier.",
      skills: ["motion-design", "framer-motion", "adobe-photoshop"],
      budgetMinEur: 300,
      budgetMaxEur: 450,
      rateType: "daily" as const,
      location: "Remoto",
      remoteOk: true,
    },
    {
      companyId: visionaryStudioId,
      title: "Copywriter Creative",
      description: "La tua penna darà voce ai brand più innovativi d'Italia.",
      skills: ["copywriting", "storytelling", "branding"],
      budgetMinEur: 250,
      budgetMaxEur: 350,
      rateType: "daily" as const,
      location: "Bologna / Ibrido",
      remoteOk: true,
    },
    {
      companyId: modaHubId,
      title: "E-commerce Manager",
      description: "Gestione del catalogo e delle strategie di vendita per il mercato luxury.",
      skills: ["seo", "content-marketing", "data-analysis"],
      budgetMinEur: 50000,
      budgetMaxEur: 70000,
      rateType: "ral_annual" as const,
      location: "Firenze",
      remoteOk: true,
    },
    {
      companyId: modaHubId,
      title: "Retail Manager Luxury",
      description: "Ottimizzazione delle performance dei nostri store fisici di alta moda.",
      skills: ["account-management", "sales-strategy", "financial-planning"],
      budgetMinEur: 55000,
      budgetMaxEur: 80000,
      rateType: "ral_annual" as const,
      location: "Milano / Roma",
      remoteOk: false,
    },
    {
      companyId: greenTechId,
      title: "Data Scientist (Sustainability)",
      description: "Analizza i dati energetici per ottimizzare l'efficienza delle reti smart.",
      skills: ["python", "data-analysis", "machine-learning"],
      budgetMinEur: 50000,
      budgetMaxEur: 75000,
      rateType: "ral_annual" as const,
      location: "Venezia",
      remoteOk: true,
    },
    {
      companyId: greenTechId,
      title: "IoT Hardware Engineer",
      description: "Progettazione di sensori intelligenti per il monitoraggio ambientale.",
      skills: ["c++", "impiantistica", "progettazione-strutturale"],
      budgetMinEur: 45000,
      budgetMaxEur: 65000,
      rateType: "ral_annual" as const,
      location: "Venezia",
      remoteOk: false,
    }
  ];

  const createdJobs = [];
  for (const j of jobsData) {
    const [job] = await db.insert(jobs).values(j).returning();
    createdJobs.push(job);
  }

  const job1 = createdJobs.find(j => j.title === "Senior React Developer")!;
  const job2 = createdJobs.find(j => j.title === "Lead UI/UX Designer")!;

  // 5. Create Matches and Interactions
  console.log("Creating matches and interactions...");
  
  const marioId = profIds[0];
  const giuliaId = profIds[1];

  // Match 1: Mario Rossi + Tech Solutions (Confirmed)
  await db.insert(matches).values({
    professionalId: marioId,
    companyId: techSolutionsId,
    jobId: job1.id,
    professionalStatus: "liked",
    companyStatus: "liked",
    matchedAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
    scheduledAt: new Date(Date.now() + 86400000 * 3), // 3 days in future
    meetingLink: "https://meet.google.com/abc-defg-hij",
  });

  // Match 2: Giulia Bianchi + Visionary Studio (Proposed)
  const [match2] = await db.insert(matches).values({
    professionalId: giuliaId,
    companyId: visionaryStudioId,
    jobId: job2.id,
    professionalStatus: "pending",
    companyStatus: "liked",
  }).returning();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(15, 30, 0, 0);

  await db.insert(proposedSlots).values([
    {
      matchId: match2.id,
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 3600000),
    },
    {
      matchId: match2.id,
      startTime: dayAfter,
      endTime: new Date(dayAfter.getTime() + 3600000),
    }
  ]);

  // Match 3: Mario Rossi + Visionary Studio (Pending Company)
  await db.insert(matches).values({
    professionalId: marioId,
    companyId: visionaryStudioId,
    jobId: job2.id,
    professionalStatus: "liked",
    companyStatus: "pending",
  });

  console.log("Seed finished successfully! 🚀");
  console.log(`- Users: prof (mario.rossi@example.com, giulia.bianchi@example.com), comp (hr@techsolutions.it, hello@visionary.io)`);
  console.log(`- Pass: password123`);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
