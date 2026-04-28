import { auth } from "@/auth";
import { db } from "@/db";
import { users, professionalProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { MapPin, Calendar, DollarSign, ArrowLeft, Zap, ExternalLink, Globe } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Mock data for development if DB is empty or ID is mock
const MOCK_PROFILE = {
  name: "Elena Valeri",
  title: "Senior UX Architect & Strategy Lead",
  location: "Milano, Italia (Remote OK)",
  rate: "€650",
  rateType: "Giorno",
  bio: "Design lead con oltre 10 anni di esperienza nella creazione di prodotti digitali complessi. Specializzata in sistemi fintech e piattaforme SaaS enterprise. Credo fermamente che il design debba essere guidato dai dati e validato dagli utenti.",
  topSkills: ["User Research", "Design Systems", "Product Strategy"],
  secondarySkills: ["Figma", "Workshop Facilitation", "A/B Testing", "Agile", "TypeScript"],
  experience: [
    { company: "FintechFlow", role: "Head of Design", period: "2021 - Presente" },
    { company: "GlobalAgency", role: "Senior UX Designer", period: "2018 - 2021" },
  ]
};

export default async function ProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  // Try to fetch from DB
  const profile = await db.query.professionalProfiles.findFirst({
    where: eq(professionalProfiles.userId, id),
    with: {
      user: true
    }
  });

  // Fallback to mock for demo purposes if not found in DB
  const displayProfile = profile ? {
    name: `${profile.firstName} ${profile.lastName}`,
    title: profile.title || "Professionista",
    location: profile.city || "Remote",
    rate: `€${profile.rateAmountEur}`,
    rateType: profile.rateType === "daily" ? "Giorno" : profile.rateType === "hourly" ? "Ora" : "Anno",
    bio: profile.bioShort || "Nessuna bio fornita.",
    topSkills: profile.topSkills || [],
    secondarySkills: profile.secondarySkills || [],
    experience: [] // To be implemented with a separate table
  } : MOCK_PROFILE;

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full h-20 border-b border-border-subtle bg-white/80 backdrop-blur-md z-50 px-6 flex items-center justify-between">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft size={20} /> Dashboard
        </Link>
        <Link href="/" className="font-display text-2xl italic font-bold text-primary">
          Skillr
        </Link>
        <div className="w-24" /> {/* Spacer */}
      </nav>

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <section className="flex flex-col md:flex-row gap-12 items-start mb-16">
            <div className="w-40 h-40 md:w-56 md:h-56 rounded-3xl bg-linear-to-br from-emerald-800 to-slate-900 shrink-0 overflow-hidden shadow-2xl">
               <div className="w-full h-full flex items-center justify-center text-white/20 font-display text-8xl italic font-bold">
                 {displayProfile.name[0]}
               </div>
            </div>
            
            <div className="flex-1 space-y-6">
              <div>
                <h1 className="font-display text-5xl md:text-6xl font-bold text-text-primary leading-tight">
                  {displayProfile.name}
                </h1>
                <p className="text-2xl text-primary font-medium mt-2 italic">
                  {displayProfile.title}
                </p>
              </div>

              <div className="flex flex-wrap gap-6 text-text-secondary font-medium">
                <div className="flex items-center gap-2">
                  <MapPin size={20} className="text-primary" />
                  {displayProfile.location}
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign size={20} className="text-primary" />
                  {displayProfile.rate} / {displayProfile.rateType}
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <Button className="rounded-full px-8 h-12 text-lg shadow-lg shadow-primary/20">
                  Prenota una Call
                </Button>
                <Button variant="outline" size="icon" className="rounded-full w-12 h-12 border-border-strong">
                  <ExternalLink size={20} />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full w-12 h-12 border-border-strong">
                  <Globe size={20} />
                </Button>
              </div>
            </div>
          </section>

          {/* Bio Section */}
          <section className="grid md:grid-cols-3 gap-12 border-t border-border-subtle pt-12">
            <div className="md:col-span-2 space-y-8">
              <div>
                <h3 className="text-xs uppercase tracking-widest text-text-muted font-bold mb-4">Bio</h3>
                <p className="text-xl text-text-secondary leading-relaxed">
                  {displayProfile.bio}
                </p>
              </div>

              <div>
                <h3 className="text-xs uppercase tracking-widest text-text-muted font-bold mb-6">Esperienza</h3>
                <div className="space-y-6">
                  {displayProfile.experience.length > 0 ? displayProfile.experience.map((exp, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      <div>
                        <p className="font-bold text-text-primary text-lg">{exp.role}</p>
                        <p className="text-text-secondary">{exp.company} • {exp.period}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-text-muted italic text-lg">Timeline in fase di completamento...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Skills */}
            <div className="space-y-12">
              <div>
                <h3 className="text-xs uppercase tracking-widest text-text-muted font-bold mb-6 flex items-center gap-2">
                  <Zap size={14} className="text-primary" /> Top Skills
                </h3>
                <div className="flex flex-col gap-3">
                  {displayProfile.topSkills.map((skill) => (
                    <div key={skill} className="flex items-center justify-between p-3 rounded-xl bg-surface-warm border border-border-subtle">
                      <span className="font-medium text-text-primary">{skill}</span>
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs uppercase tracking-widest text-text-muted font-bold mb-6">Secondary</h3>
                <div className="flex flex-wrap gap-2">
                  {displayProfile.secondarySkills.map((skill) => (
                    <Badge key={skill} variant="outline" className="rounded-lg px-3 py-1 border-border-strong text-text-secondary font-medium">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
