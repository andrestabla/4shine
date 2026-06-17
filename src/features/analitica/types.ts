export interface NameCount {
  label: string;
  value: number;
}

export interface SeriesPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

export interface AnalyticsRange {
  from: string; // ISO
  to: string; // ISO
}

export interface UsuariosAnalytics {
  total: number;
  active: number;
  newInRange: number;
  byRole: NameCount[];
  byPlan: NameCount[];
  byCountry: NameCount[];
  vigencia: NameCount[];
  signupsSeries: SeriesPoint[];
}

export interface MentoriasAnalytics {
  totalSessions: number;
  completedSessions: number;
  individualVsGroup: NameCount[];
  byStatus: NameCount[];
  sessionsSeries: SeriesPoint[];
  groupParticipation: NameCount[];
  attendanceRate: number; // %
}

export interface DescubrimientoAnalytics {
  total: number;
  completed: number;
  completionRate: number; // %
  byStatus: NameCount[];
  avgPillars: NameCount[];
  completionsSeries: SeriesPoint[];
}

export interface AprendizajeAnalytics {
  workbookAvgCompletion: number; // %
  workbooksCompleted: number;
  contentByType: NameCount[];
  contentByStatus: NameCount[];
  completionsSeries: SeriesPoint[]; // content completions over time
}

export interface NetworkingAnalytics {
  totalConnections: number;
  byStatus: NameCount[];
  connectionsSeries: SeriesPoint[];
}

export interface ConvocatoriasAnalytics {
  total: number;
  byStatus: NameCount[];
  totalApplications: number;
  applicationsSeries: SeriesPoint[];
  topByApplications: NameCount[];
}

export interface WorkshopsAnalytics {
  total: number;
  byStatus: NameCount[];
  byAttendance: NameCount[];
  registrationsSeries: SeriesPoint[];
}

export interface AnalyticsResult {
  range: AnalyticsRange;
  usuarios: UsuariosAnalytics;
  mentorias: MentoriasAnalytics;
  descubrimiento: DescubrimientoAnalytics;
  aprendizaje: AprendizajeAnalytics;
  networking: NetworkingAnalytics;
  convocatorias: ConvocatoriasAnalytics;
  workshops: WorkshopsAnalytics;
}
