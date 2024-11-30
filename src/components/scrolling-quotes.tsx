import { Card, CardBody, CardFooter } from "@nextui-org/react";
import clsx from "clsx";
import Link from "next/link";
import { useEffect, useState } from "react";

import styles from "./scrolling-quotes.module.css";

interface Quote {
  text: string;
  author: string;
  source: string;
  sourceName: string;
}

const quotes: Quote[] = [
  {
    text: "Cleaning up old repos is like digital spring cleaning for devs.",
    author: "CodeNinja42",
    source: "https://twitter.com/CodeNinja42",
    sourceName: "Twitter",
  },
  {
    text: "Repo Remover saved me hours of manual work. Highly recommended!",
    author: "DevOpsGuru",
    source: "https://github.com/DevOpsGuru",
    sourceName: "GitHub",
  },
  {
    text: "Finally, a tool that understands the struggle of repo management.",
    author: "GitMaster",
    source: "https://linkedin.com/in/GitMaster",
    sourceName: "LinkedIn",
  },
  {
    text: "Decluttering my GitHub has never been easier. Thanks, Repo Remover!",
    author: "CleanCodeAdvocate",
    source: "https://dev.to/CleanCodeAdvocate",
    sourceName: "Dev.to",
  },
];

export function ScrollingQuotes() {
  const [shuffledQuotes, setShuffledQuotes] = useState<Quote[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const shuffled = [...quotes].sort(() => Math.random() - 0.5);
    setShuffledQuotes(shuffled);
  }, []);

  return (
    <div
      className="w-full"
      aria-label="Scrolling quotes"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className={clsx(
          "flex gap-6",
          styles.scrolling,
          isPaused && styles.paused,
        )}
        style={{
          width: `${shuffledQuotes.length * 320 * 2}px`,
        }}
      >
        {[...shuffledQuotes, ...shuffledQuotes].map((quote, index) => (
          <Link
            href={quote.source}
            key={index}
            target="_blank"
            rel="noopener noreferrer"
            className="w-72 flex-shrink-0 transition-transform duration-300 ease-in-out hover:scale-105 cursor-pointer"
          >
            <Card className="h-full bg-success-50 text-success-900 shadow-md">
              <CardBody className="relative">
                <div className="absolute top-2 left-2 text-8xl text-success opacity-10 font-serif">
                  &ldquo;
                </div>
                <blockquote className="m-0 flex flex-col">
                  <p className="text-foreground pt-6 ml-4 px-2 italic flex-grow">
                    {quote.text}
                  </p>
                  <footer className="mt-4 text-sm text-foreground-500">
                    — <cite>{quote.author}</cite>
                  </footer>
                </blockquote>
              </CardBody>
              <CardFooter className="justify-between items-center">
                <span className="text-xs text-success-700 opacity-50">
                  {quote.sourceName}
                </span>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
