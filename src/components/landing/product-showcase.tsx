import {
  Archive,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
} from "lucide-react";

const mockRepos = [
  {
    archived: false,
    description: "Final project from React bootcamp 2021",
    name: "my-old-bootcamp-project",
    owner: "yourusername",
    private: true,
    selected: true,
    updated: "3 years ago",
  },
  {
    archived: false,
    description: "Sandbox for testing REST APIs",
    name: "test-api-playground",
    owner: "yourusername",
    private: false,
    selected: true,
    updated: "2 years ago",
  },
  {
    archived: true,
    description: "First version of my portfolio site",
    name: "portfolio-v1",
    owner: "yourusername",
    private: false,
    selected: false,
    updated: "4 years ago",
  },
  {
    archived: false,
    description: "",
    name: "css-animation-experiments",
    owner: "yourusername",
    private: false,
    selected: true,
    updated: "1 year ago",
  },
  {
    archived: false,
    description: "Boilerplate for Node.js projects",
    name: "node-starter-template",
    owner: "yourusername",
    private: true,
    selected: false,
    updated: "8 months ago",
  },
];

export function ProductShowcase() {
  return (
    <section className="w-full px-6 py-20 bg-gradient-to-b from-background to-default-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 text-xs rounded-full bg-[var(--brand-blue)]/10 text-[var(--brand-blue)] border border-[var(--brand-blue)]/20 mb-4">
            See it in action
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powerful Repository Management at Your Fingertips
          </h2>
          <p className="text-lg text-default-500 max-w-2xl mx-auto">
            View all your repositories in a clean, organized table. Search,
            filter, and select with ease.
          </p>
        </div>

        {/* Glow + UI mockup */}
        <div className="relative max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-cyan)] blur-3xl opacity-10 dark:opacity-20 rounded-3xl" />
          <div className="relative rounded-xl overflow-hidden border border-divider shadow-2xl bg-content1 text-sm">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-divider bg-default-50">
              <div className="flex items-center gap-2 flex-1 max-w-xs">
                <div className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md border border-divider bg-background text-default-400">
                  <Search className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs">Search repositories...</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-divider bg-background text-default-400 text-xs">
                  Type <ChevronDown className="w-3 h-3" />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-divider bg-background text-default-400 text-xs">
                  Visibility <ChevronDown className="w-3 h-3" />
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-400 dark:bg-amber-500 text-black text-xs font-medium">
                  <Archive className="w-3.5 h-3.5" />
                  Archive Selected (3)
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-danger text-white text-xs font-medium opacity-50 cursor-not-allowed">
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[2rem_2fr_1fr_1fr_1fr] gap-4 px-4 py-2 border-b border-divider bg-default-100 text-xs text-default-500 font-medium uppercase tracking-wide">
              <div className="flex items-center">
                <div className="w-3.5 h-3.5 rounded border border-divider bg-primary/80 flex items-center justify-center">
                  <div className="w-1.5 h-0.5 bg-white rounded" />
                </div>
              </div>
              <div>Repository</div>
              <div>Owner</div>
              <div>Status</div>
              <div>Last Updated</div>
            </div>

            {/* Table rows */}
            {mockRepos.map((repo, i) => (
              <div
                className={`grid grid-cols-[2rem_2fr_1fr_1fr_1fr] gap-4 px-4 py-3 border-b border-divider/50 items-center text-xs transition-colors ${
                  repo.selected ? "bg-primary/5" : "hover:bg-default-50"
                }`}
                key={i}
              >
                <div className="flex items-center">
                  <div
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${repo.selected ? "bg-primary border-primary" : "border-divider bg-background"}`}
                  >
                    {repo.selected && (
                      <svg className="w-2 h-2 text-white" viewBox="0 0 10 8">
                        <path
                          d="M1 4l2.5 2.5L9 1"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-primary font-medium truncate">
                    {repo.name}
                  </div>
                  {repo.description && (
                    <div className="text-default-400 truncate mt-0.5">
                      {repo.description}
                    </div>
                  )}
                </div>
                <div className="text-default-400 truncate">{repo.owner}</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {repo.private && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-default-100 text-default-500 border border-divider">
                      Private
                    </span>
                  )}
                  {repo.archived && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      Archived
                    </span>
                  )}
                  {!repo.private && !repo.archived && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      Public
                    </span>
                  )}
                </div>
                <div className="text-default-400">{repo.updated}</div>
              </div>
            ))}

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 text-xs text-default-400">
              <span>Showing 5 of 127 repositories</span>
              <div className="flex items-center gap-1">
                <button className="p-1 rounded hover:bg-default-100">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 py-1 rounded bg-primary text-primary-foreground text-xs">
                  1
                </span>
                <span className="px-2 py-1">2</span>
                <span className="px-2 py-1">3</span>
                <span className="px-2 py-1">...</span>
                <span className="px-2 py-1">26</span>
                <button className="p-1 rounded hover:bg-default-100">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature highlights below */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-semibold mb-1">Instant Search</h3>
            <p className="text-sm text-default-500">
              Find repos by name or description in milliseconds
            </p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-semibold mb-1">Smart Filtering</h3>
            <p className="text-sm text-default-500">
              Filter by type, visibility, and more
            </p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">✅</div>
            <h3 className="font-semibold mb-1">Bulk Actions</h3>
            <p className="text-sm text-default-500">
              Select multiple repos and act on them at once
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
