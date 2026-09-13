import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportContactsForm } from "@/features/contacts/ImportContactsForm";

export default function ImportContactsPage() {
  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-3xl font-semibold">Importer des contacts</h1>
      <Card>
        <CardHeader>
          <CardTitle>Depuis un fichier CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <ImportContactsForm />
        </CardContent>
      </Card>
    </div>
  );
}
