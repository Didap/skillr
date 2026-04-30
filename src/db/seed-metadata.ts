import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local before anything else
config({ path: resolve(process.cwd(), ".env.local") });

export async function seedMetadata() {
  console.log("🌱 Seeding metadata...");
  
  // Dynamic imports to ensure env vars are loaded first
  const { db } = await import("./index");
  const { clusters, skills, jobCategories, jobTitles } = await import("./schema");

  // 1. SKILL CLUSTERS
  const skillClusters = [
    { slug: "tech-development", label: "Software Development" },
    { slug: "design-creative", label: "Design & Creative" },
    { slug: "marketing-sales", label: "Marketing & Sales" },
    { slug: "management-business", label: "Management & Business" },
    { slug: "data-ai", label: "Data & AI" },
    { slug: "soft-skills", label: "Soft Skills" },
  ];

  console.log("Inserting clusters...");
  const insertedClusters = await Promise.all(
    skillClusters.map((c) => 
      db.insert(clusters).values(c).onConflictDoUpdate({ target: clusters.slug, set: { label: c.label } }).returning()
    )
  );

  const clusterMap = Object.fromEntries(insertedClusters.map(c => [c[0].slug, c[0].id]));

  // 2. SKILLS
  const skillList = [
    // Tech
    { cluster: "tech-development", slug: "react", label: "React" },
    { cluster: "tech-development", slug: "nextjs", label: "Next.js" },
    { cluster: "tech-development", slug: "typescript", label: "TypeScript" },
    { cluster: "tech-development", slug: "nodejs", label: "Node.js" },
    { cluster: "tech-development", slug: "python", label: "Python" },
    { cluster: "tech-development", slug: "postgresql", label: "PostgreSQL" },
    { cluster: "tech-development", slug: "aws", label: "AWS" },
    { cluster: "tech-development", slug: "docker", label: "Docker" },
    { cluster: "tech-development", slug: "rust", label: "Rust" },
    { cluster: "tech-development", slug: "go", label: "Go" },
    
    { cluster: "tech-development", slug: "kubernetes", label: "Kubernetes" },
    { cluster: "tech-development", slug: "flutter", label: "Flutter" },
    { cluster: "tech-development", slug: "react-native", label: "React Native" },
    { cluster: "tech-development", slug: "mongodb", label: "MongoDB" },
    { cluster: "tech-development", slug: "redis", label: "Redis" },
    
    // Design
    { cluster: "design-creative", slug: "ui-design", label: "UI Design" },
    { cluster: "design-creative", slug: "ux-research", label: "UX Research" },
    { cluster: "design-creative", slug: "figma", label: "Figma" },
    { cluster: "design-creative", slug: "adobe-creative-suite", label: "Adobe Creative Suite" },
    { cluster: "design-creative", slug: "motion-design", label: "Motion Design" },
    { cluster: "design-creative", slug: "branding", label: "Branding" },
    { cluster: "design-creative", slug: "illustration", label: "Illustration" },
    { cluster: "design-creative", slug: "video-editing", label: "Video Editing" },
    { cluster: "design-creative", slug: "3d-modeling", label: "3D Modeling" },
    
    // Marketing
    { cluster: "marketing-sales", slug: "seo", label: "SEO" },
    { cluster: "marketing-sales", slug: "content-strategy", label: "Content Strategy" },
    { cluster: "marketing-sales", slug: "google-ads", label: "Google Ads" },
    { cluster: "marketing-sales", slug: "growth-hacking", label: "Growth Hacking" },
    { cluster: "marketing-sales", slug: "copywriting", label: "Copywriting" },
    { cluster: "marketing-sales", slug: "email-marketing", label: "Email Marketing" },
    { cluster: "marketing-sales", slug: "influencer-marketing", label: "Influencer Marketing" },
    { cluster: "marketing-sales", slug: "crm", label: "CRM" },
    
    // Management
    { cluster: "management-business", slug: "project-management", label: "Project Management" },
    { cluster: "management-business", slug: "agile-scrum", label: "Agile & Scrum" },
    { cluster: "management-business", slug: "product-strategy", label: "Product Strategy" },
    { cluster: "management-business", slug: "public-speaking", label: "Public Speaking" },
    { cluster: "management-business", slug: "stakeholder-management", label: "Stakeholder Management" },
    { cluster: "management-business", slug: "financial-planning", label: "Financial Planning" },
    { cluster: "management-business", slug: "risk-management", label: "Risk Management" },
    
    // Data & AI
    { cluster: "data-ai", slug: "machine-learning", label: "Machine Learning" },
    { cluster: "data-ai", slug: "data-analysis", label: "Data Analysis" },
    { cluster: "data-ai", slug: "tensorflow", label: "TensorFlow" },
    { cluster: "data-ai", slug: "sql-analytics", label: "SQL for Analytics" },
    { cluster: "data-ai", slug: "generative-ai", label: "Generative AI" },
    { cluster: "data-ai", slug: "nlp", label: "NLP" },
    { cluster: "data-ai", slug: "computer-vision", label: "Computer Vision" },
    { cluster: "data-ai", slug: "data-engineering", label: "Data Engineering" },
    
    // Soft Skills
    { cluster: "soft-skills", slug: "leadership", label: "Leadership" },
    { cluster: "soft-skills", slug: "problem-solving", label: "Problem Solving" },
    { cluster: "soft-skills", slug: "teamwork", label: "Teamwork" },
    { cluster: "soft-skills", slug: "emotional-intelligence", label: "Emotional Intelligence" },
    { cluster: "soft-skills", slug: "critical-thinking", label: "Critical Thinking" },
    { cluster: "soft-skills", slug: "adaptability", label: "Adaptability" },
    { cluster: "soft-skills", slug: "time-management", label: "Time Management" },
    { cluster: "soft-skills", slug: "negotiation", label: "Negotiation" },
  ];

  console.log("Inserting skills...");
  await Promise.all(
    skillList.map((s) => 
      db.insert(skills).values({
        clusterId: clusterMap[s.cluster],
        slug: s.slug,
        label: s.label
      }).onConflictDoUpdate({ target: skills.slug, set: { label: s.label, clusterId: clusterMap[s.cluster] } })
    )
  );

  // 3. JOB CATEGORIES
  const jobCats = [
    { slug: "it-software", label: "IT & Software" },
    { slug: "creative-design", label: "Creative & Design" },
    { slug: "marketing-comm", label: "Marketing & Communication" },
    { slug: "hr-legal", label: "HR & Legal" },
    { slug: "sales-business", label: "Sales & Business Development" },
    { slug: "operations-logistics", label: "Operations & Logistics" },
  ];

  console.log("Inserting job categories...");
  const insertedJobCats = await Promise.all(
    jobCats.map((c) => 
      db.insert(jobCategories).values(c).onConflictDoUpdate({ target: jobCategories.slug, set: { label: c.label } }).returning()
    )
  );

  const jobCatMap = Object.fromEntries(insertedJobCats.map(c => [c[0].slug, c[0].id]));

  // 4. JOB TITLES
  const jobTitleList = [
    { category: "it-software", slug: "frontend-developer", label: "Frontend Developer" },
    { category: "it-software", slug: "backend-developer", label: "Backend Developer" },
    { category: "it-software", slug: "fullstack-developer", label: "Fullstack Developer" },
    { category: "it-software", slug: "devops-engineer", label: "DevOps Engineer" },
    { category: "it-software", slug: "cto", label: "CTO / Technical Director" },
    
    { category: "creative-design", slug: "ui-ux-designer", label: "UI/UX Designer" },
    { category: "creative-design", slug: "graphic-designer", label: "Graphic Designer" },
    { category: "creative-design", slug: "art-director", label: "Art Director" },
    
    { category: "marketing-comm", slug: "marketing-manager", label: "Marketing Manager" },
    { category: "marketing-comm", slug: "seo-specialist", label: "SEO Specialist" },
    { category: "marketing-comm", slug: "social-media-manager", label: "Social Media Manager" },
    { category: "marketing-comm", slug: "content-manager", label: "Content Manager" },
    
    { category: "hr-legal", slug: "hr-manager", label: "HR Manager" },
    { category: "hr-legal", slug: "recruiter", label: "Recruiter" },
    { category: "hr-legal", slug: "legal-counsel", label: "Legal Counsel" },
    
    { category: "sales-business", slug: "sales-account", label: "Sales Account Executive" },
    { category: "sales-business", slug: "business-developer", label: "Business Developer" },
    { category: "sales-business", slug: "customer-success-manager", label: "Customer Success Manager" },
  ];

  console.log("Inserting job titles...");
  await Promise.all(
    jobTitleList.map((t) => 
      db.insert(jobTitles).values({
        categoryId: jobCatMap[t.category],
        slug: t.slug,
        label: t.label
      }).onConflictDoUpdate({ target: jobTitles.slug, set: { label: t.label, categoryId: jobCatMap[t.category] } })
    )
  );

  console.log("✅ Seeding completed!");
}

// Only run if executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seed-metadata.ts')) {
  seedMetadata().catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }).then(() => process.exit(0));
}
