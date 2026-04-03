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
      "Repo Remover uses your token in the browser to call the GitHub API directly. There is no server in the middle. If you choose Remember my token, it is encrypted with AES-GCM before it is stored in localStorage.",
    question: "Is my token safe?",
  },
  {
    answer:
      "Archiving is reversible on GitHub. Deletion is permanent, so Repo Remover asks you to type your username before it will delete anything.",
    question: "Can I undo deletions?",
  },
  {
    answer:
      "Yes. If your token has the right scopes, you'll see repos from every organization you belong to alongside your personal repos.",
    question: "Does it work with org repos?",
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
    <section className="w-full px-6 sm:px-8 py-16 sm:py-20">
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="text-center mb-12"
          {...scrollRevealProps(staggerContainer, reduced)}
        >
          <motion.h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4"
            variants={fadeUp}
          >
            Questions before you delete anything?
          </motion.h2>
          <motion.p className="text-lg text-default-500" variants={fadeUp}>
            Short answers to the trust and safety questions.
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
