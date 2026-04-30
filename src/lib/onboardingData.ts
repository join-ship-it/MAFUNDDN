import type { SimulationState, Fund, LP, BankerContact, Task, EventFeedItem } from "./types";
import { addDays } from "./dateUtils";

export interface OnboardingChoices {
  fundName: string;
  targetSize: number; // $M
  sector: string;
  ebitdaMin: number; // $M
  ebitdaMax: number; // $M
  geography: string;
  valueCreation: string[];
  riskAppetite: "conservative" | "moderate" | "aggressive";
}

export const DEFAULT_CHOICES: OnboardingChoices = {
  fundName: "Arcadia Capital Partners I",
  targetSize: 150,
  sector: "B2B Services",
  ebitdaMin: 3,
  ebitdaMax: 12,
  geography: "United States",
  valueCreation: ["buy-and-build", "pricing", "salesforce-expansion", "operational-improvement"],
  riskAppetite: "moderate",
};

export const TARGET_SIZE_OPTIONS = [
  { value: 75, label: "$75M", desc: "Micro-cap buyout" },
  { value: 100, label: "$100M", desc: "Small LMM fund" },
  { value: 150, label: "$150M", desc: "Core LMM buyout", recommended: true },
  { value: 200, label: "$200M", desc: "Upper LMM fund" },
  { value: 300, label: "$300M", desc: "Mid-market crossover" },
];

export const SECTOR_OPTIONS = [
  { value: "B2B Services", label: "B2B Services", desc: "Founder-owned services businesses", recommended: true },
  { value: "Industrials", label: "Industrials", desc: "Manufacturing, distribution, field services" },
  { value: "Healthcare Services", label: "Healthcare Services", desc: "Non-acute care, dental, behavioral health" },
  { value: "Tech-Enabled Services", label: "Tech-Enabled Services", desc: "Recurring revenue, software-adjacent" },
  { value: "Consumer", label: "Consumer", desc: "Consumer products and services" },
];

export const EBITDA_OPTIONS = [
  { min: 1, max: 4, label: "$1M–$4M", desc: "Micro-cap range" },
  { min: 2, max: 6, label: "$2M–$6M", desc: "Small deal mandate" },
  { min: 3, max: 12, label: "$3M–$12M", desc: "Core LMM range", recommended: true },
  { min: 5, max: 15, label: "$5M–$15M", desc: "Upper LMM mandate" },
  { min: 8, max: 25, label: "$8M–$25M", desc: "Mid-market mandate" },
];

export const GEOGRAPHY_OPTIONS = [
  { value: "United States", label: "United States", desc: "U.S. only — deep focus", recommended: true },
  { value: "North America", label: "North America", desc: "U.S. and Canada" },
  { value: "Europe", label: "Europe", desc: "Western & Northern Europe" },
  { value: "Global", label: "Global", desc: "No geographic restriction" },
];

export const VALUE_CREATION_OPTIONS = [
  { value: "buy-and-build", label: "Buy-and-Build", desc: "Platform + add-on acquisitions" },
  { value: "pricing", label: "Pricing Optimization", desc: "Revenue uplift through repricing" },
  { value: "salesforce-expansion", label: "Salesforce Expansion", desc: "Organic growth via sales hiring" },
  { value: "operational-improvement", label: "Operational Improvement", desc: "Cost structure and process efficiency" },
  { value: "digitalization", label: "Digitalization", desc: "Tech-enablement and systems upgrades" },
  { value: "management-upgrade", label: "Management Upgrade", desc: "CFO, VP Sales, and key hires" },
  { value: "geographic-expansion", label: "Geographic Expansion", desc: "New markets and regions" },
];

export const RISK_OPTIONS = [
  {
    value: "conservative" as const,
    label: "Conservative",
    desc: "Lower leverage, stable cash flows, 20–25% IRR target",
  },
  {
    value: "moderate" as const,
    label: "Moderate",
    desc: "Standard LMM buyout, 25–30% IRR target",
    recommended: true,
  },
  {
    value: "aggressive" as const,
    label: "Aggressive",
    desc: "Higher leverage, growth orientation, 30%+ IRR target",
  },
];

// ─── Builders ─────────────────────────────────────────────────────────────────

const START_DATE = "2026-04-30";

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function buildStrategy(choices: OnboardingChoices): string {
  const sizeLabel =
    choices.targetSize <= 100
      ? "Small LMM Buyout"
      : choices.targetSize <= 200
      ? "Lower Middle Market Buyout"
      : "Middle Market Buyout";
  return `${sizeLabel} — ${choices.sector}`;
}

function buildFund(choices: OnboardingChoices): Fund {
  const revenueMin = Math.round(choices.ebitdaMin / 0.15);
  const revenueMax = Math.round(choices.ebitdaMax / 0.12);
  return {
    id: "fund-1",
    name: choices.fundName,
    vintage: 2026,
    targetSize: choices.targetSize,
    committedCapital: 0,
    calledCapital: 0,
    strategy: buildStrategy(choices),
    sector: choices.sector,
    geography: choices.geography,
    revenueMin,
    revenueMax,
    ebitdaMin: choices.ebitdaMin,
    ebitdaMax: choices.ebitdaMax,
    fundingStatus: "fundraising",
    managementFee: 2.0,
    carry: 20,
    investmentPeriodYears: 5,
    fundLifeYears: 10,
  };
}

interface LPTemplate {
  name: string;
  type: LP["type"];
  location: string;
  contactName: string;
  contactTitle: string;
  tier: 1 | 2 | 3;
  commitmentRatio: number;
  notes: string;
}

const LP_TEMPLATES: LPTemplate[] = [
  {
    name: "Hargrove Family Office",
    type: "family_office",
    location: "Greenwich, CT",
    contactName: "Richard Hargrove III",
    contactTitle: "CIO",
    tier: 1,
    commitmentRatio: 0.10,
    notes: "Referred through GP network. Interested in LMM buyout. Intro meeting went well — needs formal follow-up.",
  },
  {
    name: "Meridian University Endowment",
    type: "endowment",
    location: "Boston, MA",
    contactName: "Patricia Walsh",
    contactTitle: "Director of Alternatives",
    tier: 1,
    commitmentRatio: 0.15,
    notes: "Highly process-driven. Requires DDQ, audited track record, and IC approval before committing.",
  },
  {
    name: "Clearwater Pension Fund",
    type: "pension",
    location: "Chicago, IL",
    contactName: "Susan Olawale",
    contactTitle: "Head of PE Allocation",
    tier: 1,
    commitmentRatio: 0.20,
    notes: "Board approval required. Long lead time typical. Has allocated to LMM before. First meeting booked.",
  },
  {
    name: "Vantage Point Capital FOF",
    type: "fund_of_funds",
    location: "New York, NY",
    contactName: "James Cho",
    contactTitle: "Managing Director",
    tier: 2,
    commitmentRatio: 0.12,
    notes: "Evaluating 3-4 new GPs this cycle. Interested in sector thesis and early deal flow proof points.",
  },
  {
    name: "Thornwood HNW Group",
    type: "hnw",
    location: "Dallas, TX",
    contactName: "Daniel Park",
    contactTitle: "Wealth Manager",
    tier: 3,
    commitmentRatio: 0.04,
    notes: "Smaller check but highly networked. Could open doors to other family offices in Texas.",
  },
];

function buildLPs(choices: OnboardingChoices): LP[] {
  return LP_TEMPLATES.map((tmpl, i) => ({
    id: `lp-${i + 1}`,
    name: tmpl.name,
    type: tmpl.type,
    targetCommitment: Math.max(5, Math.round(choices.targetSize * tmpl.commitmentRatio)),
    committedAmount: 0,
    status: "prospect" as const,
    contactName: tmpl.contactName,
    contactTitle: tmpl.contactTitle,
    location: tmpl.location,
    introductionDate: START_DATE,
    lastContactDate: START_DATE,
    notes: tmpl.notes,
    tier: tmpl.tier,
  }));
}

interface BankerTemplate {
  name: string;
  firm: string;
  title: string;
  coverage: string;
  email: string;
  phone: string;
}

const BANKERS_BY_SECTOR: Record<string, BankerTemplate[]> = {
  "B2B Services": [
    { name: "Michael Torres", firm: "Lincoln International", title: "Managing Director", coverage: "Business Services", email: "m.torres@lincolninternational.com", phone: "(312) 555-0192" },
    { name: "Caroline Strickland", firm: "Harris Williams", title: "Vice President", coverage: "Business Services", email: "c.strickland@harriswilliams.com", phone: "(804) 555-0341" },
    { name: "Sarah Kim", firm: "Houlihan Lokey", title: "Director", coverage: "Business Services", email: "s.kim@hl.com", phone: "(212) 555-0334" },
    { name: "David Lane", firm: "William Blair", title: "Managing Director", coverage: "Business Services & Tech", email: "d.lane@williamblair.com", phone: "(312) 555-0821" },
  ],
  "Industrials": [
    { name: "Thomas Nguyen", firm: "Raymond James", title: "Managing Director", coverage: "Industrials & Distribution", email: "t.nguyen@raymondjames.com", phone: "(813) 555-0764" },
    { name: "Alicia Brennan", firm: "Baird", title: "Senior Vice President", coverage: "Industrials & Manufacturing", email: "a.brennan@rwbaird.com", phone: "(414) 555-0219" },
    { name: "Mark Ellis", firm: "Harris Williams", title: "Director", coverage: "Industrials", email: "m.ellis@harriswilliams.com", phone: "(804) 555-0582" },
    { name: "Jennifer Walsh", firm: "Lincoln International", title: "Vice President", coverage: "Industrials", email: "j.walsh@lincolninternational.com", phone: "(312) 555-0473" },
  ],
  "Healthcare Services": [
    { name: "Rachel Stern", firm: "Houlihan Lokey", title: "Managing Director", coverage: "Healthcare Services", email: "r.stern@hl.com", phone: "(212) 555-0456" },
    { name: "James Patel", firm: "Baird", title: "Director", coverage: "Healthcare & Life Sciences", email: "j.patel@rwbaird.com", phone: "(414) 555-0881" },
    { name: "Nina Cho", firm: "William Blair", title: "Managing Director", coverage: "Healthcare Services", email: "n.cho@williamblair.com", phone: "(312) 555-0901" },
    { name: "Kevin Zhao", firm: "Houlihan Lokey", title: "Director", coverage: "Healthcare Tech", email: "k.zhao@hl.com", phone: "(212) 555-0887" },
  ],
  "Tech-Enabled Services": [
    { name: "Kevin Zhao", firm: "Houlihan Lokey", title: "Director", coverage: "Tech-Enabled Services", email: "k.zhao@hl.com", phone: "(212) 555-0887" },
    { name: "Amanda Wells", firm: "William Blair", title: "Managing Director", coverage: "Software & Tech Services", email: "a.wells@williamblair.com", phone: "(312) 555-0254" },
    { name: "Chris Morgan", firm: "Lincoln International", title: "Vice President", coverage: "Technology", email: "c.morgan@lincolninternational.com", phone: "(312) 555-0671" },
    { name: "Michael Torres", firm: "Lincoln International", title: "Managing Director", coverage: "Tech-Enabled Services", email: "m.torres@lincolninternational.com", phone: "(312) 555-0192" },
  ],
  "Consumer": [
    { name: "Laura Bennett", firm: "Harris Williams", title: "Managing Director", coverage: "Consumer & Retail", email: "l.bennett@harriswilliams.com", phone: "(804) 555-0128" },
    { name: "Robert Chan", firm: "Lincoln International", title: "Director", coverage: "Consumer Products", email: "r.chan@lincolninternational.com", phone: "(312) 555-0503" },
    { name: "Susan Fields", firm: "Raymond James", title: "Vice President", coverage: "Consumer & Food & Bev", email: "s.fields@raymondjames.com", phone: "(813) 555-0349" },
    { name: "Caroline Strickland", firm: "Harris Williams", title: "Vice President", coverage: "Consumer Services", email: "c.strickland@harriswilliams.com", phone: "(804) 555-0341" },
  ],
};

const DEFAULT_BANKERS: BankerTemplate[] = [
  { name: "Michael Torres", firm: "Lincoln International", title: "Managing Director", coverage: "Generalist LMM", email: "m.torres@lincolninternational.com", phone: "(312) 555-0192" },
  { name: "Caroline Strickland", firm: "Harris Williams", title: "Vice President", coverage: "Generalist LMM", email: "c.strickland@harriswilliams.com", phone: "(804) 555-0341" },
  { name: "Kevin Zhao", firm: "Houlihan Lokey", title: "Director", coverage: "Generalist LMM", email: "k.zhao@hl.com", phone: "(212) 555-0887" },
  { name: "Thomas Nguyen", firm: "Raymond James", title: "Managing Director", coverage: "Generalist LMM", email: "t.nguyen@raymondjames.com", phone: "(813) 555-0764" },
];

function buildBankers(choices: OnboardingChoices): BankerContact[] {
  const pool = BANKERS_BY_SECTOR[choices.sector] ?? DEFAULT_BANKERS;
  return pool.slice(0, 4).map((tmpl, i) => ({
    id: `banker-${i + 1}`,
    name: tmpl.name,
    firm: tmpl.firm,
    title: tmpl.title,
    coverage: tmpl.coverage,
    dealsShared: 0,
    lastInteraction: START_DATE,
    relationship: "cold" as const,
    email: tmpl.email,
    phone: tmpl.phone,
  }));
}

function buildTasks(choices: OnboardingChoices): Task[] {
  const d = (days: number) => addDays(START_DATE, days);
  const vcLabel = choices.valueCreation
    .slice(0, 2)
    .map((v) => VALUE_CREATION_OPTIONS.find((o) => o.value === v)?.label ?? v)
    .join(" & ");

  return [
    {
      id: `task-${uid()}`,
      title: "Finalize fund pitch deck for LP meetings",
      description: "Complete the limited partner presentation. Cover investment thesis, team, target sectors, mandate, and return projections.",
      category: "fundraising",
      priority: "high",
      status: "open",
      dueDate: d(7),
    },
    {
      id: `task-${uid()}`,
      title: "Engage fund counsel — draft LP Agreement and PPM",
      description: "Initiate engagement with fund counsel to draft LP Agreement, Private Placement Memorandum, and subscription documents.",
      category: "admin",
      priority: "high",
      status: "open",
      dueDate: d(10),
    },
    {
      id: `task-${uid()}`,
      title: "Schedule introductory LP meetings — Week 1 outreach",
      description: "Contact all five LP prospects. Book intro calls or meetings with Tier 1 LPs this week. Confirm decks are ready.",
      category: "fundraising",
      priority: "high",
      status: "open",
      dueDate: d(5),
      linkedLPId: "lp-1",
    },
    {
      id: `task-${uid()}`,
      title: `Build ${choices.sector} deal sourcing target list`,
      description: `Identify 20–30 potential acquisition targets in ${choices.sector} matching the mandate ($${choices.ebitdaMin}M–$${choices.ebitdaMax}M EBITDA). Screen against mandate criteria.`,
      category: "deal",
      priority: "medium",
      status: "open",
      dueDate: d(14),
    },
    {
      id: `task-${uid()}`,
      title: "Kick off banker relationship program",
      description: "Contact priority M&A advisors covering your sector. Send fund introduction letter and deal mandate. Request to be added to deal flow lists.",
      category: "deal",
      priority: "medium",
      status: "open",
      dueDate: d(7),
    },
    {
      id: `task-${uid()}`,
      title: `Develop value creation playbook — ${vcLabel}`,
      description: `Document the fund's core value creation thesis. Build slide for LP deck covering ${choices.valueCreation.join(", ")} initiatives.`,
      category: "lp_reporting",
      priority: "low",
      status: "open",
      dueDate: d(21),
    },
  ];
}

function buildEventFeed(choices: OnboardingChoices): EventFeedItem[] {
  const vcSummary = choices.valueCreation
    .map((v) => VALUE_CREATION_OPTIONS.find((o) => o.value === v)?.label ?? v)
    .join(", ");

  return [
    {
      id: `evt-launch-${uid()}`,
      date: START_DATE,
      type: "time_advance",
      title: `${choices.fundName} — Fund launched`,
      description: `Week 1, Day 1. ${choices.fundName} is officially in formation. Target: $${choices.targetSize}M ${choices.sector} buyout fund focused on ${choices.geography}. Value creation focus: ${vcSummary}. Fundraising begins now.`,
      impact: "positive",
    },
  ];
}

export function buildInitialState(choices: OnboardingChoices): SimulationState {
  return {
    currentDate: START_DATE,
    fund: buildFund(choices),
    lps: buildLPs(choices),
    bankers: buildBankers(choices),
    deals: [],
    tasks: buildTasks(choices),
    eventFeed: buildEventFeed(choices),
    reputationScore: 50,
    modelingSkillScore: 40,
  };
}

export const ONBOARDING_STORAGE_KEY = "pe-sim-onboarded-v1";
