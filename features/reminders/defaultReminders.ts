/**
 * Rappels créés automatiquement pour chaque nouveau cabinet — dates indicatives
 * (la déclaration de revenus et les clôtures d'exercice varient chaque année) à
 * ajuster librement depuis Paramètres.
 */
export const defaultFiscalReminders: { label: string; month: number; day: number }[] = [
  { label: "Date limite de versement PER (déduction fiscale de l'année)", month: 12, day: 31 },
  { label: "Ouverture de la période de déclaration de revenus (indicatif)", month: 4, day: 15 },
  {
    label: "Période propice pour démarcher les experts-comptables (clôtures d'exercice)",
    month: 1,
    day: 15,
  },
];
