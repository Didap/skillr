import { db } from "./index";
import { clusters, skills } from "./schema";

const metadata = [
  {
    cluster: "Developer",
    skills: ["React", "Next.js", "Node.js", "TypeScript", "Rust", "Python", "Go", "AWS", "Docker", "PostgreSQL", "Tailwind CSS", "React Native", "Vue.js", "Angular", "Java", "C#", "C++", "Ruby on Rails", "PHP", "Swift", "Kotlin", "Flutter", "GraphQL", "Kubernetes", "Redis", "MongoDB", "Framer Motion", "Three.js"]
  },
  {
    cluster: "Designer",
    skills: ["Figma", "UI Design", "UX Design", "Product Design", "Adobe Illustrator", "Adobe Photoshop", "Branding", "Design Systems", "Web Design", "Mobile Design", "Motion Design", "Interaction Design", "Prototyping", "User Research", "Visual Design", "Iconography", "Typography", "3D Modeling", "Blender"]
  },
  {
    cluster: "Product / PM",
    skills: ["Agile", "Scrum", "Product Roadmap", "User Stories", "Stakeholder Management", "Data Analysis", "Market Research", "Product Strategy", "Jira", "Linear", "Asana", "Product Analytics", "A/B Testing", "KPI Tracking", "Prioritization"]
  },
  {
    cluster: "Marketing",
    skills: ["SEO", "SEM", "Content Marketing", "Social Media Marketing", "Email Marketing", "Copywriting", "Performance Marketing", "Google Analytics", "Growth Hacking", "Brand Strategy", "Influencer Marketing", "Public Relations", "Community Management"]
  },
  {
    cluster: "Sales",
    skills: ["Lead Generation", "B2B Sales", "B2C Sales", "CRM Management", "Sales Strategy", "Negotiation", "Account Management", "Cold Calling", "Email Outreach", "Sales Pitching", "Customer Success"]
  },
  {
    cluster: "Amministrazione / HR",
    skills: ["Recruiting", "Payroll Management", "Talent Management", "Employee Onboarding", "Conflict Resolution", "HR Policy", "Performance Reviews", "Compliance", "Office Management", "Accounting", "Financial Planning"]
  },
  {
    cluster: "Legale",
    skills: ["Contract Law", "Corporate Law", "GDPR Compliance", "Intellectual Property", "Legal Research", "Litigation", "Employment Law", "Privacy Law", "Commercial Law"]
  },
  {
    cluster: "Giornalismo / Comunicazione",
    skills: ["Reporting", "Article Writing", "Editing", "Podcast Production", "Video Production", "Social Media Management", "Public Speaking", "Crisis Communication", "Content Strategy", "Storytelling"]
  },
  {
    cluster: "Edilizia / Tecnici",
    skills: ["AutoCAD", "BIM", "Project Management Edile", "Sicurezza sul lavoro", "Topografia", "Progettazione Strutturale", "Impiantistica", "Restauro", "Architettura", "Interior Design"]
  }
];

export async function seedMetadata() {
  console.log("Seeding clusters and skills...");

  for (const item of metadata) {
    const slug = item.cluster.toLowerCase().replace(/ \/ /g, '-').replace(/ /g, '-');
    
    // Insert cluster
    const [cluster] = await db.insert(clusters).values({
      slug,
      label: item.cluster
    }).onConflictDoUpdate({
      target: clusters.slug,
      set: { label: item.cluster }
    }).returning();

    // Insert skills
    for (const skillLabel of item.skills) {
      const skillSlug = skillLabel.toLowerCase().replace(/ /g, '-').replace(/\./g, '-');
      await db.insert(skills).values({
        clusterId: cluster.id,
        slug: skillSlug,
        label: skillLabel
      }).onConflictDoUpdate({
        target: skills.slug,
        set: { label: skillLabel }
      });
    }
  }

  console.log("Seeding completed!");
}
