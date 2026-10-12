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
  Target
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
import { uploadImageAction } from "@/app/actions/upload";
import { updateUserImageAction, getUserSettingsAction, updateUserSettingsAction } from "@/app/actions/settings";
import { getMetadataCatalog } from "@/app/actions/metadata";
import { toast } from "sonner";
import { skillLabel, slugifySkill } from "@/lib/skill-slugs";
import { cn } from "@/lib/utils";
import { duration, ease, spring } from "@/lib/motion";

type CatalogCluster = { id: string; label: string; skills: { id: string; slug: string; label: string }[] };

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
    const text = newSkill.trim();
    if (!text) return;
    const slug = allSkills.find(s => s.label.toLowerCase() === text.toLowerCase())?.slug ?? slugifySkill(text);
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
        subtitle="Gestisci il tuo ecosistema"
        actions={
          <div className="hidden md:flex items-center gap-4">
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0, transition: { duration: duration.state, ease: ease.out } }}
                  exit={{ opacity: 0, transition: { duration: duration.feedback } }}
                  className="flex items-center gap-2 text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100"
                >
                  <CheckCircle2 size={14} />
                  Modifiche salvate
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="pressable rounded-xl px-6 h-12 bg-slate-950 hover:bg-emerald-600 text-white shadow-premium gap-2 transition-colors group"
            >
              {saveLabel ?? (
                <>
                  <Save size={16} className="group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-sm">Salva modifiche</span>
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
        <div className="shrink-0 border-b md:border-b-0 md:border-r border-slate-100 md:border-slate-50 bg-white md:bg-slate-50/30 md:w-64 md:p-6 md:flex md:flex-col md:gap-6 md:h-full md:overflow-y-auto no-scrollbar">
          <div className="md:space-y-1">
            <p className="hidden md:block text-[11px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4 px-3">Menu</p>
            <TabsList
              ref={tabListRef}
              className="bg-transparent border-0 rounded-none p-0 h-auto! w-full flex flex-row! md:flex-col! items-stretch justify-start gap-1 overflow-x-auto no-scrollbar px-4 py-2 md:p-0 md:overflow-visible"
            >
              {SECTIONS.map((section) => (
                <TabsTrigger
                  key={section.value}
                  value={section.value}
                  data-section={section.value}
                  className="pressable group relative shrink-0 md:shrink flex-none md:flex-1 w-auto! md:w-full! flex items-center gap-2 md:gap-3 h-11 md:h-12 rounded-full md:rounded-xl px-4 justify-start font-bold text-sm text-slate-500 hover:text-slate-700 border-0 data-active:bg-transparent data-active:shadow-none! data-active:text-emerald-800 md:data-active:text-slate-950 transition-colors"
                >
                  {tab === section.value && (
                    <motion.span
                      layoutId="settings-section-pill"
                      transition={spring.snappy}
                      className="absolute inset-0 rounded-full md:rounded-xl bg-emerald-50 ring-1 ring-emerald-100 md:bg-white md:ring-slate-100/80 md:shadow-premium"
                    />
                  )}
                  <span className="relative flex items-center justify-center md:w-7 md:h-7 md:rounded-lg md:bg-slate-100 md:group-data-active:bg-emerald-50 group-data-active:text-emerald-600 transition-colors">
                    <section.icon size={15} />
                  </span>
                  <span className="relative">{section.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="hidden md:block mt-auto p-6 rounded-2xl bg-emerald-600 text-white relative overflow-hidden group shadow-lg shadow-emerald-100">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <p className="text-[11px] text-emerald-50 font-black uppercase tracking-widest mb-2">Pro Tip</p>
            <p className="text-xs font-bold leading-snug">
              Mantieni il profilo aggiornato per il matching.
            </p>
          </div>
        </div>

        {/* Section content: the page's own scroll container */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-white">
          <div className="max-w-3xl mx-auto px-4 pt-6 md:p-12 pb-tabbar">
            {/* Profile Section */}
            <TabsContent value="profile" className="m-0 outline-none animate-in fade-in-50 duration-300 motion-reduce:animate-none">
              <div className="space-y-6 md:space-y-8">
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 bg-slate-50/50 p-5 md:p-8 rounded-[2rem] border border-slate-100">
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
                      className="pressable w-28 h-28 md:w-32 md:h-32 rounded-[2.25rem] md:rounded-[2.5rem] bg-white border-4 border-white shadow-xl overflow-hidden flex items-center justify-center text-slate-200 cursor-pointer hover:border-emerald-100 transition-colors"
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
                      className="pressable absolute -right-2 -bottom-2 w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg md:hover:scale-110 transition-transform border-2 border-white"
                    >
                      <Camera size={16} />
                    </button>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-display font-bold italic mb-2">Immagine Profilo</h3>
                    <p className="text-sm text-slate-500 font-medium mb-5 md:mb-6">
                      Carica una foto professionale. JPG o PNG, max 2MB.
                    </p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                      <Button
                        variant="outline"
                        onClick={triggerUpload}
                        className="pressable rounded-xl border-slate-200 h-11 md:h-10 px-6 text-sm font-bold hover:bg-white transition-colors"
                      >
                        Cambia Foto
                      </Button>
                      {profileImage && (
                        <Button
                          variant="ghost"
                          onClick={removeImage}
                          className="pressable rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 h-11 md:h-10 px-6 text-sm font-bold transition-colors"
                        >
                          Rimuovi
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <Card className="border-slate-100 shadow-premium rounded-[2rem] bg-white p-5 md:p-8 overflow-visible">
                  <div className="flex items-center gap-4 mb-6 md:mb-8">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
                      <Globe size={18} />
                    </div>
                    <h3 className="text-lg font-display font-bold italic">Informazioni Pubbliche</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[11px] font-black text-slate-500 ml-2 uppercase tracking-widest">Nome completo</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Il tuo nome"
                        className="rounded-xl h-12 border-slate-100 bg-slate-50/50 focus:bg-white transition-colors font-bold px-5 text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-[11px] font-black text-slate-500 ml-2 uppercase tracking-widest">
                        {session?.user?.role === 'company' ? 'Nome Azienda' : 'Titolo professionale'}
                      </Label>
                      <Input
                        id="title"
                        value={session?.user?.role === 'company' ? companyName : title}
                        onChange={(e) => session?.user?.role === 'company' ? setCompanyName(e.target.value) : setTitle(e.target.value)}
                        placeholder={session?.user?.role === 'company' ? "Es. Skillr srl" : "Es. Senior Developer"}
                        className="rounded-xl h-12 border-slate-100 bg-slate-50/50 focus:bg-white transition-colors font-bold px-5 text-base"
                      />
                    </div>
                  </div>

                  <div className="mt-6 md:mt-8 space-y-2">
                    <Label htmlFor="bio" className="text-[11px] font-black text-slate-500 ml-2 uppercase tracking-widest">Bio professionale</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Racconta chi sei..."
                      className="min-h-[160px] rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-colors font-medium p-5 md:p-6 resize-none text-base leading-relaxed"
                    />
                  </div>
                </Card>

                <Card className="border-slate-100 shadow-premium rounded-[2rem] overflow-hidden bg-slate-950 text-white p-5 md:p-8 relative group">
                  <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[80px] opacity-10" />
                  <div className="flex flex-col md:flex-row items-center justify-between gap-5 md:gap-8 relative z-10">
                    <div className="text-center md:text-left">
                      <h4 className="font-display font-bold italic text-xl mb-2">Anteprima Profilo</h4>
                      <p className="text-slate-300 text-sm leading-relaxed max-w-xs">
                        Controlla come appari nello swipe engine.
                      </p>
                    </div>
                    <Button className="pressable w-full md:w-auto rounded-xl bg-white text-slate-950 hover:bg-emerald-500 hover:text-white gap-2 font-bold shadow-xl transition-colors shrink-0 h-12 px-8 text-sm">
                      <Eye size={18} /> Anteprima Live
                    </Button>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Skills Section */}
            <TabsContent value="skills" className="m-0 outline-none animate-in fade-in-50 duration-300 motion-reduce:animate-none overflow-visible">
              <div className="space-y-6 md:space-y-8">
                {/* Skill Management Card */}
                <Card className="border-slate-100 shadow-premium rounded-[2rem] bg-white p-5 md:p-8 overflow-visible">
                  <div className="flex items-center gap-4 mb-6 md:mb-8">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
                      <Zap size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-display font-bold italic">Gestione Competenze</h3>
                      <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Configura il tuo arsenale tecnico</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex flex-col gap-3">
                      <Label htmlFor="skills-manage" className="text-[11px] font-black text-slate-500 ml-2 uppercase tracking-widest">Le tue Skill Attive</Label>
                      <div className="flex flex-wrap gap-2 p-3 md:p-4 rounded-2xl bg-slate-50/50 border border-slate-100 min-h-[80px]">
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
                                <Badge className="h-11 md:h-10 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm pl-4 pr-1 py-0 rounded-xl gap-2 shadow-sm group transition-colors">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  {labelOf(skill)}
                                  <button
                                    type="button"
                                    onClick={() => removeSkill(skill)}
                                    aria-label={`Rimuovi ${labelOf(skill)}`}
                                    className="w-11 h-11 md:w-8 md:h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors hover:bg-red-50 rounded-lg"
                                  >
                                    <X size={14} />
                                  </button>
                                </Badge>
                              </motion.div>
                            ))
                          ) : (
                            <div className="flex flex-col items-center justify-center w-full py-4 text-slate-500">
                              <BrainCircuit size={24} className="mb-2 opacity-30" />
                              <p className="text-sm italic font-medium">Ancora nessuna competenza aggiunta</p>
                            </div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="relative pt-2">
                      <Label htmlFor="skills-search" className="text-[11px] font-black text-slate-500 ml-2 uppercase tracking-widest mb-2 block">Aggiungi Nuove Skill</Label>
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
                          className="rounded-xl h-14 border-slate-100 bg-slate-50/50 focus:bg-white transition-colors font-bold pl-12 text-base w-full shadow-inner"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      </div>

                      <AnimatePresence>
                        {filteredSkills.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0, transition: { duration: duration.state, ease: ease.out } }}
                            exit={{ opacity: 0, y: -6, transition: { duration: duration.feedback } }}
                            className="absolute top-full left-0 w-full mt-3 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden"
                          >
                            <div className="p-2 border-b border-slate-50 bg-slate-50/30">
                              <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] px-3 py-1">Risultati suggeriti</p>
                            </div>
                            {filteredSkills.map((s) => (
                              <button
                                key={s.slug}
                                type="button"
                                onClick={() => selectSkill(s.slug)}
                                className="w-full text-left px-5 py-3.5 md:py-4 hover:bg-emerald-50 hover:text-emerald-900 font-bold text-sm text-slate-700 transition-colors border-b border-slate-50 last:border-0 flex items-center justify-between group"
                              >
                                <span className="flex items-center gap-3 min-w-0">
                                  <span className="w-8 h-8 shrink-0 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-colors shadow-sm">
                                    <Zap size={14} />
                                  </span>
                                  <span className="truncate">{s.label}</span>
                                </span>
                                <span className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity">
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
                <Card className="border-slate-100 shadow-premium rounded-[2rem] overflow-hidden bg-white p-5 md:p-8">
                  <div className="flex items-center justify-between gap-3 mb-6 md:mb-8">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
                        <BarChart3 size={18} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-display font-bold italic leading-tight">Monitoraggio & Insights</h3>
                        <p className="hidden sm:block text-[11px] text-slate-500 font-medium uppercase tracking-wider">Analisi delle tue performance</p>
                      </div>
                    </div>
                    <Badge className="shrink-0 h-auto bg-emerald-50 text-emerald-700 border-emerald-100 rounded-lg px-3 py-1 font-black text-[11px] uppercase tracking-widest">Live Sync</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 md:gap-6 mb-6 md:mb-8">
                    {[
                      { label: 'Match Frequency', value: 'High', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: Target },
                      { label: 'Skill Rank', value: 'Top 5%', color: 'text-indigo-700', bg: 'bg-indigo-50', icon: BarChart3 },
                      { label: 'Profile Strength', value: '85%', color: 'text-amber-700', bg: 'bg-amber-50', icon: Zap },
                    ].map((stat, i) => (
                      <div key={i} className={`${stat.bg} rounded-2xl p-3 md:p-5 border border-white shadow-sm min-w-0`}>
                        <div className="flex items-center justify-between mb-2 md:mb-3">
                          <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center ${stat.color} shadow-sm`}>
                            <stat.icon size={16} />
                          </div>
                        </div>
                        <p className={`text-[11px] font-black uppercase tracking-wide md:tracking-widest mb-1 leading-tight ${stat.color} opacity-80`}>{stat.label}</p>
                        <p className={`text-xl md:text-2xl font-display font-bold italic ${stat.color}`}>{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[11px] font-black text-slate-500 ml-2 uppercase tracking-widest">Dettaglio Competenze</Label>
                    <div className="space-y-2">
                      {skills.length > 0 ? skills.slice(0, 3).map((skill, i) => (
                        <div key={skill} className="flex items-center justify-between gap-3 p-3 md:p-4 rounded-2xl border border-slate-50 bg-slate-50/30 group hover:bg-white hover:shadow-premium transition-[background-color,box-shadow]">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 shrink-0 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-500 group-hover:text-emerald-600 transition-colors font-bold text-xs">
                              {labelOf(skill).substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">{labelOf(skill)}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="w-20 sm:w-32 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${80 - (i * 15)}%` }} />
                                </div>
                                <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">{80 - (i * 15)}% Match</span>
                              </div>
                            </div>
                          </div>
                          <div className="hidden sm:block text-right shrink-0">
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-tighter">Popolarità</p>
                            <p className="text-xs font-bold text-emerald-600">+12% questo mese</p>
                          </div>
                        </div>
                      )) : (
                        <p className="text-sm text-slate-500 italic text-center py-4 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                          Aggiungi delle skill per vedere le analisi dettagliate
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Account Section */}
            <TabsContent value="account" className="m-0 space-y-6 md:space-y-8 outline-none animate-in fade-in-50 duration-300 motion-reduce:animate-none">
              <Card className="border-slate-100 shadow-premium rounded-[2rem] overflow-hidden bg-white p-5 md:p-8">
                <div className="flex items-center gap-4 mb-4 md:mb-8">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 border border-slate-200 shrink-0">
                    <Lock size={18} />
                  </div>
                  <h3 className="text-lg font-display font-bold italic">Sicurezza e Accesso</h3>
                </div>

                <div className="space-y-1 -mx-2 md:mx-0">
                  {[
                    { icon: Mail, label: 'Email', value: email, action: 'Cambia' },
                    { icon: Shield, label: 'Password', value: 'Ultima modifica: 3 mesi fa', action: 'Aggiorna' },
                    { icon: CreditCard, label: 'Piano', value: 'Skillr Professional', action: 'Gestisci', badge: 'Premium' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 py-4 md:py-5 px-2 md:px-5 rounded-2xl hover:bg-slate-50 transition-colors group">
                      <div className="flex gap-3 md:gap-4 items-center min-w-0">
                        <div className="w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-500 group-hover:text-emerald-600 transition-colors shadow-sm">
                          <item.icon size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
                            {item.badge && <span className="bg-emerald-100 text-emerald-800 text-[11px] leading-none font-black uppercase px-1.5 py-0.5 rounded-full">{item.badge}</span>}
                          </div>
                          <p className="text-sm text-slate-950 font-bold truncate">{item.value}</p>
                        </div>
                      </div>
                      <Button variant="outline" className="pressable shrink-0 rounded-xl font-bold h-11 md:h-9 px-4 text-xs border-slate-200 hover:bg-white transition-colors">
                        {item.action}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="border-red-100 shadow-premium rounded-[2rem] overflow-hidden bg-red-50/20 p-5 md:p-8 border-dashed">
                <div className="flex flex-col md:flex-row items-center justify-between gap-5 md:gap-6">
                  <div className="text-center md:text-left">
                    <h4 className="text-lg font-bold text-red-950 mb-1 italic font-display flex items-center gap-2 justify-center md:justify-start">
                      <Trash2 size={18} /> Zona Pericolo
                    </h4>
                    <p className="text-sm text-red-800 font-medium">L&apos;eliminazione dell&apos;account è definitiva.</p>
                  </div>
                  <Button variant="ghost" className="pressable w-full md:w-auto text-red-600 hover:text-white hover:bg-red-600 gap-2 rounded-xl font-bold h-11 md:h-10 px-6 border border-red-100 transition-colors text-sm md:text-xs">
                    Elimina Account
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* Notifications Section */}
            <TabsContent value="notifications" className="m-0 outline-none animate-in fade-in-50 duration-300 motion-reduce:animate-none">
              <Card className="border-slate-100 shadow-premium rounded-[2rem] overflow-hidden bg-white p-5 md:p-8">
                <div className="flex items-center gap-4 mb-6 md:mb-8">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
                    <Bell size={18} />
                  </div>
                  <h3 className="text-lg font-display font-bold italic">Notifiche</h3>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: 'profile-visible', icon: Eye, title: 'Visibilità Profilo', desc: 'Permetti agli altri di scoprirti.' },
                    { id: 'email-notif', icon: Mail, title: 'Notifiche Email', desc: 'Ricevi avvisi per nuovi match.' },
                    { id: 'push-notif', icon: Bell, title: 'Notifiche Push', desc: 'Avvisi in tempo reale nel browser.' }
                  ].map((notif) => (
                    <div key={notif.id} className="flex items-center justify-between gap-3 p-4 md:p-6 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-white hover:border-slate-100 hover:shadow-premium transition-[background-color,border-color,box-shadow] group">
                      <div className="flex gap-3 md:gap-4 items-center min-w-0">
                        <div className="w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-500 group-hover:text-emerald-500 transition-colors shadow-sm">
                          <notif.icon size={20} />
                        </div>
                        <div className="min-w-0">
                          <Label htmlFor={notif.id} className="text-base font-bold text-slate-950 cursor-pointer block mb-0.5 group-hover:text-emerald-600 transition-colors">{notif.title}</Label>
                          <p className="text-sm md:text-xs text-slate-500 font-medium">{notif.desc}</p>
                        </div>
                      </div>
                      <Switch id={notif.id} defaultChecked className="shrink-0 scale-100 data-active:bg-emerald-600" />
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Room for the phone save bar so it never covers the last field */}
            {isDirty && <div aria-hidden="true" className="h-20 md:hidden" />}
          </div>
        </div>
      </Tabs>

      {/* Phones: thumb-reach save bar above the tab bar, only while there is something to save */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: spring.snappy }}
            exit={{ y: 24, opacity: 0, transition: { duration: duration.feedback, ease: ease.in } }}
            className="md:hidden fixed inset-x-0 z-40 px-4 pb-3 bottom-[calc(4rem+env(safe-area-inset-bottom))]"
          >
            <div className="flex items-center gap-3 rounded-2xl bg-slate-950 text-white p-2 pl-4 shadow-premium">
              <p className="flex-1 min-w-0 text-sm font-semibold truncate">Modifiche non salvate</p>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  "pressable h-11 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm gap-2 transition-colors",
                  isSaving && "text-white"
                )}
              >
                {saveLabel ?? (
                  <>
                    <Save size={16} /> Salva
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
