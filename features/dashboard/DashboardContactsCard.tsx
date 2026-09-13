"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { contactStatusLabels, cspCategoryLabels, cspCategoryValues } from "@/features/contacts/schemas";
import {
  dashboardContactTabLabels,
  dashboardContactTabs,
  distinctValues,
  matchesContactFilter,
  presentValuesInOrder,
  type DashboardContactTab,
} from "./contactsFilter";

export type DashboardContact = {
  id: string;
  firstName: string;
  lastName: string;
  status: keyof typeof contactStatusLabels;
  company: string | null;
  cspCategory: keyof typeof cspCategoryLabels | null;
  products: string[];
};

export function DashboardContactsCard({ contacts }: { contacts: DashboardContact[] }) {
  const [tab, setTab] = useState<DashboardContactTab>("tous");
  const [facet, setFacet] = useState<string | null>(null);

  function selectTab(next: DashboardContactTab) {
    setTab(next);
    setFacet(null);
  }

  // Ordre métier fixe (TNS/libéral/dirigeant en tête) plutôt qu'alphabétique.
  const cspCategoriesPresent = presentValuesInOrder(contacts.map((c) => c.cspCategory), cspCategoryValues);
  const products = distinctValues(contacts.flatMap((c) => c.products));
  const filtered = contacts.filter((c) => matchesContactFilter(c, tab, facet));

  return (
    <div>
      <div className="flex flex-wrap gap-1 px-6 pb-3">
        {dashboardContactTabs.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => selectTab(value)}
            className={buttonVariants({ variant: value === tab ? "default" : "outline", size: "sm" })}
          >
            {dashboardContactTabLabels[value]}
          </button>
        ))}
      </div>

      {tab === "csp" && (
        <div className="flex flex-wrap gap-1.5 px-6 pb-3">
          {cspCategoriesPresent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune CSP renseignée.</p>
          ) : (
            cspCategoriesPresent.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFacet(value === facet ? null : value)}
                className={buttonVariants({ variant: value === facet ? "default" : "outline", size: "sm" })}
              >
                {cspCategoryLabels[value]}
              </button>
            ))
          )}
        </div>
      )}

      {tab === "produit" && (
        <div className="flex flex-wrap gap-1.5 px-6 pb-3">
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun produit souscrit.</p>
          ) : (
            products.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setFacet(p === facet ? null : p)}
                className={buttonVariants({ variant: p === facet ? "default" : "outline", size: "sm" })}
              >
                {p}
              </button>
            ))
          )}
        </div>
      )}

      <div className="max-h-80 overflow-y-auto border-t">
        {filtered.length === 0 ? (
          <p className="px-6 py-4 text-sm text-muted-foreground">Aucun contact ne correspond.</p>
        ) : (
          <ul className="divide-y">
            {filtered.map((contact) => (
              <li key={contact.id}>
                <Link
                  href={`/contacts/${contact.id}`}
                  className="flex items-center justify-between gap-3 px-6 py-2.5 text-sm hover:bg-muted/50"
                >
                  <span className="min-w-0">
                    <span className="font-medium">
                      {contact.firstName} {contact.lastName}
                    </span>
                    {contact.company && (
                      <span className="ml-2 truncate text-xs text-muted-foreground">{contact.company}</span>
                    )}
                  </span>
                  <Badge variant="outline" className="shrink-0">
                    {contactStatusLabels[contact.status]}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
