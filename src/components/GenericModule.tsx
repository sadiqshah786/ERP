import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GenericModule({ title }: { title: string }) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="max-w-md rounded-2xl border bg-card p-10 text-center card-shadow">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Construction className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-xl font-bold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The <strong>{title}</strong> module is part of AMAL ERP. The screen, data model and workflow
          for this module live here — ready to be connected to your Firestore collections.
        </p>
        <Button variant="outline" className="mt-5" asChild>
          <a href="/">Back to Dashboard</a>
        </Button>
      </div>
    </div>
  );
}
