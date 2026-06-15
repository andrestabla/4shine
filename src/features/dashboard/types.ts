export interface DashboardSummary {
  routePercent: number;
  discovery: { done: boolean; completionPercent: number };
  tests: number;
  networking: { connected: number; pending: number };
  mentorias: { completed: number; scheduled: number; nextSessionAt: string | null };
  learning: { workbooksTotal: number; workbooksCompleted: number; coursesAvgPercent: number };
  /** Sin avance real en ningún módulo (para el encabezado "Primeros pasos"). */
  firstTime: boolean;
}
