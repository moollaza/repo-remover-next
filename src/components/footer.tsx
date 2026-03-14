import { Github, Heart, Trash2, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-divider" data-testid="footer">
      <div className="py-12">
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
                href="https://x.com/RepoRemover"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Twitter className="h-5 w-5" />
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
                  href="https://zaahir.ca"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  About the Author
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-divider flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-default-400">
            © 2019-2025 Repo Remover. All rights reserved.
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
