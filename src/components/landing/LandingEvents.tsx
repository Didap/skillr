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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-12 md:mt-16">
      {events.map((event, i) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className="group h-full flex flex-col gap-0 py-0 rounded-card ring-0 border border-viola/15 bg-white overflow-hidden transition-colors hover:border-viola/40">
            <div className="relative h-48 overflow-hidden">
              {event.imageUrl ? (
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 motion-reduce:transition-none"
                />
              ) : (
                <div className="w-full h-full bg-crema flex items-center justify-center text-viola-300">
                  <Calendar size={48} strokeWidth={1.5} />
                </div>
              )}
              <div className="absolute top-4 left-4">
                <Badge className="h-8 bg-rosso text-white px-4 font-bold text-sm">
                  {formatEventDayShort(event.date)}
                </Badge>
              </div>
            </div>

            <div className="p-6 md:p-7 flex-1 flex flex-col text-viola">
              <div className="flex items-center gap-3 mb-5">
                <div className="size-10 rounded-full bg-crema overflow-hidden relative shrink-0">
                  {event.companyImage ? (
                    <Image src={event.companyImage} alt={event.companyName} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-viola font-bold text-sm">
                      {event.companyName?.[0]}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-label text-viola-500 mb-0.5">Organizzato da</p>
                  <p className="font-bold text-sm truncate">{event.companyName}</p>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-3 line-clamp-2 min-h-14">
                {event.title}
              </h3>

              <div className="flex flex-wrap gap-2 mb-6">
                {event.tags?.slice(0, 3).map((tag: string) => (
                  <Badge key={tag} className="h-7 px-3 text-[13px]">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="mt-auto pt-5 border-t border-viola/15 flex items-center justify-between gap-3">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex items-center gap-1.5 text-viola-500 font-semibold text-sm">
                    <Users size={16} strokeWidth={1.75} className="text-viola" />
                    <span>{event.bookingCount}/{event.maxSlots}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-viola-500 font-semibold text-sm min-w-0">
                    <MapPin size={16} strokeWidth={1.75} className="text-viola shrink-0" />
                    <span className="truncate max-w-[110px]">{event.location || "Online"}</span>
                  </div>
                </div>

                <Link
                  href={session ? `/dashboard/events/${event.id}` : "/login"}
                  aria-label={`Apri ${event.title}`}
                  className="pressable group/btn shrink-0 size-11 rounded-full bg-rosso text-white flex items-center justify-center hover:bg-rosso-600"
                >
                  <ArrowRight size={18} className="group-hover/btn:translate-x-0.5 transition-transform motion-reduce:transition-none" />
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
