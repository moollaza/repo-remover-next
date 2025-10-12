import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";

interface RepoTableSkeletonProps {
  rows?: number;
}

export default function RepoTableSkeleton({
  rows = 10,
}: RepoTableSkeletonProps) {
  return (
    <Table aria-label="Loading repositories">
      <TableHeader>
        <TableColumn className="w-4/5">NAME</TableColumn>
        <TableColumn className="w-1/5">LAST UPDATED</TableColumn>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-48 rounded-lg" />
                <Skeleton className="h-4 w-32 rounded-lg" />
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24 rounded-lg" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
