"use client";

import { 
  User, 
  Shield, 
  Bell, 
  Trash2, 
  Save, 
  Eye, 
  Lock, 
  CreditCard,
  Mail,
  Camera,
  Globe,
  Zap,
  BarChart3,
  BrainCircuit,
  Search,
  CheckCircle2,
  Plus,
  X,
  Target,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import Image from "next/image";
import ImageCropperModal from "@/components/ImageCropperModal";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageBody } from "@/components/layout/PageBody";
import { BottomActionBar } from "@/components/layout/BottomActionBar";
import { uploadImageAction } from "@/app/actions/upload";
import { updateUserImageAction, getUserSettingsAction, updateUserSettingsAction } from "@/app/actions/settings";
import { getMetadataCatalog } from "@/app/actions/metadata";
import { toast } from "sonner";
import { normalizeSkills, skillLabel } from "@/lib/skill-slugs";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

type CatalogCluster = { id: string; label: string; skills: { id: string; slug: string; label: string }[] };

// Card heading shared by every settings section: round crema icon + Title-style heading
function SectionHeading({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="w-11 h-11 rounded-full bg-crema flex items-center justify-center text-viola shrink-0" aria-hidden="true">
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <h3 className="text-title text-viola">{title}</h3>
        {description && <p className="text-label font-normal text-viola-500 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

const FIELD_LABEL = "text-label text-viola";

const SECTIONS = [
  { value: "profile", label: "Profilo", icon: User },
  { value: "skills", label: "Skill Set", icon: Zap },
  { value: "account", label: "Account", icon: Shield },
  { value: "notifications", label: "Notifiche", icon: Bell },
] as const;

// What the server last confirmed: the form is "dirty" while it differs from this.
type SavedSnapshot = { name: string; bio: string; title: string; companyName: string; skills: string[] };
const EMPTY_SNAPSHOT: SavedSnapshot = { name: "", bio: "", title: "", companyName: "", skills: [] };

export default function SettingsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<string>("profile");
  const [saved, setSaved] = useState<SavedSnapshot>(EMPTY_SNAPSHOT);
  const tabListRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [hasImageChanged, setHasImageChanged] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  // Skill slugs, shown through the catalog labels
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [catalog, setCatalog] = useState<CatalogCluster[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive filtered skills during render to avoid setState in effect
  const allSkills = catalog.flatMap(c => c.skills || []);
  const labelBySlug = new Map(allSkills.map(s => [s.slug, s.label]));
  const labelOf = (slug: string) => skillLabel(slug, labelBySlug);
  const filteredSkills = newSkill.length >= 1 
    ? allSkills.filter(s => 
        s.label.toLowerCase().includes(newSkill.toLowerCase()) && 
        !skills.includes(s.slug)
      ).slice(0, 8)
    : [];

  useEffect(() => {
    async function fetchSettings() {
      const result = await getUserSettingsAction();
      if (result.success && result.data) {
        setName(result.data.name);
        setEmail(result.data.email);
        setBio(result.data.bio);
        setTitle(result.data.title || "");
        setCompanyName(result.data.companyName || "");
        setProfileImage(result.data.image);
        setSkills(result.data.skills || []);
        setSaved({
          name: result.data.name,
          bio: result.data.bio,
          title: result.data.title || "",
          companyName: result.data.companyName || "",
          skills: result.data.skills || [],
        });
      }
    }
    fetchSettings();

    async function fetchCatalog() {
      const res = await getMetadataCatalog();
      if (res.success) {
        setCatalog(res.data as CatalogCluster[]);
      }
    }
    fetchCatalog();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // 1. Save general settings
      const settingsResult = await updateUserSettingsAction({
        name,
        bio,
        title,
        companyName,
        skills,
      });
      if (settingsResult.error) throw new Error(settingsResult.error);
      if (settingsResult.skills) setSkills(settingsResult.skills);

      // 2. If image changed and is new (base64), upload it
      if (hasImageChanged && profileImage && profileImage.startsWith('data:')) {
        const res = await fetch(profileImage);
        const blob = await res.blob();
        const file = new File([blob], "profile.jpg", { type: "image/jpeg" });
        
        const formData = new FormData();
        formData.append("file", file);
        
        const uploadResult = await uploadImageAction(formData);
        if (uploadResult.error) throw new Error(uploadResult.error);
        
        // 3. Update user profile with new URL
        const updateResult = await updateUserImageAction(uploadResult.url!);
        if (updateResult.error) throw new Error(updateResult.error);
      } else if (hasImageChanged && !profileImage) {
        // Handle image removal if necessary
        const updateResult = await updateUserImageAction("");
        if (updateResult.error) throw new Error(updateResult.error);
      }

      setHasImageChanged(false);
      setSaved({ name, bio, title, companyName, skills: settingsResult.skills ?? skills });
      setShowSuccess(true);
      toast.success("Impostazioni salvate correttamente");
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Errore durante il salvataggio";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    setProfileImage(croppedImage);
    setHasImageChanged(true);
    setImageToCrop(null);
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setProfileImage(null);
    setHasImageChanged(true);
  };

  // Free text: a catalog label becomes its slug, anything else is slugified like the catalog
  const addSkill = () => {
    if (!newSkill.trim()) return;
    const [slug] = normalizeSkills([newSkill], allSkills);
    if (slug && !skills.includes(slug)) {
      setSkills([...skills, slug]);
    }
    setNewSkill("");
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const selectSkill = (slug: string) => {
    if (!skills.includes(slug)) {
      setSkills([...skills, slug]);
      setNewSkill("");
    }
  };

  const isDirty =
    hasImageChanged ||
    name !== saved.name ||
    bio !== saved.bio ||
    title !== saved.title ||
    companyName !== saved.companyName ||
    skills.join("|") !== saved.skills.join("|");

  const changeTab = (value: string) => {
    setTab(value);
    // Phones: keep the chosen segment fully in view inside the scrolling strip
    const el = tabListRef.current?.querySelector<HTMLElement>(`[data-section="${value}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  const saveLabel = isSaving ? (
    <span className="flex items-center gap-2">
      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      <span className="text-sm">Salvataggio...</span>
    </span>
  ) : null;

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      <PageHeader
        title="Impostazioni"
        subtitle="Profilo, skill, account e notifiche"
        actions={
          <div className="hidden md:flex items-center gap-4">
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0, transition: { duration: duration.state, ease: ease.out } }}
                  exit={{ opacity: 0, transition: { duration: duration.feedback } }}
                  className="flex items-center gap-2 text-chip text-viola bg-rosa px-3 py-1.5 rounded-full"
                >
                  <CheckCircle2 size={14} />
                  Modifiche salvate
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="group h-12 px-6 gap-2 text-sm"
            >
              {saveLabel ?? (
                <>
                  <Save size={16} className="group-hover:scale-110 transition-transform motion-reduce:transition-none" />
                  <span>Salva modifiche</span>
                </>
              )}
            </Button>
          </div>
        }
      />

      <Tabs
        value={tab}
        onValueChange={(value) => changeTab(String(value))}
        orientation="vertical"
        className="flex-1 min-h-0 flex flex-col md:flex-row gap-0"
      >
        {/* Section navigation: a scrolling segmented strip on phones, a side column from md up */}
        <div className="shrink-0 border-b md:border-b-0 md:border-r border-viola/15 bg-white md:w-64 md:p-6 md:flex md:flex-col md:gap-6 md:h-full md:overflow-y-auto no-scrollbar">
          <div className="md:space-y-1">
            <p className="hidden md:block text-label text-viola-500 mb-3 px-4">Sezioni</p>
            <TabsList
              ref={tabListRef}
              className="bg-transparent border-0 rounded-none p-0 h-auto! w-full flex flex-row! md:flex-col! items-stretch justify-start gap-1 overflow-x-auto no-scrollbar px-4 py-2 md:p-0 md:overflow-visible"
            >
              {SECTIONS.map((section) => (
                <TabsTrigger
                  key={section.value}
                  value={section.value}
                  data-section={section.value}
                  className="pressable group relative shrink-0 md:shrink flex-none md:flex-1 w-auto! md:w-full! flex items-center gap-2 md:gap-3 h-11 md:h-12 px-4 justify-start border-0 transition-colors"
                >
                  {/* The primitive puts the active section in a rosa pill, like the bottom nav */}
                  <span className="relative flex items-center justify-center">
                    <section.icon size={18} strokeWidth={1.75} />
                  </span>
                  <span className="relative">{section.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="hidden md:block mt-auto p-6 rounded-card bg-viola text-white">
            <p className="text-label text-rosa mb-2">Un consiglio</p>
            <p className="text-body font-medium">
              Mantieni il profilo aggiornato per il matching.
            </p>
          </div>
        </div>

        {/* Section content: the page's own scroll container */}
        <PageBody className="min-h-0 bg-crema">
          <div className="max-w-3xl mx-auto px-4 pt-6 md:p-12 md:pb-0">
            {/* Profile Section */}
            <TabsContent value="profile" className="m-0 outline-none animate-in fade-in-50 duration-300 motion-reduce:animate-none">
              <div className="space-y-4 md:space-y-6">
                <Card className="flex-col md:flex-row items-center gap-6 md:gap-8 p-6 md:p-8">
                  <div className="relative group shrink-0">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <button
                      type="button"
                      onClick={triggerUpload}
                      aria-label="Cambia immagine profilo"
                      className="pressable w-28 h-28 md:w-32 md:h-32 rounded-card bg-crema overflow-hidden flex items-center justify-center text-viola-300 cursor-pointer"
                    >
                      {profileImage ? (
                        <Image src={profileImage} alt="Profile" width={128} height={128} className="w-full h-full object-cover" />
                      ) : (
                        <User size={48} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={triggerUpload}
                      aria-label="Carica una nuova foto"
                      className="pressable absolute -right-2 -bottom-2 w-11 h-11 rounded-full bg-rosso text-white flex items-center justify-center border-2 border-white"
                    >
                      <Camera size={18} strokeWidth={1.75} />
                    </button>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-title text-viola mb-2">Foto profilo</h3>
                    <p className="text-body text-viola-500 mb-5">
                      Carica una foto professionale. JPG o PNG, max 2MB.
                    </p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                      <Button
                        variant="outline"
                        onClick={triggerUpload}
                        className="h-11 px-6 text-sm"
                      >
                        Cambia foto
                      </Button>
                      {profileImage && (
                        <Button
                          variant="destructive"
                          onClick={removeImage}
                          className="h-11 px-6 gap-2 text-sm"
                        >
                          <Trash2 size={16} /> Rimuovi
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="gap-0 p-6 md:p-8 overflow-visible">
                  <SectionHeading icon={Globe} title="Informazioni pubbliche" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className={FIELD_LABEL}>Nome completo</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Il tuo nome"
                        className="h-12 px-5 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title" className={FIELD_LABEL}>
                        {session?.user?.role === 'company' ? 'Nome azienda' : 'Titolo professionale'}
                      </Label>
                      <Input
                        id="title"
                        value={session?.user?.role === 'company' ? companyName : title}
                        onChange={(e) => session?.user?.role === 'company' ? setCompanyName(e.target.value) : setTitle(e.target.value)}
                        placeholder={session?.user?.role === 'company' ? "Es. Helllo srl" : "Es. Senior Developer"}
                        className="h-12 px-5 font-medium"
                      />
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <Label htmlFor="bio" className={FIELD_LABEL}>Bio professionale</Label>
                    {/* The bio is the user's own voice: Prompt style */}
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Racconta chi sei..."
                      className="min-h-[160px] rounded-3xl p-5 md:p-6 resize-none font-prompt text-lg md:text-xl font-medium leading-7"
                    />
                  </div>
                </Card>

                {/* Live preview in the profile language: blu background, rosa prompt card, white chip card */}
                <section aria-labelledby="profile-preview-heading" className="rounded-card bg-blu p-4 md:p-6 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2 pt-2">
                    <div className="min-w-0">
                      <h4 id="profile-preview-heading" className="text-title text-white">Anteprima profilo</h4>
                      <p className="text-body text-blu-100 mt-1">
                        Così ti vedono gli altri nello swipe.
                      </p>
                    </div>
                    <Button variant="outline" className="w-full sm:w-auto h-12 px-6 gap-2 text-sm shrink-0">
                      <Eye size={18} /> Anteprima live
                    </Button>
                  </div>

                  <div className="px-2 pt-3">
                    <p className="text-title text-white truncate">{name || "Il tuo nome"}</p>
                    <p className="text-body font-medium text-rosa truncate">
                      {(session?.user?.role === 'company' ? companyName : title) || (session?.user?.role === 'company' ? "La tua azienda" : "Il tuo ruolo")}
                    </p>
                  </div>

                  <div className="rounded-card bg-rosa p-6 space-y-2">
                    <p className="text-label text-viola">Su di me</p>
                    <p className={cn(
                      "font-prompt text-2xl leading-8 md:text-prompt font-medium line-clamp-5 wrap-break-word",
                      bio ? "text-viola" : "text-viola-500"
                    )}>
                      {bio || "Scrivi due righe nella bio: qui le leggeranno gli altri."}
                    </p>
                  </div>

                  {skills.length > 0 && (
                    <div className="rounded-card bg-white p-6 space-y-3">
                      <p className="text-label text-viola">Competenze</p>
                      <ul className="flex flex-wrap gap-2">
                        {skills.slice(0, 8).map((skill) => (
                          <li key={skill} className="inline-flex items-center rounded-full bg-rosa px-4 py-2 text-chip text-viola">
                            {labelOf(skill)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              </div>
            </TabsContent>

            {/* Skills Section */}
            <TabsContent value="skills" className="m-0 outline-none animate-in fade-in-50 duration-300 motion-reduce:animate-none overflow-visible">
              <div className="space-y-4 md:space-y-6">
                {/* Skill Management Card */}
                <Card className="gap-0 p-6 md:p-8 overflow-visible">
                  <SectionHeading icon={Zap} title="Le tue competenze" description="Quello che sai fare, in chip." />

                  <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="skills-manage" className={FIELD_LABEL}>Skill attive</Label>
                      <div className="flex flex-wrap gap-2 p-3 md:p-4 rounded-3xl bg-crema min-h-[80px]">
                        <AnimatePresence mode="popLayout">
                          {skills.length > 0 ? (
                            skills.map((skill) => (
                              <motion.div
                                key={skill}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1, transition: { duration: duration.state, ease: ease.out } }}
                                exit={{ opacity: 0, scale: 0.9, transition: { duration: duration.feedback } }}
                                layout
                              >
                                <Badge className="h-11 md:h-10 text-chip pl-4 pr-1 py-0 gap-1">
                                  {labelOf(skill)}
                                  <button
                                    type="button"
                                    onClick={() => removeSkill(skill)}
                                    aria-label={`Rimuovi ${labelOf(skill)}`}
                                    className="w-11 h-11 md:w-8 md:h-8 flex items-center justify-center text-viola rounded-full hover:bg-white/60 transition-colors"
                                  >
                                    <X size={14} />
                                  </button>
                                </Badge>
                              </motion.div>
                            ))
                          ) : (
                            <div className="flex flex-col items-center justify-center w-full py-4 text-viola-500">
                              <BrainCircuit size={24} strokeWidth={1.75} className="mb-2 text-viola-400" aria-hidden="true" />
                              <p className="text-body">Ancora nessuna competenza: aggiungine una qui sotto.</p>
                            </div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="relative pt-2">
                      <Label htmlFor="skills-search" className={cn(FIELD_LABEL, "mb-2 block")}>Aggiungi skill</Label>
                      <div className="relative">
                        <Input
                          id="skills-search"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addSkill();
                            }
                          }}
                          enterKeyHint="done"
                          placeholder="Cerca una tecnologia o soft skill..."
                          className="h-14 pl-12 pr-5 font-medium w-full"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-viola-400 pointer-events-none" size={20} strokeWidth={1.75} aria-hidden="true" />
                      </div>

                      <AnimatePresence>
                        {filteredSkills.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0, transition: { duration: duration.state, ease: ease.out } }}
                            exit={{ opacity: 0, y: -6, transition: { duration: duration.feedback } }}
                            className="absolute top-full left-0 w-full mt-3 bg-white rounded-3xl shadow-card z-50 overflow-hidden p-2"
                          >
                            <p className="text-label text-viola-500 px-4 pt-2 pb-1">Risultati suggeriti</p>
                            {filteredSkills.map((s) => (
                              <button
                                key={s.slug}
                                type="button"
                                onClick={() => selectSkill(s.slug)}
                                className="w-full text-left px-4 py-3 rounded-full hover:bg-crema font-medium text-sm text-viola transition-colors flex items-center justify-between gap-3 group"
                              >
                                <span className="truncate">{s.label}</span>
                                <span className="shrink-0 w-8 h-8 rounded-full bg-rosa text-viola flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100 transition-opacity">
                                  <Plus size={14} />
                                </span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </Card>

                {/* Monitoring & Insights Card */}
                <Card className="gap-0 p-6 md:p-8">
                  <div className="flex items-start justify-between gap-3">
                    <SectionHeading icon={BarChart3} title="Monitoraggio" description="Come stanno andando le tue skill." />
                    <Badge className="shrink-0 h-7 px-3 text-label mt-2">Live sync</Badge>
                  </div>

                  {/* Flat colour blocks, rotating viola / rosa / rosso like the profile prompt cards */}
                  <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8">
                    {[
                      { label: 'Frequenza match', value: 'Alta', block: 'bg-viola text-white', labelColor: 'text-rosa', icon: Target },
                      { label: 'Rank skill', value: 'Top 5%', block: 'bg-rosa text-viola', labelColor: 'text-viola', icon: BarChart3 },
                      { label: 'Forza profilo', value: '85%', block: 'bg-rosso text-white', labelColor: 'text-white', icon: Zap },
                    ].map((stat) => (
                      <div key={stat.label} className={cn("rounded-3xl p-3 md:p-5 min-w-0", stat.block)}>
                        <stat.icon size={20} strokeWidth={1.75} className="mb-3 md:mb-4" aria-hidden="true" />
                        <p className={cn("text-label mb-1", stat.labelColor)}>{stat.label}</p>
                        <p className="text-xl md:text-title font-bold tabular-nums">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <p className={FIELD_LABEL}>Dettaglio competenze</p>
                    <div className="divide-y divide-viola/15">
                      {skills.length > 0 ? skills.slice(0, 3).map((skill, i) => (
                        <div key={skill} className="flex items-center justify-between gap-3 py-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 shrink-0 rounded-full bg-crema flex items-center justify-center text-viola font-bold text-xs" aria-hidden="true">
                              {labelOf(skill).substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-body font-medium text-viola truncate">{labelOf(skill)}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="w-20 sm:w-32 h-1.5 rounded-full bg-viola/15 overflow-hidden">
                                  <div className="h-full bg-rosso rounded-full" style={{ width: `${80 - (i * 15)}%` }} />
                                </div>
                                <span className="text-label font-normal text-viola-500 whitespace-nowrap">{80 - (i * 15)}% match</span>
                              </div>
                            </div>
                          </div>
                          <div className="hidden sm:block text-right shrink-0">
                            <p className="text-label font-normal text-viola-500">Popolarità</p>
                            <p className="text-label font-bold text-viola">+12% questo mese</p>
                          </div>
                        </div>
                      )) : (
                        <p className="text-body text-viola-500 text-center py-4 px-4 bg-crema rounded-2xl">
                          Aggiungi delle skill per vedere le analisi dettagliate.
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Account Section */}
            <TabsContent value="account" className="m-0 space-y-4 md:space-y-6 outline-none animate-in fade-in-50 duration-300 motion-reduce:animate-none">
              <Card className="gap-0 p-6 md:p-8">
                <SectionHeading icon={Lock} title="Sicurezza e accesso" />

                {/* Info rows: line icon, label over value, viola/15 divider */}
                <div className="divide-y divide-viola/15">
                  {[
                    { icon: Mail, label: 'Email', value: email, action: 'Cambia' },
                    { icon: Shield, label: 'Password', value: 'Ultima modifica: 3 mesi fa', action: 'Aggiorna' },
                    { icon: CreditCard, label: 'Piano', value: 'Helllo Professional', action: 'Gestisci', badge: 'Premium' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 py-4">
                      <div className="flex gap-4 items-center min-w-0">
                        <item.icon size={24} strokeWidth={1.75} className="shrink-0 text-viola" aria-hidden="true" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-label font-normal text-viola-500">{item.label}</p>
                            {item.badge && <Badge className="h-5 px-2 text-xs">{item.badge}</Badge>}
                          </div>
                          <p className="text-body font-medium text-viola truncate">{item.value}</p>
                        </div>
                      </div>
                      <Button variant="outline" className="shrink-0 h-11 md:h-9 px-4 text-xs">
                        {item.action}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Danger zone: destructive tokens, always icon + text */}
              <Card className="p-6 md:p-8 ring-destructive/30">
                <div className="flex flex-col md:flex-row items-center justify-between gap-5 md:gap-6">
                  <div className="text-center md:text-left">
                    <h4 className="text-title text-destructive mb-1 flex items-center gap-2 justify-center md:justify-start">
                      <AlertTriangle size={22} strokeWidth={2} aria-hidden="true" /> Zona pericolo
                    </h4>
                    <p className="text-body text-viola-500">L&apos;eliminazione dell&apos;account è definitiva.</p>
                  </div>
                  <Button variant="destructive" className="w-full md:w-auto gap-2 h-11 px-6 text-sm">
                    <Trash2 size={16} /> Elimina account
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* Notifications Section */}
            <TabsContent value="notifications" className="m-0 outline-none animate-in fade-in-50 duration-300 motion-reduce:animate-none">
              <Card className="gap-0 p-6 md:p-8">
                <SectionHeading icon={Bell} title="Notifiche" />

                <div className="divide-y divide-viola/15">
                  {[
                    { id: 'profile-visible', icon: Eye, title: 'Visibilità profilo', desc: 'Permetti agli altri di scoprirti.' },
                    { id: 'email-notif', icon: Mail, title: 'Notifiche email', desc: 'Ricevi avvisi per nuovi match.' },
                    { id: 'push-notif', icon: Bell, title: 'Notifiche push', desc: 'Avvisi in tempo reale nel browser.' }
                  ].map((notif) => (
                    <div key={notif.id} className="flex items-center justify-between gap-3 py-4">
                      <div className="flex gap-4 items-center min-w-0">
                        <notif.icon size={24} strokeWidth={1.75} className="shrink-0 text-viola" aria-hidden="true" />
                        <div className="min-w-0">
                          <Label htmlFor={notif.id} className="text-body font-medium text-viola cursor-pointer block mb-0.5">{notif.title}</Label>
                          <p className="text-label font-normal text-viola-500">{notif.desc}</p>
                        </div>
                      </div>
                      <Switch id={notif.id} defaultChecked className="shrink-0" />
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Phones: thumb-reach save bar above the tab bar, only while there is something to save.
                It reserves its own room at the end of the content so it never covers the last field. */}
            <AnimatePresence>
              {isDirty && (
                <BottomActionBar variant="floating" desktop="hidden">
                  <div className="flex items-center gap-3 rounded-full bg-viola text-white p-2 pl-5 shadow-card">
                    <p className="flex-1 min-w-0 text-sm font-medium truncate">Modifiche non salvate</p>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="h-11 px-5 text-sm gap-2"
                    >
                      {saveLabel ?? (
                        <>
                          <Save size={16} /> Salva
                        </>
                      )}
                    </Button>
                  </div>
                  </BottomActionBar>
              )}
            </AnimatePresence>
          </div>
        </PageBody>
      </Tabs>

      <AnimatePresence>
        {imageToCrop && (
          <ImageCropperModal
            image={imageToCrop}
            onCropComplete={handleCropComplete}
            onCancel={() => setImageToCrop(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
