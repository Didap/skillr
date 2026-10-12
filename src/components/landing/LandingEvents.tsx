"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Users, ArrowRight, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getPublicEventsAction } from "@/app/actions/interviews";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { InterviewEvent } from "@/types/interview";
import { useSession } from "next-auth/react";
import { formatEventDayShort } from "@/lib/rome-time";

// Grid of upcoming events; the surrounding section (SmartInterviews) provides the header.
export function LandingEvents() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<(InterviewEvent & { bookingCount: number; companyName: string; companyImage: string | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      const res = await getPublicEventsAction({ limit: 3 });
      if (res.success && res.data) {
        setEvents(res.data);
      }
      setLoading(false);
    }
    fetchEvents();
  }, []);

  if (loading) return null;
  if (events.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
      {events.map((event, i) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className="group h-full flex flex-col rounded-[2.5rem] border-slate-100 shadow-card bg-white overflow-hidden hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-500 border-2 hover:border-emerald-500/20">
            <div className="relative h-48 overflow-hidden">
              {event.imageUrl ? (
                <Image 
                  src={event.imageUrl} 
                  alt={event.title} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-700" 
                />
              ) : (
                <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200">
                  <Calendar size={48} />
                </div>
              )}
              <div className="absolute top-4 left-4">
                <Badge className="bg-white/90 backdrop-blur-md text-slate-900 border-none px-4 py-1.5 rounded-xl font-bold shadow-sm">
                  {formatEventDayShort(event.date)}
                </Badge>
              </div>
            </div>

            <div className="p-8 flex-1 flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden relative shadow-sm shrink-0">
                  {event.companyImage ? (
                    <Image src={event.companyImage} alt={event.companyName} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-xs uppercase">
                      {event.companyName?.[0]}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Organizzato da</p>
                  <p className="font-bold text-slate-900 text-sm truncate">{event.companyName}</p>
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-950 mb-3 group-hover:text-emerald-600 transition-colors line-clamp-2 min-h-14">
                {event.title}
              </h3>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {event.tags?.slice(0, 3).map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="bg-slate-50 text-slate-500 border-none text-[10px] font-bold px-2 py-0.5 rounded-lg">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs">
                    <Users size={14} className="text-emerald-500" />
                    <span>{event.bookingCount}/{event.maxSlots}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs">
                    <MapPin size={14} className="text-emerald-500" />
                    <span className="truncate max-w-[80px]">{event.location || "Online"}</span>
                  </div>
                </div>

                <Link href={session ? `/dashboard/events/${event.id}` : "/login"}>
                  <button className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-emerald-600 transition-all group/btn">
                    <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
