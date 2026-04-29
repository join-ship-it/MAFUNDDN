export type DealStage =
  | "sourced"
  | "initial_review"
  | "loi_sent"
  | "due_diligence"
  | "negotiation"
  | "closing"
  | "portfolio"
  | "exited"
  | "passed";

export type TaskStatus = "open" | "completed" | "missed";
export type TaskPriority = "high" | "medium" | "low";

export type LPStatus = "prospect" | "soft_commit" | "committed" | "closed";
export type RelationshipTier = "warm" | "cold" | "active" | "inactive";

export interface Fund {
  id: string;
  name: string;
  vintage: number;
  targetSize: number; // $M
  committedCapital: number; // $M
  calledCapital: number; // $M
  strategy: string;
  sector: string;
  geography: string;
  revenueMin: number; // $M
  revenueMax: number; // $M
  ebitdaMin: number; // $M
  ebitdaMax: number; // $M
  fundingStatus: "fundraising" | "closed" | "investing" | "harvesting";
  managementFee: number; // %
  carry: number; // %
  investmentPeriodYears: number;
  fundLifeYears: number;
}

export interface LP {
  id: string;
  name: string;
  type: "family_office" | "endowment" | "pension" | "hnw" | "fund_of_funds" | "insurance";
  targetCommitment: number; // $M
  committedAmount: number; // $M
  status: LPStatus;
  contactName: string;
  contactTitle: string;
  location: string;
  introductionDate: string; // ISO date
  lastContactDate: string; // ISO date
  notes: string;
  tier: 1 | 2 | 3;
}

export interface BankerContact {
  id: string;
  name: string;
  firm: string;
  title: string;
  coverage: string; // sector focus
  dealsShared: number;
  lastInteraction: string; // ISO date
  relationship: RelationshipTier;
  email: string;
  phone: string;
}

export interface Deal {
  id: string;
  companyName: string;
  sector: string;
  revenue: number; // $M TTM
  ebitda: number; // $M TTM
  askMultiple: number; // EV/EBITDA
  impliedEV: number; // $M
  stage: DealStage;
  sourceType: "banker" | "proprietary" | "referral" | "sponsor";
  sourcedFrom: string; // contact name or firm
  processDeadline: string | null; // ISO date
  entryDate: string; // ISO date
  notes: string;
  irr?: number; // % projected
  moic?: number; // projected
  managementQuality: 1 | 2 | 3 | 4 | 5;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: "deal" | "fundraising" | "lp_reporting" | "operations" | "modeling" | "admin";
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string; // ISO sim date
  linkedDealId?: string;
  linkedLPId?: string;
}

export interface EventFeedItem {
  id: string;
  date: string; // ISO sim date
  type:
    | "deal_update"
    | "lp_update"
    | "task_missed"
    | "task_completed"
    | "reputation_change"
    | "time_advance"
    | "deadline"
    | "modeling";
  title: string;
  description: string;
  impact?: "positive" | "negative" | "neutral";
}

export interface SimulationState {
  currentDate: string; // ISO date YYYY-MM-DD
  fund: Fund;
  lps: LP[];
  bankers: BankerContact[];
  deals: Deal[];
  tasks: Task[];
  eventFeed: EventFeedItem[];
  reputationScore: number; // 0-100
  modelingSkillScore: number; // 0-100
}
