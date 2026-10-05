export type Role = 'SUPERADMIN' | 'LAWYER' | 'CLIENT';
export type User = { id: string; email: string; fullName: string; role: Role; status: 'ACTIVE' | 'SUSPENDED' };
export type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

export type DocumentCategory = 'IDENTITY' | 'BANKING' | 'LEGAL' | 'RECEIPT';
export type DocumentStatus = 'PENDING' | 'VALIDATED' | 'REJECTED';
export type DisbursementStatus = 'PENDING' | 'APPROVED' | 'IN_PROCESS' | 'DISBURSED' | 'REJECTED' | 'CANCELLED';
export type CaseStage = 'INTAKE' | 'DOCUMENT_REVIEW' | 'LEGAL_ANALYSIS' | 'NEGOTIATION' | 'RECOVERY' | 'DISBURSEMENT' | 'CLOSED';
export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CLIENT' | 'CLOSED';
export type NotificationType = 'DOCUMENT' | 'DISBURSEMENT' | 'CASE' | 'OPPORTUNITY' | 'SYSTEM';

export type Profile = {
  id: string; email: string; fullName: string; cedula: string | null; phone: string | null; address: string | null; city: string | null;
  bankName: string | null; accountType: string | null; accountNumberMasked: string | null; hasBankAccount: boolean;
};

export type DocumentItem = {
  id: string; category: DocumentCategory; originalName: string; mimeType: string; size: number; status: DocumentStatus;
  rejectionReason: string | null; createdAt: string; reviewedAt: string | null;
  owner?: { id: string; fullName: string; email: string }; reviewedBy?: { fullName: string } | null;
};
export type DocumentSummary = { category: DocumentCategory; label: string; total: number; pending: number; validated: number; rejected: number };

export type DisbursementEvent = { id: string; fromStatus: DisbursementStatus | null; toStatus: DisbursementStatus; note: string | null; actorName: string | null; createdAt: string };
export type Disbursement = {
  id: string; code: string; amount: string; currency: string; concept: string; status: DisbursementStatus; bankName: string | null; accountLast4: string | null;
  adminNote: string | null; disbursedAt: string | null; createdAt: string; caseId: string | null;
  case?: { id?: string; number: string; title?: string } | null;
  events?: DisbursementEvent[]; documents?: Pick<DocumentItem, 'id' | 'category' | 'originalName' | 'status' | 'size' | 'createdAt'>[];
  client?: { id: string; fullName: string; email: string }; _count?: { documents: number };
};

export type CaseEvent = { id: string; stage: CaseStage; title: string; description: string | null; actorName: string | null; createdAt: string };
export type Requirement = { id: string; label: string; category: DocumentCategory; categoryLabel: string; state: 'VALIDATED' | 'PENDING' | 'REJECTED' | 'MISSING' };
export type CaseItem = {
  id: string; number: string; title: string; description: string | null; status: CaseStatus; stage: CaseStage; amountClaimed: string | null; currency: string;
  nextSteps: string | null; createdAt: string; updatedAt: string; progress?: number;
  lawyer?: { id?: string; fullName: string; email?: string } | null; client?: { id: string; fullName: string; email: string };
  requirements?: Requirement[]; events?: CaseEvent[]; disbursements?: Pick<Disbursement, 'id' | 'code' | 'amount' | 'status' | 'createdAt'>[];
};

export type AppNotification = { id: string; type: NotificationType; title: string; body: string | null; link: string | null; readAt: string | null; createdAt: string };
export type NotificationPrefs = { documents: boolean; disbursements: boolean; cases: boolean; opportunities: boolean; email: boolean };

export type UnitPoint = { date: string; unitValue: number };
export type Quote = { latestValue: number | null; latestDate: string | null; changePct: number | null; sinceInceptionPct: number | null; sparkline: UnitPoint[] };
export type Opportunity = {
  id: string; title: string; summary: string; terms: string; minAmount: string; maxAmount: string | null; annualRate: string; termMonths: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH'; status: 'DRAFT' | 'OPEN' | 'CLOSED'; _count?: { interests: number; investments: number }; quote?: Quote;
};
export type PerformanceStats = {
  inceptionDate: string; inceptionValue: number; latestDate: string; latestValue: number; previousValue: number | null; change: number | null; changePct: number | null;
  oneMonthPct: number | null; threeMonthPct: number | null; ytdPct: number | null; sinceInceptionPct: number | null; high: number; low: number;
};
export type Performance = { opportunityId: string; title: string; series: UnitPoint[]; stats: PerformanceStats | null };
export type Valuation = { id: string; date: string; unitValue: number; note: string | null };

export type PositionMetrics = { currentUnitValue: number; currentValue: number; pnl: number; returnPct: number; daysHeld: number; annualizedPct: number | null };
export type PositionBase = PositionMetrics & {
  id: string; code: string; opportunity: { id: string; title: string; risk: 'LOW' | 'MEDIUM' | 'HIGH'; status: 'DRAFT' | 'OPEN' | 'CLOSED' };
  amount: number; units: number; unitCost: number; investedAt: string; status: 'ACTIVE' | 'REDEEMED'; redeemedAt: string | null; redeemedValue: number | null;
};
export type PortfolioPosition = PositionBase & { sparkline: UnitPoint[] };
export type AdminPosition = PositionBase & { user: { id: string; fullName: string; email: string } };
export type Portfolio = {
  currency: string; asOf: string;
  summary: { activePositions: number; invested: number; currentValue: number; unrealizedPnl: number; returnPct: number; annualizedPct: number | null; realizedPnl: number; lastChange: { amount: number; pct: number; asOf: string } | null };
  allocation: { opportunityId: string; title: string; value: number; sharePct: number }[];
  history: { date: string; value: number; invested: number }[];
  positions: PortfolioPosition[];
};
export type InvestmentSummary = { aum: number; invested: number; pnl: number; returnPct: number; investors: number; activePositions: number };
export type Interest = {
  id: string; amount: string; message: string | null; status: 'PENDING' | 'CONTACTED' | 'DISCARDED'; createdAt: string;
  opportunity: { id: string; title: string }; user?: { id: string; fullName: string; email: string };
};

export type Simulation = {
  principal: number; annualRate: number; termMonths: number; mode: 'COMPOUND' | 'SIMPLE'; finalAmount: number; totalInterest: number; effectiveAnnualRate: number;
  schedule: { month: number; interest: number; balance: number }[];
};

export const DOC_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  IDENTITY: 'Documentos de identidad', BANKING: 'Documentos bancarios', LEGAL: 'Documentos legales', RECEIPT: 'Comprobantes',
};
export const DOC_STATUS_LABELS: Record<DocumentStatus, string> = { PENDING: 'Pendiente', VALIDATED: 'Validado', REJECTED: 'Rechazado' };
export const DISBURSEMENT_STATUS_LABELS: Record<DisbursementStatus, string> = {
  PENDING: 'Pendiente', APPROVED: 'Aprobada', IN_PROCESS: 'En proceso', DISBURSED: 'Desembolsada', REJECTED: 'Rechazada', CANCELLED: 'Cancelada',
};
/** Espejo de las transiciones válidas de la API (la API es quien las hace cumplir). */
export const DISBURSEMENT_TRANSITIONS: Record<DisbursementStatus, DisbursementStatus[]> = {
  PENDING: ['APPROVED', 'REJECTED'], APPROVED: ['IN_PROCESS', 'REJECTED'], IN_PROCESS: ['DISBURSED', 'REJECTED'], DISBURSED: [], REJECTED: [], CANCELLED: [],
};
export const STAGE_ORDER: CaseStage[] = ['INTAKE', 'DOCUMENT_REVIEW', 'LEGAL_ANALYSIS', 'NEGOTIATION', 'RECOVERY', 'DISBURSEMENT', 'CLOSED'];
export const CASE_STAGE_LABELS: Record<CaseStage, string> = {
  INTAKE: 'Recepción del caso', DOCUMENT_REVIEW: 'Revisión de documentos', LEGAL_ANALYSIS: 'Análisis jurídico', NEGOTIATION: 'Negociación',
  RECOVERY: 'Recuperación', DISBURSEMENT: 'Desembolso', CLOSED: 'Caso cerrado',
};
export const CASE_STATUS_LABELS: Record<CaseStatus, string> = { OPEN: 'Abierto', IN_PROGRESS: 'En curso', WAITING_CLIENT: 'A la espera del cliente', CLOSED: 'Cerrado' };
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = { DOCUMENT: 'Documentos', DISBURSEMENT: 'Desembolsos', CASE: 'Casos', OPPORTUNITY: 'Oportunidades', SYSTEM: 'Sistema' };
export const RISK_LABELS = { LOW: 'Bajo', MEDIUM: 'Medio', HIGH: 'Alto' } as const;
export const ROLE_LABELS: Record<Role, string> = { SUPERADMIN: 'Superadmin', LAWYER: 'Abogado', CLIENT: 'Cliente' };
export const ACCOUNT_TYPE_LABELS: Record<string, string> = { SAVINGS: 'Ahorros', CHECKING: 'Corriente' };
export const REQUIREMENT_STATE_LABELS = { VALIDATED: 'Validado', PENDING: 'En revisión', REJECTED: 'Rechazado', MISSING: 'Falta' } as const;

export const AUDIT_LABELS: Record<string, string> = {
  USER_REGISTERED: 'Registro de usuario', LOGIN: 'Inicio de sesión', LOGIN_FAILED: 'Intento de acceso fallido',
  REFRESH_TOKEN_REUSE: 'Reutilización de sesión detectada', PASSWORD_CHANGED: 'Cambio de contraseña', PASSWORD_RESET: 'Contraseña restablecida',
  USER_CREATED: 'Usuario creado', USER_UPDATED: 'Usuario modificado', PROFILE_UPDATED: 'Perfil actualizado', CLIENT_PROFILE_VIEWED: 'Consulta de datos personales',
  DOCUMENT_UPLOADED: 'Documento cargado', DOCUMENT_VALIDATED: 'Documento validado', DOCUMENT_REJECTED: 'Documento rechazado', DOCUMENT_DELETED: 'Documento eliminado', DOCUMENT_DOWNLOADED: 'Documento descargado por el personal',
  DISBURSEMENT_CREATED: 'Solicitud de desembolso creada', DISBURSEMENT_STATUS: 'Cambio de estado de desembolso',
  CASE_CREATED: 'Caso creado', CASE_UPDATED: 'Caso actualizado', CASE_EVENT_ADDED: 'Novedad de caso publicada',
  OPPORTUNITY_CREATED: 'Oportunidad creada', OPPORTUNITY_UPDATED: 'Oportunidad modificada', OPPORTUNITY_DELETED: 'Oportunidad eliminada',
  INTEREST_CREATED: 'Interés en oportunidad', INTEREST_STATUS: 'Interés atendido', NOTIFICATION_SENT: 'Alerta manual enviada', REPORT_EXPORTED: 'Reporte exportado',
};
export const auditLabel = (action: string) => AUDIT_LABELS[action] ?? action;
