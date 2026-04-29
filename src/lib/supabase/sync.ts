import { supabase } from "./client";
import type {
  SimulationState,
  Fund,
  LP,
  BankerContact,
  Deal,
  Task,
  EventFeedItem,
} from "@/lib/types";
import type {
  FundRow,
  LPProspectRow,
  ContactRow,
  DealRow,
  TaskRow,
  EventRow,
} from "./database.types";

// ─── Row → TypeScript mappers ─────────────────────────────────────────────────

function mapFund(r: FundRow): Fund {
  return {
    id: r.id,
    name: r.name,
    vintage: r.vintage ?? 0,
    targetSize: r.target_size ?? 0,
    committedCapital: r.committed_capital ?? 0,
    calledCapital: r.called_capital ?? 0,
    strategy: r.strategy ?? "",
    sector: r.sector ?? "",
    geography: r.geography ?? "",
    revenueMin: r.revenue_min ?? 0,
    revenueMax: r.revenue_max ?? 0,
    ebitdaMin: r.ebitda_min ?? 0,
    ebitdaMax: r.ebitda_max ?? 0,
    fundingStatus: (r.funding_status as Fund["fundingStatus"]) ?? "fundraising",
    managementFee: r.management_fee ?? 0,
    carry: r.carry ?? 0,
    investmentPeriodYears: r.investment_period_years ?? 5,
    fundLifeYears: r.fund_life_years ?? 10,
  };
}

function mapLP(r: LPProspectRow): LP {
  return {
    id: r.id,
    name: r.name,
    type: (r.type as LP["type"]) ?? "family_office",
    targetCommitment: r.target_commitment ?? 0,
    committedAmount: r.committed_amount ?? 0,
    status: (r.status as LP["status"]) ?? "prospect",
    contactName: r.contact_name ?? "",
    contactTitle: r.contact_title ?? "",
    location: r.location ?? "",
    introductionDate: r.introduction_date ?? "",
    lastContactDate: r.last_contact_date ?? "",
    notes: r.notes ?? "",
    tier: (r.tier as LP["tier"]) ?? 3,
  };
}

function mapBanker(r: ContactRow): BankerContact {
  return {
    id: r.id,
    name: r.name,
    firm: r.firm ?? "",
    title: r.title ?? "",
    coverage: r.coverage ?? "",
    dealsShared: r.deals_shared ?? 0,
    lastInteraction: r.last_interaction ?? "",
    relationship: (r.relationship as BankerContact["relationship"]) ?? "cold",
    email: r.email ?? "",
    phone: r.phone ?? "",
  };
}

function mapDeal(r: DealRow): Deal {
  return {
    id: r.id,
    companyName: r.company_name,
    sector: r.sector ?? "",
    revenue: r.revenue ?? 0,
    ebitda: r.ebitda ?? 0,
    askMultiple: r.ask_multiple ?? 0,
    impliedEV: r.implied_ev ?? 0,
    stage: (r.stage as Deal["stage"]) ?? "sourced",
    sourceType: (r.source_type as Deal["sourceType"]) ?? "banker",
    sourcedFrom: r.sourced_from ?? "",
    processDeadline: r.process_deadline,
    entryDate: r.entry_date ?? "",
    notes: r.notes ?? "",
    irr: r.irr ?? undefined,
    moic: r.moic ?? undefined,
    managementQuality: (r.management_quality as Deal["managementQuality"]) ?? 3,
  };
}

function mapTask(r: TaskRow): Task {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? "",
    category: (r.category as Task["category"]) ?? "admin",
    priority: (r.priority as Task["priority"]) ?? "medium",
    status: (r.status as Task["status"]) ?? "open",
    dueDate: r.due_date ?? "",
    linkedDealId: r.linked_deal_id ?? undefined,
    linkedLPId: r.linked_lp_id ?? undefined,
  };
}

function mapEvent(r: EventRow): EventFeedItem {
  return {
    id: r.id,
    date: r.event_date,
    type: (r.type as EventFeedItem["type"]) ?? "deal_update",
    title: r.title,
    description: r.description ?? "",
    impact: (r.impact as EventFeedItem["impact"]) ?? "neutral",
  };
}

// ─── TypeScript → Row mappers ─────────────────────────────────────────────────

function fundToRow(userId: string, f: Fund): Omit<FundRow, "created_at" | "updated_at"> {
  return {
    id: f.id,
    user_id: userId,
    name: f.name,
    vintage: f.vintage,
    target_size: f.targetSize,
    committed_capital: f.committedCapital,
    called_capital: f.calledCapital,
    strategy: f.strategy,
    sector: f.sector,
    geography: f.geography,
    revenue_min: f.revenueMin,
    revenue_max: f.revenueMax,
    ebitda_min: f.ebitdaMin,
    ebitda_max: f.ebitdaMax,
    funding_status: f.fundingStatus,
    management_fee: f.managementFee,
    carry: f.carry,
    investment_period_years: f.investmentPeriodYears,
    fund_life_years: f.fundLifeYears,
  };
}

function lpToRow(userId: string, l: LP): Omit<LPProspectRow, "created_at"> {
  return {
    id: l.id,
    user_id: userId,
    fund_id: null,
    name: l.name,
    type: l.type,
    target_commitment: l.targetCommitment,
    committed_amount: l.committedAmount,
    status: l.status,
    contact_name: l.contactName,
    contact_title: l.contactTitle,
    location: l.location,
    introduction_date: l.introductionDate || null,
    last_contact_date: l.lastContactDate || null,
    notes: l.notes,
    tier: l.tier,
  };
}

function bankerToRow(userId: string, b: BankerContact): Omit<ContactRow, "created_at"> {
  return {
    id: b.id,
    user_id: userId,
    name: b.name,
    firm: b.firm,
    title: b.title,
    coverage: b.coverage,
    deals_shared: b.dealsShared,
    last_interaction: b.lastInteraction || null,
    relationship: b.relationship,
    email: b.email,
    phone: b.phone,
  };
}

function dealToRow(userId: string, d: Deal): Omit<DealRow, "created_at"> {
  return {
    id: d.id,
    user_id: userId,
    fund_id: null,
    company_name: d.companyName,
    sector: d.sector,
    revenue: d.revenue,
    ebitda: d.ebitda,
    ask_multiple: d.askMultiple,
    implied_ev: d.impliedEV,
    stage: d.stage,
    source_type: d.sourceType,
    sourced_from: d.sourcedFrom,
    process_deadline: d.processDeadline,
    entry_date: d.entryDate,
    notes: d.notes,
    irr: d.irr ?? null,
    moic: d.moic ?? null,
    management_quality: d.managementQuality,
  };
}

function taskToRow(userId: string, t: Task): Omit<TaskRow, "created_at"> {
  return {
    id: t.id,
    user_id: userId,
    fund_id: null,
    title: t.title,
    description: t.description,
    category: t.category,
    priority: t.priority,
    status: t.status,
    due_date: t.dueDate || null,
    linked_deal_id: t.linkedDealId ?? null,
    linked_lp_id: t.linkedLPId ?? null,
  };
}

function eventToRow(userId: string, e: EventFeedItem): Omit<EventRow, "created_at"> {
  return {
    id: e.id,
    user_id: userId,
    event_date: e.date,
    type: e.type,
    title: e.title,
    description: e.description,
    impact: e.impact ?? null,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function loadStateFromSupabase(
  userId: string
): Promise<SimulationState | null> {
  if (!supabase) return null;

  const { data: simState, error: simErr } = await supabase
    .from("simulation_state")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (simErr || !simState) return null;

  const [fundsRes, lpsRes, contactsRes, dealsRes, tasksRes, eventsRes] =
    await Promise.all([
      supabase.from("funds").select("*").eq("user_id", userId),
      supabase.from("lp_prospects").select("*").eq("user_id", userId),
      supabase.from("contacts").select("*").eq("user_id", userId),
      supabase.from("deals").select("*").eq("user_id", userId),
      supabase.from("tasks").select("*").eq("user_id", userId),
      supabase
        .from("events")
        .select("*")
        .eq("user_id", userId)
        .order("event_date", { ascending: false }),
    ]);

  const fundRow = (fundsRes.data ?? []).find(
    (f: FundRow) => f.id === simState.fund_id
  );
  if (!fundRow) return null;

  return {
    currentDate: simState.current_date,
    reputationScore: simState.reputation_score,
    modelingSkillScore: simState.modeling_skill_score,
    fund: mapFund(fundRow as FundRow),
    lps: (lpsRes.data ?? []).map((r: LPProspectRow) => mapLP(r)),
    bankers: (contactsRes.data ?? []).map((r: ContactRow) => mapBanker(r)),
    deals: (dealsRes.data ?? []).map((r: DealRow) => mapDeal(r)),
    tasks: (tasksRes.data ?? []).map((r: TaskRow) => mapTask(r)),
    eventFeed: (eventsRes.data ?? []).map((r: EventRow) => mapEvent(r)),
  };
}

export async function saveStateToSupabase(
  userId: string,
  state: SimulationState
): Promise<void> {
  if (!supabase) return;

  await supabase
    .from("users")
    .upsert({ id: userId, display_name: "Fund Manager" }, { onConflict: "id" });

  await supabase
    .from("funds")
    .upsert(fundToRow(userId, state.fund), { onConflict: "id" });

  await supabase.from("simulation_state").upsert(
    {
      user_id: userId,
      fund_id: state.fund.id,
      current_date: state.currentDate,
      reputation_score: state.reputationScore,
      modeling_skill_score: state.modelingSkillScore,
    },
    { onConflict: "user_id" }
  );

  if (state.lps.length > 0) {
    await supabase
      .from("lp_prospects")
      .upsert(state.lps.map((l) => lpToRow(userId, l)), { onConflict: "id" });
  }

  if (state.bankers.length > 0) {
    await supabase
      .from("contacts")
      .upsert(state.bankers.map((b) => bankerToRow(userId, b)), {
        onConflict: "id",
      });
  }

  if (state.deals.length > 0) {
    await supabase
      .from("deals")
      .upsert(state.deals.map((d) => dealToRow(userId, d)), {
        onConflict: "id",
      });
  }

  if (state.tasks.length > 0) {
    await supabase
      .from("tasks")
      .upsert(state.tasks.map((t) => taskToRow(userId, t)), {
        onConflict: "id",
      });
  }

  if (state.eventFeed.length > 0) {
    await supabase
      .from("events")
      .upsert(state.eventFeed.map((e) => eventToRow(userId, e)), {
        onConflict: "id",
      });
  }
}
