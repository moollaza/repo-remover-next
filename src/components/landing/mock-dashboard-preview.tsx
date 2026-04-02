import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MOCK_REPOS = [
  {
    name: "react-dashboard-v2",
    desc: "Internal analytics dashboard built with React + D3",
    owner: "sarahdev",
    visibility: "public" as const,
    org: false,
    updated: "3 months ago",
    selected: true,
  },
  {
    name: "design-system",
    desc: "Shared component library",
    owner: "acme-corp",
    visibility: "public" as const,
    org: true,
    updated: "6 months ago",
    selected: true,
  },
  {
    name: "next-blog",
    desc: "Personal blog built with Next.js",
    owner: "sarahdev",
    visibility: "public" as const,
    org: false,
    updated: "over 1 year ago",
    selected: false,
  },
  {
    name: "terraform-infra",
    desc: "AWS infrastructure as code",
    owner: "acme-corp",
    visibility: "private" as const,
    org: true,
    updated: "over 1 year ago",
    selected: false,
  },
  {
    name: "express-api-starter",
    desc: "Boilerplate REST API with Express + Prisma",
    owner: "sarahdev",
    visibility: "private" as const,
    org: false,
    updated: "over 1 year ago",
    selected: false,
  },
];

export function MockDashboardPreview() {
  return (
    <div
      aria-hidden="true"
      className="bg-content1 rounded-xl border border-divider shadow-2xl overflow-hidden"
    >
      {/* Header bar */}
      <div className="px-3 sm:px-4 py-3 border-b border-divider">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Repository Management</h3>
          <span className="text-[10px] text-default-400">5 repos</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-default-400" />
            <div className="w-full h-7 rounded-md border border-divider bg-background pl-7 pr-2 text-[11px] text-default-400 flex items-center">
              Search by name or description
            </div>
          </div>
          <div className="hidden sm:block h-7 rounded-md bg-[var(--brand-blue)] px-3 text-[11px] text-white font-medium flex items-center leading-7 whitespace-nowrap">
            Archive Selected Repos
          </div>
        </div>
      </div>

      {/* Table */}
      <Table className="table-fixed text-xs">
        <TableHeader>
          <TableRow className="bg-default-100 border-b border-divider">
            <TableHead className="w-8 sm:w-10 px-2 sm:px-3 py-2">
              <Checkbox aria-hidden="true" checked={false} tabIndex={-1} />
            </TableHead>
            <TableHead className="px-2 sm:px-3 py-2 text-[10px] font-semibold text-default-500 uppercase tracking-wider">
              Repository
            </TableHead>
            <TableHead className="hidden md:table-cell px-3 py-2 text-[10px] font-semibold text-default-500 uppercase tracking-wider">
              Owner
            </TableHead>
            <TableHead className="hidden lg:table-cell px-3 py-2 text-[10px] font-semibold text-default-500 uppercase tracking-wider">
              Status
            </TableHead>
            <TableHead className="px-2 sm:px-3 py-2 text-[10px] font-semibold text-default-500 uppercase tracking-wider text-right sm:text-left">
              Updated
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {MOCK_REPOS.map((repo) => (
            <TableRow
              className={`border-b border-divider/50 ${repo.selected ? "bg-primary/5" : ""}`}
              key={repo.name}
            >
              <TableCell className="w-8 sm:w-10 px-2 sm:px-3 py-2">
                <Checkbox
                  aria-hidden="true"
                  checked={repo.selected}
                  tabIndex={-1}
                />
              </TableCell>
              <TableCell className="px-2 sm:px-3 py-2">
                <div>
                  <span className="font-medium text-[var(--brand-link)] text-xs">
                    {repo.name}
                  </span>
                  {/* Mobile-only badges */}
                  <div className="flex gap-1 mt-0.5 flex-wrap md:hidden">
                    {repo.org && (
                      <Badge size="xs" variant="muted">
                        {repo.owner}
                      </Badge>
                    )}
                    <Badge
                      size="xs"
                      variant={
                        repo.visibility === "public" ? "success" : "muted"
                      }
                    >
                      {repo.visibility === "public" ? "Public" : "Private"}
                    </Badge>
                    {repo.org && (
                      <Badge size="xs" variant="muted">
                        Org
                      </Badge>
                    )}
                  </div>
                  <div className="text-[10px] text-default-500 mt-0.5 line-clamp-1">
                    {repo.desc}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell px-3 py-2 text-[11px] text-default-400">
                {repo.owner}
              </TableCell>
              <TableCell className="hidden lg:table-cell px-3 py-2">
                <div className="flex gap-1 flex-wrap">
                  <Badge
                    size="xs"
                    variant={repo.visibility === "public" ? "success" : "muted"}
                  >
                    {repo.visibility === "public" ? "Public" : "Private"}
                  </Badge>
                  {repo.org && (
                    <Badge size="xs" variant="muted">
                      Org
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="px-2 sm:px-3 py-2 text-[10px] text-default-400 whitespace-nowrap text-right sm:text-left">
                {repo.updated}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
