-- ============================================================================
-- PE Fund Simulator — Seed Data
-- Run this after applying the migration to populate a demo session.
-- The seed user ID is fixed ('seed-demo-user'); the live app generates its
-- own user ID in localStorage and creates its own record on first save.
-- ============================================================================

-- Demo user
INSERT INTO users (id, display_name) VALUES
  ('seed-demo-user', 'Fund Manager')
ON CONFLICT (id) DO NOTHING;

-- Fund I
INSERT INTO funds (
  id, user_id, name, vintage,
  target_size, committed_capital, called_capital,
  strategy, sector, geography,
  revenue_min, revenue_max, ebitda_min, ebitda_max,
  funding_status, management_fee, carry,
  investment_period_years, fund_life_years
) VALUES (
  'fund-1', 'seed-demo-user', 'Arcadia Capital Partners I', 2026,
  150, 47, 12,
  'Lower Middle Market Buyout', 'Business Services & Industrials', 'North America',
  10, 75, 2, 12,
  'fundraising', 2.0, 20,
  5, 10
) ON CONFLICT (id) DO NOTHING;

-- Simulation state
INSERT INTO simulation_state (user_id, fund_id, current_date, reputation_score, modeling_skill_score)
VALUES ('seed-demo-user', 'fund-1', '2026-04-29', 62, 55)
ON CONFLICT (user_id) DO NOTHING;

-- LP Prospects
INSERT INTO lp_prospects (
  id, user_id, name, type, target_commitment, committed_amount, status,
  contact_name, contact_title, location, introduction_date, last_contact_date, notes, tier
) VALUES
  ('lp-1', 'seed-demo-user', 'Hargrove Family Office', 'family_office', 15, 15, 'committed',
   'Richard Hargrove III', 'CIO', 'Greenwich, CT', '2025-09-10', '2026-03-15',
   'Strong relationship. Co-invested alongside GP in prior fund. Very supportive.', 1),
  ('lp-2', 'seed-demo-user', 'Meridian University Endowment', 'endowment', 25, 20, 'committed',
   'Patricia Walsh', 'Director of Alternatives', 'Boston, MA', '2025-08-02', '2026-04-01',
   'Requires quarterly reporting. Highly process-driven. IC approval pending final close.', 1),
  ('lp-3', 'seed-demo-user', 'Vantage Point Capital FOF', 'fund_of_funds', 20, 12, 'soft_commit',
   'James Cho', 'Managing Director', 'New York, NY', '2025-10-20', '2026-03-28',
   'Reviewing DDQ responses. Wants to see 2-3 LOIs before finalizing commitment.', 1),
  ('lp-4', 'seed-demo-user', 'Clearwater Pension Fund', 'pension', 30, 0, 'prospect',
   'Susan Olawale', 'Head of PE Allocation', 'Chicago, IL', '2026-01-14', '2026-02-20',
   'Board meeting in June. Needs audited track record. Long lead time typical.', 2),
  ('lp-5', 'seed-demo-user', 'Thornwood HNW Group', 'hnw', 5, 0, 'prospect',
   'Daniel Park', 'Wealth Manager', 'Dallas, TX', '2026-02-05', '2026-04-10',
   'Smaller check but highly networked. May open doors to other family offices in Texas.', 3)
ON CONFLICT (id) DO NOTHING;

-- Bankers / Contacts
INSERT INTO contacts (
  id, user_id, name, firm, title, coverage, deals_shared, last_interaction, relationship, email, phone
) VALUES
  ('banker-1', 'seed-demo-user', 'Michael Torres', 'Lincoln International', 'Managing Director',
   'Business Services', 4, '2026-04-18', 'active', 'm.torres@lincolninternational.com', '(312) 555-0192'),
  ('banker-2', 'seed-demo-user', 'Caroline Strickland', 'Harris Williams', 'Vice President',
   'Industrials & Manufacturing', 3, '2026-04-05', 'warm', 'c.strickland@harriswilliams.com', '(804) 555-0341'),
  ('banker-3', 'seed-demo-user', 'Kevin Zhao', 'Houlihan Lokey', 'Director',
   'Tech-Enabled Services', 2, '2026-03-22', 'warm', 'k.zhao@hl.com', '(212) 555-0887'),
  ('banker-4', 'seed-demo-user', 'Alicia Brennan', 'Baird', 'Senior Vice President',
   'Healthcare Services', 1, '2026-02-14', 'cold', 'a.brennan@rwbaird.com', '(414) 555-0219'),
  ('banker-5', 'seed-demo-user', 'Thomas Nguyen', 'Raymond James', 'Managing Director',
   'Distribution & Logistics', 2, '2026-04-12', 'active', 't.nguyen@raymondjames.com', '(813) 555-0764')
ON CONFLICT (id) DO NOTHING;

-- Deals
INSERT INTO deals (
  id, user_id, company_name, sector, revenue, ebitda, ask_multiple, implied_ev,
  stage, source_type, sourced_from, process_deadline, entry_date, notes, irr, moic, management_quality
) VALUES
  ('deal-1', 'seed-demo-user', 'Apex Field Services', 'Industrials', 48, 7.2, 7.5, 54,
   'due_diligence', 'banker', 'Lincoln International', '2026-05-15', '2026-02-10',
   'Strong route density. Management team rollover expected. QofE underway.', 28, 2.8, 4),
  ('deal-2', 'seed-demo-user', 'PrecisionTech Distribution', 'Distribution', 62, 8.5, 8.0, 68,
   'loi_sent', 'banker', 'Harris Williams', '2026-05-30', '2026-03-01',
   'LOI submitted at $65M. Negotiating exclusivity. Seller wants fast close.', 24, 2.5, 4),
  ('deal-3', 'seed-demo-user', 'Cornerstone HR Solutions', 'Business Services', 22, 3.8, 7.0, 26.6,
   'initial_review', 'referral', 'Richard Hargrove III', '2026-06-10', '2026-03-20',
   'Proprietary referral from LP. PEO/HRO crossover. Reviewing CIM now.', NULL, NULL, 3),
  ('deal-4', 'seed-demo-user', 'Brightwave Managed IT', 'Tech-Enabled Services', 18, 4.1, 9.0, 36.9,
   'passed', 'banker', 'Houlihan Lokey', NULL, '2026-01-15',
   'Passed — valuation too rich at 9x. Low recurring revenue base for the ask.', NULL, NULL, 3),
  ('deal-5', 'seed-demo-user', 'Summit Environmental Services', 'Industrials', 35, 5.6, 7.0, 39.2,
   'negotiation', 'proprietary', 'Cold Outreach', '2026-05-08', '2025-11-01',
   'Proprietary. 18-month relationship. Seller wants $40M. Working toward $38M.', 31, 3.1, 5),
  ('deal-6', 'seed-demo-user', 'Keystone Packaging Group', 'Industrials', 55, 9.1, 7.2, 65.5,
   'sourced', 'banker', 'Raymond James', '2026-07-15', '2026-04-20',
   'Just received teaser. Broad process expected. Reviewing fit.', NULL, NULL, 3),
  ('deal-7', 'seed-demo-user', 'Verity Specialty Staffing', 'Business Services', 29, 3.1, 6.5, 20.2,
   'portfolio', 'proprietary', 'Direct Outreach', NULL, '2025-06-01',
   'Closed Fund I Platform #1. 100-day plan underway. CFO hire in progress.', 27, 2.6, 4),
  ('deal-8', 'seed-demo-user', 'Ridgeline Safety Systems', 'Industrials', 41, 6.8, 7.8, 53,
   'initial_review', 'banker', 'Baird', '2026-06-30', '2026-04-01',
   'Strong safety compliance niche. Reviewing management history and customer concentration.', NULL, NULL, 4)
ON CONFLICT (id) DO NOTHING;

-- Tasks (4 sample deadline tasks + 10 regular tasks)
INSERT INTO tasks (
  id, user_id, title, description, category, priority, status, due_date, linked_deal_id, linked_lp_id
) VALUES
  -- Sample deadline tasks (short-dated, demonstrate time-advance mechanics)
  ('deadline-1', 'seed-demo-user',
   'LP follow-up email — Vantage Point Capital',
   'Send James Cho a quick update: fund progress, two new LOIs in flight, re-confirm soft commit timeline. Due tomorrow.',
   'fundraising', 'high', 'open', '2026-04-30', NULL, 'lp-3'),
  ('deadline-2', 'seed-demo-user',
   'Submit IOI — Apex Field Services',
   'Preliminary indication of interest to Lincoln International. Proposed EV range $50–56M. Needs GP sign-off before submission.',
   'deal', 'high', 'open', '2026-05-03', 'deal-1', NULL),
  ('deadline-3', 'seed-demo-user',
   'IC Memo — Summit Environmental Services',
   'Investment Committee memo covering thesis, management assessment, LBO returns, risks and mitigants. Full IC scheduled May 6.',
   'deal', 'high', 'open', '2026-05-06', 'deal-5', NULL),
  ('deadline-4', 'seed-demo-user',
   'Lender call — senior debt financing for Summit Environmental',
   'Intro call with Golub Capital and Antares to discuss leverage package for Summit. 4.5x senior / 5.5x total targeted.',
   'deal', 'medium', 'open', '2026-05-09', 'deal-5', NULL),
  -- Regular tasks
  ('task-1', 'seed-demo-user',
   'Finalize QofE scope for Apex Field Services',
   'Confirm Quality of Earnings scope with Kroll. Agree on EBITDA add-backs list.',
   'deal', 'high', 'open', '2026-05-02', 'deal-1', NULL),
  ('task-2', 'seed-demo-user',
   'Follow up with Vantage Point Capital on DDQ responses',
   'Send revised DDQ with performance attribution section. Request call to discuss.',
   'fundraising', 'high', 'open', '2026-05-05', NULL, 'lp-3'),
  ('task-3', 'seed-demo-user',
   'Submit IOI for PrecisionTech Distribution',
   'Management call review complete. Submit $65M IOI before process deadline.',
   'deal', 'high', 'completed', '2026-04-25', 'deal-2', NULL),
  ('task-4', 'seed-demo-user',
   'Prepare Q1 LP update letter',
   'Draft fund update covering portfolio company performance and pipeline.',
   'lp_reporting', 'medium', 'open', '2026-05-15', NULL, NULL),
  ('task-5', 'seed-demo-user',
   'Build LBO model for Summit Environmental',
   'Complete base/upside/downside cases. Sensitize on multiple and leverage.',
   'modeling', 'high', 'open', '2026-05-06', 'deal-5', NULL),
  ('task-6', 'seed-demo-user',
   'Schedule management meeting — Cornerstone HR',
   'Coordinate with banker for management presentation. Bring deal team.',
   'deal', 'medium', 'open', '2026-05-20', 'deal-3', NULL),
  ('task-7', 'seed-demo-user',
   'Verity Staffing: CFO candidate review',
   'Review shortlist from Korn Ferry. Interview top 3. Target hire by June 1.',
   'operations', 'high', 'open', '2026-05-10', 'deal-7', NULL),
  ('task-8', 'seed-demo-user',
   'Send re-engagement note to Clearwater Pension',
   'Send materials ahead of their June board meeting. Include fund snapshot.',
   'fundraising', 'medium', 'open', '2026-05-25', NULL, 'lp-4'),
  ('task-9', 'seed-demo-user',
   'Review Keystone Packaging teaser',
   'Screen against mandate. Decide on CIM request. Flag to deal team.',
   'deal', 'low', 'open', '2026-05-30', 'deal-6', NULL),
  ('task-10', 'seed-demo-user',
   'Negotiate Summit Environmental purchase agreement',
   'Markup SPA with counsel. Push back on reps and indemnification basket.',
   'deal', 'high', 'open', '2026-05-08', 'deal-5', NULL)
ON CONFLICT (id) DO NOTHING;

-- Events (20 feed items, newest first)
INSERT INTO events (id, user_id, event_date, type, title, description, impact) VALUES
  ('evt-1',  'seed-demo-user', '2026-04-29', 'time_advance',
   'Simulation started',
   'Welcome to Arcadia Capital Partners I. Fund is in active fundraising. Three deals in late stages.',
   'neutral'),
  ('evt-2',  'seed-demo-user', '2026-04-28', 'deal_update',
   'Apex Field Services — QofE kickoff',
   'Quality of Earnings process kicked off with Kroll. Preliminary EBITDA confirmed at $7.2M TTM.',
   'positive'),
  ('evt-3',  'seed-demo-user', '2026-04-25', 'task_completed',
   'IOI submitted — PrecisionTech Distribution',
   'Indication of Interest submitted at $65M EV. Seller acknowledged receipt. Awaiting process update.',
   'positive'),
  ('evt-4',  'seed-demo-user', '2026-04-20', 'deal_update',
   'Keystone Packaging teaser received',
   'Raymond James sent teaser for Keystone Packaging Group ($55M revenue). Broad process. Reviewing mandate fit.',
   'neutral'),
  ('evt-5',  'seed-demo-user', '2026-04-18', 'lp_update',
   'Call with Michael Torres (Lincoln Int''l)',
   'Michael flagged two potential Q3 processes. Invited deal team to preview next week.',
   'positive'),
  ('evt-6',  'seed-demo-user', '2026-04-15', 'lp_update',
   'Meridian Endowment — IC approval advancing',
   'Patricia Walsh confirmed IC meeting scheduled for May 20. Full commitment of $20M likely to close.',
   'positive'),
  ('evt-7',  'seed-demo-user', '2026-04-12', 'deal_update',
   'Summit Environmental — exclusivity discussions',
   'Seller agreed to a two-week exclusivity period. Counsel engaged for SPA drafting.',
   'positive'),
  ('evt-8',  'seed-demo-user', '2026-04-10', 'lp_update',
   'Thornwood HNW — initial call',
   'Introductory call with Daniel Park. Positive tone. Sent fund deck and sample LP report.',
   'neutral'),
  ('evt-9',  'seed-demo-user', '2026-04-05', 'deal_update',
   'Brightwave Managed IT — passed',
   'Passed on Brightwave at 9x ask. Notified Caroline Strickland. Maintained banker relationship.',
   'neutral'),
  ('evt-10', 'seed-demo-user', '2026-04-01', 'deal_update',
   'Ridgeline Safety Systems — CIM received',
   'Full CIM received from Baird. Screening against mandate. Customer concentration noted.',
   'neutral'),
  ('evt-11', 'seed-demo-user', '2026-03-28', 'lp_update',
   'Vantage Point Capital — DDQ submitted',
   'Responded to DDQ. James Cho flagged he wants to see deal pipeline progress before committing.',
   'neutral'),
  ('evt-12', 'seed-demo-user', '2026-03-22', 'modeling',
   'LBO model — Apex completed',
   'Initial LBO model shows 26-30% IRR range. Base case 2.7x MOIC on 5-year hold. Sent to IC.',
   'positive'),
  ('evt-13', 'seed-demo-user', '2026-03-15', 'lp_update',
   'Hargrove Family Office — final close confirmed',
   'Richard Hargrove confirmed full $15M commitment. Wire instructions sent. Closes at next quarterly date.',
   'positive'),
  ('evt-14', 'seed-demo-user', '2026-03-01', 'deal_update',
   'PrecisionTech Distribution — management call',
   'Strong management call. CEO has been with company 11 years. Margin expansion thesis intact.',
   'positive'),
  ('evt-15', 'seed-demo-user', '2026-02-20', 'lp_update',
   'Clearwater Pension — first meeting',
   'Initial pitch to Susan Olawale. Positive feedback. Long lead time expected — board meets in June.',
   'neutral'),
  ('evt-16', 'seed-demo-user', '2026-02-10', 'deal_update',
   'Apex Field Services — entered due diligence',
   'Signed LOI. Management team fully engaged. QofE, legal, and environmental diligence tracks initiated.',
   'positive'),
  ('evt-17', 'seed-demo-user', '2026-01-14', 'lp_update',
   'Clearwater Pension — introduction via network',
   'Introduction to Clearwater Pension through Meridian Endowment network. Scheduled intro call.',
   'positive'),
  ('evt-18', 'seed-demo-user', '2026-01-05', 'reputation_change',
   'Fund reputation milestone: 47%',
   'Committed capital at 47% of target. Reputation score upgraded on fundraising progress.',
   'positive'),
  ('evt-19', 'seed-demo-user', '2025-11-01', 'deal_update',
   'Summit Environmental — proprietary sourcing',
   '18-month outreach campaign resulted in seller engagement. Confidentiality agreement signed.',
   'positive'),
  ('evt-20', 'seed-demo-user', '2025-06-01', 'deal_update',
   'Verity Specialty Staffing — closed',
   'Fund I platform investment #1 closed at $20.2M EV. 100-day value creation plan launched.',
   'positive')
ON CONFLICT (id) DO NOTHING;
