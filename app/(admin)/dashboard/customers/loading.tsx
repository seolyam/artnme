import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function CustomersLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-9 w-40 animate-pulse rounded-md bg-muted" />
        <div className="mt-2 h-5 w-60 animate-pulse rounded-md bg-muted" />
      </div>
      <Card>
        <CardHeader>
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0 divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                <div className="h-5 w-28 animate-pulse rounded bg-muted" />
                <div className="h-5 w-16 animate-pulse rounded bg-muted" />
                <div className="h-5 w-24 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
