import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    answer:
      "Yes! Repo Remover is completely free and open source. There are no hidden fees, premium tiers, or paid features.",
    question: "Is Repo Remover really free?",
  },
  {
    answer:
      "Completely safe. Your token is only ever used in your browser to call the GitHub API — it's never sent to any server, logged, or stored anywhere outside your device.",
    question: "Is my data safe? Do you store my GitHub credentials?",
  },
  {
    answer:
      "Archiving is fully reversible — you can unarchive repositories anytime through GitHub. However, deletions are permanent. That's why we show a confirmation dialog with username verification before any deletion.",
    question: "Can I undo deletions or archiving?",
  },
  {
    answer:
      "Yes! Repo Remover works with both personal and organization repositories, as long as your token has the necessary permissions.",
    question: "Does this work with organization repositories?",
  },
  {
    answer:
      "There's no limit. Whether you have 10 or 1,000+ repositories, Repo Remover handles them all with search, filtering, and pagination.",
    question: "How many repositories can I manage at once?",
  },
  {
    answer:
      "No. Repo Remover runs entirely in your browser. Just visit the site, paste your GitHub Personal Access Token, and start cleaning up.",
    question: "Do I need to install anything?",
  },
];

export function FAQSection() {
  return (
    <section className="w-full px-6 py-20">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-default-500">
            Everything you need to know about Repo Remover
          </p>
        </div>

        <Accordion>
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={index}>
              <AccordionTrigger className="text-left text-base">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-default-500">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
