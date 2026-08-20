import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, MessageSquareText, PhoneCall, ArrowLeft, Clock3, Send, Handshake } from "lucide-react";
import Seo from "@/components/Seo";
import { CONTACT, waLink } from "@/data/site";
import { trackConversion, fireThankyouCode } from "@/lib/siteConfig";

const STEPS = [
  { icon: Send, title: "Request received", text: "Your details just landed in Rajeev's inbox and WhatsApp." },
  { icon: Clock3, title: "Reply within ~30 min", text: "During business hours you'll hear back fast — usually under half an hour." },
  { icon: Handshake, title: "Free consult & quote", text: "You'll get a clear scope, timeline and price. No obligation." },
];

export default function ThankYou() {
  const { state } = useLocation();
  const name = state?.name?.split(" ")[0] || "";
  const service = state?.service || "";

  useEffect(() => {
    trackConversion({ service: service || "unspecified", page: "thank_you" });
    fireThankyouCode();
  }, [service]);

  return (
    <div data-testid="thank-you-page" className="relative overflow-hidden pt-28 md:pt-36 pb-20 md:pb-28 min-h-[80vh]">
      <div className="aurora" />
      <div className="orb w-[420px] h-[420px] bg-brand/20 -top-20 -left-16" style={{ animation: "float-a 15s ease-in-out infinite" }} />
      <Seo title="Thank you — request received | Rajeev Freelancer" description="Your request has been received. Rajeev usually replies within 30 minutes during business hours." path="/thank-you" noindex />

      <div className="relative z-10 mx-auto max-w-3xl px-5 md:px-10 text-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
          <CheckCircle2 className="mx-auto h-16 w-16 md:h-20 md:w-20 text-brand" />
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }} className="mt-6 font-heading font-extrabold tracking-tighter text-4xl sm:text-5xl lg:text-6xl leading-[0.95]">
          {name ? `Thank you, ${name}.` : "Thank you."}<br />
          <span className="text-brand">Your request is in.</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="mx-auto mt-5 max-w-lg text-base md:text-lg text-ink/70 leading-relaxed">
          {service ? `Your ${service} enquiry has been received. ` : ""}Rajeev usually replies within <strong className="text-ink">30 minutes</strong> during business hours — check your email and WhatsApp.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.6 }} className="mt-10 grid gap-4 sm:grid-cols-3 text-left">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-line bg-white p-5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand"><s.icon className="h-4.5 w-4.5" /></span>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Step {i + 1}</p>
              <h3 className="mt-1 font-heading font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{s.text}</p>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }} className="mt-10 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
          <a href={waLink("Hi Rajeev, I just sent an enquiry on your website.")} target="_blank" rel="noopener noreferrer" data-testid="thankyou-whatsapp-btn" className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[#25D366] px-7 py-3.5 font-medium text-white hover:opacity-90 transition-opacity">
            <MessageSquareText className="h-4 w-4" /> Chat on WhatsApp now
          </a>
          <a href={`tel:${CONTACT.phone}`} data-testid="thankyou-call-btn" className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-ink px-7 py-3.5 font-medium text-white hover:bg-brand transition-colors">
            <PhoneCall className="h-4 w-4" /> Call {CONTACT.whatsappDisplay}
          </a>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-8">
          <Link to="/" data-testid="thankyou-home-link" className="inline-flex items-center gap-2 text-sm text-muted-foreground link-underline">
            <ArrowLeft className="h-4 w-4" /> Back to homepage
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
