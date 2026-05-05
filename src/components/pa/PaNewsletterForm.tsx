"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { subscribeToNewsletterAction } from "@/app/actions/pa";
import { Loader2, MailCheck } from "lucide-react";

const newsletterSchema = z.object({
  email: z.string().email("Inserire un indirizzo email valido"),
});

type NewsletterFormValues = z.infer<typeof newsletterSchema>;

export function PaNewsletterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: NewsletterFormValues) {
    setIsSubmitting(true);
    try {
      const result = await subscribeToNewsletterAction(data.email);
      
      if (result.success) {
        setIsSuccess(true);
        toast.success("Ti abbiamo inviato un'email per confermare l'iscrizione.");
        form.reset();
      } else {
        toast.error(result.error || "Si è verificato un errore.");
      }
    } catch (_error) {
      toast.error("Si è verificato un errore imprevisto.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="bg-pa-light border border-pa-blue/20 rounded-lg p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-pa-blue/10 mb-4">
          <MailCheck className="h-6 w-6 text-pa-blue" />
        </div>
        <h3 className="text-xl font-bold text-pa-blue mb-2">Controlla la tua casella email</h3>
        <p className="text-text-secondary">
          Ti abbiamo inviato un link per confermare la tua iscrizione alla newsletter sui bandi NEET in Puglia.
        </p>
        <Button 
          variant="outline" 
          className="mt-6 border-pa-blue text-pa-blue hover:bg-pa-blue/5"
          onClick={() => setIsSuccess(false)}
        >
          Iscrivi un altro indirizzo
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-pa-blue font-semibold">Indirizzo Email Istituzionale</FormLabel>
              <FormControl>
                <Input 
                  placeholder="mario.rossi@comune.bari.it" 
                  className="bg-white border-pa-blue/30 focus-visible:ring-pa-blue"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full bg-pa-blue text-white hover:bg-pa-blue/90 font-bold h-11"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Iscrizione in corso...
            </>
          ) : (
            "Iscriviti alla Newsletter"
          )}
        </Button>
        <p className="text-xs text-text-tertiary text-center mt-4">
          Iscrivendoti, accetti di ricevere comunicazioni relative ai servizi Skillr per la PA.
          Potrai disiscriverti in qualsiasi momento.
        </p>
      </form>
    </Form>
  );
}
