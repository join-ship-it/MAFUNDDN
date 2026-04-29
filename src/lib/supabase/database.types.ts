// Manually-written database types matching the schema in
// supabase/migrations/20260429000001_initial_schema.sql

export interface UserRow {
  id: string;
  display_name: string;
  created_at: string;
}

export interface FundRow {
  id: string;
  user_id: string;
  name: string;
  vintage: number | null;
  target_size: number | null;
  committed_capital: number | null;
  called_capital: number | null;
  strategy: string | null;
  sector: string | null;
  geography: string | null;
  revenue_min: number | null;
  revenue_max: number | null;
  ebitda_min: number | null;
  ebitda_max: number | null;
  funding_status: string;
  management_fee: number | null;
  carry: number | null;
  investment_period_years: number | null;
  fund_life_years: number | null;
  created_at: string;
  updated_at: string;
}

export interface SimulationStateRow {
  user_id: string;
  fund_id: string | null;
  current_date: string;
  reputation_score: number;
  modeling_skill_score: number;
  updated_at: string;
}

export interface LPProspectRow {
  id: string;
  user_id: string;
  fund_id: string | null;
  name: string;
  type: string | null;
  target_commitment: number | null;
  committed_amount: number | null;
  status: string;
  contact_name: string | null;
  contact_title: string | null;
  location: string | null;
  introduction_date: string | null;
  last_contact_date: string | null;
  notes: string | null;
  tier: number | null;
  created_at: string;
}

export interface ContactRow {
  id: string;
  user_id: string;
  name: string;
  firm: string | null;
  title: string | null;
  coverage: string | null;
  deals_shared: number | null;
  last_interaction: string | null;
  relationship: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export interface DealRow {
  id: string;
  user_id: string;
  fund_id: string | null;
  company_name: string;
  sector: string | null;
  revenue: number | null;
  ebitda: number | null;
  ask_multiple: number | null;
  implied_ev: number | null;
  stage: string;
  source_type: string | null;
  sourced_from: string | null;
  process_deadline: string | null;
  entry_date: string | null;
  notes: string | null;
  irr: number | null;
  moic: number | null;
  management_quality: number | null;
  created_at: string;
}

export interface TaskRow {
  id: string;
  user_id: string;
  fund_id: string | null;
  title: string;
  description: string | null;
  category: string | null;
  priority: string | null;
  status: string;
  due_date: string | null;
  linked_deal_id: string | null;
  linked_lp_id: string | null;
  created_at: string;
}

export interface EventRow {
  id: string;
  user_id: string;
  event_date: string;
  type: string;
  title: string;
  description: string | null;
  impact: string | null;
  created_at: string;
}

export interface ModelingSubmissionRow {
  id: string;
  user_id: string;
  deal_id: string | null;
  entry_ev: number | null;
  entry_debt: number | null;
  revenue_growth: number | null;
  ebitda_margin_exit: number | null;
  exit_multiple: number | null;
  hold_years: number | null;
  projected_irr: number | null;
  projected_moic: number | null;
  submitted_at: string;
}
