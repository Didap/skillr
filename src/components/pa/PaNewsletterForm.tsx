"use client";

import { useState } from "react";
import Link from "next/link";
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
    } catch {
      toast.error("Si è verificato un errore imprevisto.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="bg-blu-50 rounded-card p-8 text-center animate-in fade-in zoom-in duration-300" role="status">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white mb-4">
          <MailCheck className="h-6 w-6 text-blu" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-bold text-viola mb-2">Controlla la tua casella email</h3>
        <p className="text-viola-500">
          Ti abbiamo inviato un link per confermare la tua iscrizione alla newsletter sui bandi NEET in Puglia.
        </p>
        <Button 
          variant="outline" 
          className="mt-6 h-11 px-5"
          onClick={() => setIsSuccess(false)}
        >
          Iscrivi un altro indirizzo
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-label text-viola ml-1">Email istituzionale</FormLabel>
              <FormControl>
                <Input 
                  placeholder="nome.cognome@comune.puglia.it" 
                  className="h-12 bg-white px-4"
                  {...field} 
                />
              </FormControl>
              <FormMessage className="text-label" />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full h-12 text-base"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Verifica in corso...
            </>
          ) : (
            <span className="flex items-center">
              Attiva aggiornamenti
              <MailCheck className="ml-2 h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </Button>
        <p className="text-label text-viola-500 text-center leading-relaxed">
          Proteggiamo i tuoi dati. Iscrivendoti accetti la nostra <Link href="/privacy" className="underline underline-offset-2 hover:text-blu">Privacy Policy</Link> per l&apos;invio di comunicazioni istituzionali.
        </p>
      </form>
    </Form>
  );
}
