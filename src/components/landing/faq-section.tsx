import { motion, useReducedMotion } from "framer-motion";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { fadeUp, scrollRevealProps, staggerContainer } from "@/utils/motion";

const faqs = [
  {
    answer:
      "Repo Remover uses your token in the browser to call the GitHub API directly. There is no server in the middle. If you choose Remember my token, it is encrypted with AES-GCM before being stored in localStorage.",
    question: "Is my token safe?",
  },
  {
    answer:
      "Both archive and delete require you to type your username first. Archiving is reversible on GitHub anytime. Deletion is permanent — there is no undo.",
    question: "Can I undo a deletion?",
  },
  {
    answer:
      "Yes. If your token has the right scopes, you'll see repos from every organization you belong to alongside your personal repos.",
    question: "Does this work with org repos?",
  },
  {
    answer:
      "The app paginates large lists and lets you filter before selecting. In practice, the limits come from the GitHub API and your browser, not an arbitrary cap inside Repo Remover.",
    question: "How many repos can I manage?",
  },
  {
    answer: "Yes. Repo Remover is free and open source, with no premium tier.",
    question: "Is it really free?",
  },
  {
    answer:
      "No. Open the site, paste a token, and start cleaning up. It works in any modern browser.",
    question: "Do I need to install anything?",
  },
];

export function FAQSection() {
  const reduced = useReducedMotion();

  return (
    <section className="w-full px-6 py-20">
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="text-center mb-12"
          {...scrollRevealProps(staggerContainer, reduced)}
        >
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            variants={fadeUp}
          >
            Questions before you clean up?
          </motion.h2>
          <motion.p className="text-lg text-default-500" variants={fadeUp}>
            The short version.
          </motion.p>
        </motion.div>

        <motion.div {...scrollRevealProps(staggerContainer, reduced)}>
          <Accordion className="space-y-3">
            {faqs.map((faq, index) => (
              <motion.div key={index} variants={fadeUp}>
                <AccordionItem
                  className="rounded-xl border border-divider hover:border-primary/60 bg-background px-5 transition-colors"
                  value={index}
                >
                  <AccordionTrigger className="text-left text-base text-default-700 hover:text-foreground py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-default-700 text-sm">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
