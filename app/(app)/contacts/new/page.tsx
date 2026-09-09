import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateContactForm } from "@/features/contacts/CreateContactForm";

export default function NewContactPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Nouveau contact</h1>
      <Card>
        <CardHeader>
          <CardTitle>Informations essentielles</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateContactForm />
        </CardContent>
      </Card>
    </div>
  );
}
