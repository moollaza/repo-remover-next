import { Github, Heart, Trash2 } from "lucide-react";

function BlueskyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.785 2.627 3.6 3.476 6.178 3.126-4.594.664-7.093 2.806-3.897 6.317 3.597 3.955 6.027-.326 7.095-2.76.147-.335.221-.532.221-.384 0-.148.074.049.221.384 1.068 2.434 3.498 6.715 7.095 2.76 3.196-3.511.697-5.653-3.897-6.317 2.578.35 5.393-.499 6.178-3.126C20.622 9.418 21 4.458 21 3.768c0-.69-.139-1.86-.902-2.203-.659-.299-1.664-.621-4.3 1.24C13.046 4.747 10.087 8.686 9 10.8h3z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer
      className="w-full border-t border-divider bg-default-50/50"
      data-testid="footer"
    >
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-lg">Repo Remover</span>
            </div>
            <p className="text-default-500 mb-4 max-w-md">
              The easiest way to archive and delete multiple GitHub
              repositories. Built with love by developers, for developers.
            </p>
            <div className="flex items-center gap-4">
              <a
                className="text-default-400 hover:text-foreground transition-colors"
                href="https://github.com/moollaza/repo-remover"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                className="text-default-400 hover:text-foreground transition-colors"
                href="https://bsky.app/profile/reporemover.xyz"
                rel="noopener noreferrer"
                target="_blank"
              >
                <BlueskyIcon className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-default-500">
              <li>
                <a
                  className="hover:text-foreground transition-colors"
                  href="#features"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  className="hover:text-foreground transition-colors"
                  href="#how-it-works"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  className="hover:text-foreground transition-colors"
                  href="#get-started"
                >
                  Get Started
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-default-500">
              <li>
                <a
                  className="hover:text-foreground transition-colors"
                  href="https://github.com/moollaza/repo-remover"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  className="hover:text-foreground transition-colors"
                  href="https://bsky.app/profile/reporemover.xyz"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Bluesky
                </a>
              </li>
              <li>
                <a
                  className="hover:text-foreground transition-colors"
                  href="mailto:hello@quickbudget.xyz?subject=Repo%20Remover%20Feedback"
                >
                  Feedback
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-divider flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-default-400">
            © 2019-2026 Repo Remover. All rights reserved.
          </p>
          <p className="text-sm text-default-400 flex items-center gap-2">
            Made with <Heart className="h-4 w-4 text-danger fill-danger" /> by{" "}
            <a
              className="hover:text-foreground transition-colors"
              href="https://zaahir.ca"
              rel="noopener noreferrer"
              target="_blank"
            >
              Zaahir Moolla
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
