"use client";

import { motion } from "framer-motion";
import { User, Shield, Bell, Trash2, ArrowLeft, Save, Globe, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch"; // I'll add this next or use a placeholder
import { useState } from "react";

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000); // Mock save
  };

  return (
    <div className="min-h-screen bg-surface p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors font-medium mb-4"
            >
              <ArrowLeft size={18} /> Torna alla Dashboard
            </Link>
            <h1 className="font-display text-5xl font-bold text-text-primary italic">Impostazioni</h1>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting} 
            className="rounded-full px-8 h-12 shadow-lg shadow-primary/20 gap-2"
          >
            {isSaving ? "Salvataggio..." : <><Save size={18} /> Salva modifiche</>}
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="bg-white border border-border-subtle p-1 rounded-2xl h-14 w-full md:w-auto overflow-x-auto justify-start">
            <TabsTrigger value="profile" className="rounded-xl px-6 h-full data-[state=active]:bg-primary/5 data-[state=active]:text-primary font-medium gap-2">
              <User size={18} /> Profilo
            </TabsTrigger>
            <TabsTrigger value="preferences" className="rounded-xl px-6 h-full data-[state=active]:bg-primary/5 data-[state=active]:text-primary font-medium gap-2">
              <Bell size={18} /> Preferenze
            </TabsTrigger>
            <TabsTrigger value="account" className="rounded-xl px-6 h-full data-[state=active]:bg-primary/5 data-[state=active]:text-primary font-medium gap-2">
              <Shield size={18} /> Account
            </TabsTrigger>
          </TabsList>

          {/* Profile Section */}
          <TabsContent value="profile">
            <Card className="border-border-subtle shadow-card">
              <CardHeader>
                <CardTitle>Dati Pubblici</CardTitle>
                <CardDescription>Queste informazioni saranno visibili agli altri utenti nei match.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6 p-4 bg-surface-warm rounded-2xl border border-border-subtle">
                   <div className="w-20 h-20 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-slate-400">
                      <User size={32} />
                   </div>
                   <div>
                      <Button variant="outline" size="sm" className="rounded-full border-border-strong bg-white">Cambia Foto</Button>
                      <p className="text-xs text-text-muted mt-2">JPG, GIF o PNG. Max 2MB.</p>
                   </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input id="name" defaultValue="Elena Valeri" className="rounded-xl h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Titolo professionale</Label>
                    <Input id="title" defaultValue="Senior UX Architect" className="rounded-xl h-12" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio breve</Label>
                  <Textarea 
                    id="bio" 
                    defaultValue="Design lead con oltre 10 anni di esperienza nella creazione di prodotti digitali complessi."
                    className="min-h-[120px] rounded-2xl"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Section */}
          <TabsContent value="preferences">
             <Card className="border-border-subtle shadow-card">
                <CardHeader>
                  <CardTitle>Visibilità e Notifiche</CardTitle>
                  <CardDescription>Controlla come interagisci con la piattaforma.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="flex items-center justify-between p-4 rounded-2xl border border-border-subtle bg-white">
                      <div className="flex gap-3">
                         <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Eye size={20} />
                         </div>
                         <div>
                            <Label htmlFor="profile-visible" className="font-semibold cursor-pointer">Profilo Visibile</Label>
                            <p className="text-sm text-text-muted">Il tuo profilo apparirà nello swipe engine.</p>
                         </div>
                      </div>
                      <Switch id="profile-visible" defaultChecked />
                   </div>

                   <div className="flex items-center justify-between p-4 rounded-2xl border border-border-subtle bg-white">
                      <div className="flex gap-3">
                         <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Bell size={20} />
                         </div>
                         <div>
                            <Label htmlFor="email-notif" className="font-semibold cursor-pointer">Notifiche Email</Label>
                            <p className="text-sm text-text-muted">Ricevi avvisi per nuovi match e messaggi.</p>
                         </div>
                      </div>
                      <Switch id="email-notif" defaultChecked />
                   </div>
                </CardContent>
             </Card>
          </TabsContent>

          {/* Account Section */}
          <TabsContent value="account">
            <Card className="border-border-subtle shadow-card">
               <CardHeader>
                  <CardTitle>Sicurezza Account</CardTitle>
                  <CardDescription>Gestisci le tue credenziali e i dati sensibili.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Indirizzo Email</Label>
                    <Input id="email" defaultValue="elena@example.com" disabled className="rounded-xl h-12 bg-surface-warm" />
                    <p className="text-xs text-text-muted">L'email può essere modificata solo contattando il supporto.</p>
                  </div>
               </CardContent>
               <CardFooter className="border-t border-border-subtle pt-6 mt-6">
                  <Button variant="ghost" className="text-error hover:text-error hover:bg-error/5 gap-2 rounded-full">
                    <Trash2 size={18} /> Elimina account
                  </Button>
               </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

const isSubmitting = false; // Mock for component
