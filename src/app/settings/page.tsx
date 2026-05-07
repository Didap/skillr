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
  CheckCircle2,
  Plus,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import Image from "next/image";
import ImageCropperModal from "@/components/ImageCropperModal";
import { uploadImageAction } from "@/app/actions/upload";
import { updateUserImageAction, getUserSettingsAction, updateUserSettingsAction } from "@/app/actions/settings";
import { getMetadataCatalog } from "@/app/actions/metadata";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: session } = useSession();
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
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [catalog, setCatalog] = useState<any[]>([]);
  const [filteredSkills, setFilteredSkills] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      }
    }
    fetchSettings();

    async function fetchCatalog() {
      const res = await getMetadataCatalog();
      if (res.success) {
        setCatalog(res.data);
      }
    }
    fetchCatalog();
  }, []);

  useEffect(() => {
    if (newSkill.length >= 1) {
      const allSkills = catalog.flatMap(c => c.skills || []);
      const filtered = allSkills.filter(s => 
        s.label.toLowerCase().includes(newSkill.toLowerCase()) && 
        !skills.includes(s.label)
      );
      setFilteredSkills(filtered.slice(0, 8));
    } else {
      setFilteredSkills([]);
    }
  }, [newSkill, catalog, skills]);

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

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const selectSkill = (skillLabel: string) => {
    if (!skills.includes(skillLabel)) {
      setSkills([...skills, skillLabel]);
      setNewSkill("");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Header - Matching Dashboard Style */}
      <header className="h-24 border-b border-slate-50 bg-white/70 backdrop-blur-xl flex items-center justify-between px-10 shrink-0 sticky top-0 z-40">
        <div>
           <h1 className="text-2xl font-display italic font-bold text-slate-950 tracking-tight">Impostazioni</h1>
           <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.2em] mt-0.5">Gestisci il tuo ecosistema</p>
        </div>
        
        <div className="flex items-center gap-4">
          <AnimatePresence>
            {showSuccess && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100"
              >
                <CheckCircle2 size={14} />
                Modifiche salvate
              </motion.div>
            )}
          </AnimatePresence>
          
          <Button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="rounded-xl px-6 h-12 bg-slate-950 hover:bg-emerald-600 text-white shadow-premium gap-2 transition-all active:scale-95 group"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-sm">Salvataggio...</span>
              </div>
            ) : (
              <>
                <Save size={16} className="group-hover:scale-110 transition-transform" /> 
                <span className="font-bold text-sm">Salva modifiche</span>
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="profile" orientation="vertical" className="flex h-full">
          {/* Sub Navigation - More Compact */}
          <div className="w-64 border-r border-slate-50 bg-slate-50/30 p-6 flex flex-col gap-6 h-full overflow-y-auto no-scrollbar">
            <div className="space-y-1">
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mb-4 px-3">Menu</p>
              <TabsList className="bg-transparent border-0 p-0 flex flex-col items-stretch h-auto w-full gap-1">
                {[
                  { value: 'profile', label: 'Profilo', icon: User },
                  { value: 'account', label: 'Account', icon: Shield },
                  { value: 'notifications', label: 'Notifiche', icon: Bell },
                ].map((tab) => (
                  <TabsTrigger 
                    key={tab.value}
                    value={tab.value} 
                    className="group relative flex items-center gap-3 rounded-xl px-4 h-12 justify-start data-active:bg-white data-active:text-slate-950 data-active:shadow-premium font-bold text-sm text-slate-400 hover:text-slate-600 transition-all border border-transparent data-active:border-slate-100/50"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 group-data-active:bg-emerald-50 group-data-active:text-emerald-600 flex items-center justify-center transition-all">
                      <tab.icon size={14} />
                    </div>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="mt-auto p-6 rounded-2xl bg-emerald-600 text-white relative overflow-hidden group shadow-lg shadow-emerald-100">
               <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:scale-150 transition-transform duration-700" />
               <p className="text-[9px] text-emerald-100 font-black uppercase tracking-widest mb-2">Pro Tip</p>
               <p className="text-xs font-bold leading-snug">
                  Mantieni il profilo aggiornato per il matching.
               </p>
            </div>
          </div>

          {/* Main Content Area - Reduced Padding and Sizes */}
          <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-white">
            <div className="max-w-3xl mx-auto">
              {/* Profile Section */}
              <TabsContent value="profile" className="m-0 space-y-8 outline-none animate-in fade-in-50 duration-500">
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row items-center gap-8 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                    <div className="relative group shrink-0">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                      />
                      <div 
                        onClick={triggerUpload}
                        className="w-32 h-32 rounded-[2.5rem] bg-white border-4 border-white shadow-xl overflow-hidden flex items-center justify-center text-slate-200 cursor-pointer hover:border-emerald-100 transition-all"
                      >
                         {profileImage ? (
                           <Image src={profileImage} alt="Profile" width={128} height={128} className="w-full h-full object-cover" />
                         ) : (
                           <User size={48} />
                         )}
                      </div>
                      <button 
                        onClick={triggerUpload}
                        className="absolute -right-1 -bottom-1 w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all border-2 border-white"
                      >
                         <Camera size={16} />
                      </button>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-xl font-display font-bold italic mb-2">Immagine Profilo</h3>
                      <p className="text-sm text-slate-400 font-medium mb-6">
                         Carica una foto professionale. JPG o PNG, max 2MB.
                      </p>
                      <div className="flex flex-wrap justify-center md:justify-start gap-3">
                        <Button 
                          variant="outline" 
                          onClick={triggerUpload}
                          className="rounded-xl border-slate-200 h-10 px-6 text-sm font-bold hover:bg-white transition-all"
                        >
                          Cambia Foto
                        </Button>
                        {profileImage && (
                          <Button 
                            variant="ghost" 
                            onClick={removeImage}
                            className="rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 h-10 px-6 text-sm font-bold transition-all"
                          >
                            Rimuovi
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <Card className="border-slate-100 shadow-premium rounded-[2rem] overflow-hidden bg-white p-8">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                          <Globe size={18} />
                       </div>
                       <h3 className="text-lg font-display font-bold italic">Informazioni Pubbliche</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Nome completo</Label>
                        <Input 
                          id="name" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Il tuo nome" 
                          className="rounded-xl h-12 border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold px-5 text-base" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">
                          {session?.user?.role === 'company' ? 'Nome Azienda' : 'Titolo professionale'}
                        </Label>
                        <Input 
                          id="title" 
                          value={session?.user?.role === 'company' ? companyName : title}
                          onChange={(e) => session?.user?.role === 'company' ? setCompanyName(e.target.value) : setTitle(e.target.value)}
                          placeholder={session?.user?.role === 'company' ? "Es. Skillr srl" : "Es. Senior Developer"} 
                          className="rounded-xl h-12 border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold px-5 text-base" 
                        />
                      </div>
                    </div>

                    <div className="mt-8 space-y-2">
                      <Label htmlFor="bio" className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Bio professionale</Label>
                      <Textarea 
                        id="bio" 
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Racconta chi sei..."
                        className="min-h-[160px] rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium p-6 resize-none text-base leading-relaxed"
                      />
                    </div>

                    {session?.user?.role === 'professional' && (
                      <div className="mt-10 space-y-4">
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="skills" className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Le tue Skill</Label>
                          <p className="text-[10px] text-slate-400 ml-2 font-medium">Aggiungi le tue competenze principali (es. React, Marketing, Design)</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-4 min-h-12 p-3 rounded-2xl bg-slate-50/50 border border-slate-100">
                          <AnimatePresence mode="popLayout">
                            {skills.length > 0 ? (
                              skills.map((skill) => (
                                <motion.div
                                  key={skill}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  layout
                                >
                                  <Badge className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold px-3 py-1.5 rounded-xl gap-2 shadow-sm group">
                                    {skill}
                                    <button 
                                      onClick={() => removeSkill(skill)}
                                      className="text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                      <X size={12} />
                                    </button>
                                  </Badge>
                                </motion.div>
                              ))
                            ) : (
                              <p className="text-sm text-slate-400 italic px-2 py-1">Nessuna skill aggiunta...</p>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="relative">
                          <div className="relative">
                            <Input 
                              id="skills"
                              value={newSkill}
                              onChange={(e) => setNewSkill(e.target.value)}
                              placeholder="Cerca una skill (es. React, Python...)"
                              className="rounded-xl h-12 border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold pl-12 text-base w-full"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          </div>

                          <AnimatePresence>
                            {filteredSkills.length > 0 && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-premium z-50 overflow-hidden"
                              >
                                {filteredSkills.map((s, idx) => (
                                  <button 
                                    key={s.id}
                                    onClick={() => selectSkill(s.label)}
                                    className="w-full text-left px-5 py-4 hover:bg-emerald-50 font-bold text-sm text-slate-700 transition-colors border-b border-slate-50 last:border-0 flex items-center justify-between group"
                                  >
                                    <span>{s.label}</span>
                                    <Plus size={14} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}
                  </Card>

                  <Card className="border-slate-100 shadow-premium rounded-[2rem] overflow-hidden bg-slate-950 text-white p-8 relative group">
                     <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[80px] opacity-10" />
                     <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                       <div className="text-center md:text-left">
                         <h4 className="font-display font-bold italic text-xl mb-2">Anteprima Profilo</h4>
                         <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                            Controlla come appari nello swipe engine.
                         </p>
                       </div>
                       <Button className="rounded-xl bg-white text-slate-950 hover:bg-emerald-500 hover:text-white gap-2 font-bold shadow-xl transition-all shrink-0 h-12 px-8 text-sm">
                          <Eye size={18} /> Anteprima Live
                       </Button>
                     </div>
                  </Card>
                </div>
              </TabsContent>

              {/* Account Section */}
              <TabsContent value="account" className="m-0 space-y-8 outline-none animate-in fade-in-50 duration-500">
                <Card className="border-slate-100 shadow-premium rounded-[2rem] overflow-hidden bg-white p-8">
                  <div className="flex items-center gap-4 mb-8">
                     <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 border border-slate-200">
                        <Lock size={18} />
                     </div>
                     <h3 className="text-lg font-display font-bold italic">Sicurezza e Accesso</h3>
                  </div>

                  <div className="space-y-1">
                    {[
                      { icon: Mail, label: 'Email', value: email, action: 'Cambia' },
                      { icon: Shield, label: 'Password', value: 'Ultima modifica: 3 mesi fa', action: 'Aggiorna' },
                      { icon: CreditCard, label: 'Piano', value: 'Skillr Professional', action: 'Gestisci', badge: 'Premium' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-5 px-5 rounded-2xl hover:bg-slate-50 transition-all group">
                         <div className="flex gap-4 items-center">
                            <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-colors shadow-sm">
                               <item.icon size={20} />
                            </div>
                            <div>
                               <div className="flex items-center gap-2 mb-0.5">
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                                 {item.badge && <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full">{item.badge}</span>}
                               </div>
                               <p className="text-sm text-slate-950 font-bold">{item.value}</p>
                            </div>
                         </div>
                         <Button variant="outline" className="rounded-xl font-bold h-9 px-4 text-xs border-slate-200 hover:bg-white transition-all">
                           {item.action}
                         </Button>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="border-red-100 shadow-premium rounded-[2rem] overflow-hidden bg-red-50/20 p-8 border-dashed">
                   <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="text-center md:text-left">
                         <h4 className="text-lg font-bold text-red-950 mb-1 italic font-display flex items-center gap-2 justify-center md:justify-start">
                           <Trash2 size={18} /> Zona Pericolo
                         </h4>
                         <p className="text-sm text-red-700/70 font-medium">L&apos;eliminazione dell&apos;account è definitiva.</p>
                      </div>
                      <Button variant="ghost" className="text-red-600 hover:text-white hover:bg-red-600 gap-2 rounded-xl font-bold h-10 px-6 border border-red-100 transition-all text-xs">
                        Elimina Account
                      </Button>
                   </div>
                </Card>
              </TabsContent>

              {/* Notifications Section */}
              <TabsContent value="notifications" className="m-0 space-y-8 outline-none animate-in fade-in-50 duration-500">
                 <Card className="border-slate-100 shadow-premium rounded-[2rem] overflow-hidden bg-white p-8">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
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
                         <div key={notif.id} className="flex items-center justify-between p-6 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-white hover:border-slate-100 hover:shadow-premium transition-all group">
                            <div className="flex gap-4 items-center">
                               <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-all shadow-sm">
                                  <notif.icon size={20} />
                               </div>
                               <div>
                                  <Label htmlFor={notif.id} className="text-base font-bold text-slate-950 cursor-pointer block mb-0.5 group-hover:text-emerald-600 transition-colors">{notif.title}</Label>
                                  <p className="text-xs text-slate-500 font-medium">{notif.desc}</p>
                                </div>
                            </div>
                            <Switch id={notif.id} defaultChecked className="scale-100 data-active:bg-emerald-600" />
                         </div>
                       ))}
                    </div>
                 </Card>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>

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

