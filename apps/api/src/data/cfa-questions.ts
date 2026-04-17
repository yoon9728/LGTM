import type { Question } from "./questions.js";

// Canadian CFA Level 1 — scenario-based concept recognition (no calculations).
// Level 1 tests knowledge and comprehension: identify the concept/standard that applies,
// not multi-layered judgment. Canadian context (CIRO/CSA, IFRS) used lightly where relevant.

export const cfaQuestions: Question[] = [

  // ════════════════════════════════════════════════════════
  //  ETHICS AND PROFESSIONAL STANDARDS
  // ════════════════════════════════════════════════════════

  {
    id: "cfa_ethics_001",
    category: "cfa",
    type: "ethics",
    difficulty: "easy",
    guest: true,
    title: "Analyst shares a draft report with a friend before publication",
    prompt: `Liam, a CFA charterholder in Toronto, finishes his "Buy" recommendation on a TSX-listed stock. Before the report is published to clients the next morning, he emails a copy to his best friend so his friend can trade on it first.

Which CFA Institute Standard has Liam most likely violated, and what is the core issue?`,
    diff: "",
    rubric: {
      mustCover: [
        "Standard III(B) Fair Dealing requires members to deal fairly with all clients when disseminating investment recommendations — pre-releasing to one person disadvantages other clients.",
        "The friend is being given a material information advantage before clients receive the recommendation, which is the core fairness violation.",
        "The proper action is to distribute the recommendation simultaneously to all clients through the firm's normal channels.",
      ],
      strongSignals: [
        "Names Standard III(B) Fair Dealing specifically.",
        "Notes that even if the friend is not a client, disadvantaging the firm's clients is still a violation.",
      ],
      weakPatterns: [
        "Claims this is a Standard II(A) MNPI issue — the report itself is not MNPI, the concern is fair dissemination.",
        "Says it's fine because the friend is not a client.",
      ],
    },
  },

  {
    id: "cfa_ethics_002",
    category: "cfa",
    type: "ethics",
    difficulty: "easy",
    title: "Analyst adds CFA letters to his title before passing Level III",
    prompt: `Noah passed Level II last month and signs up for Level III in a year. On his new business cards, he prints "Noah Kim, CFA" under his name.

Which CFA Institute Standard does this violate, and why?`,
    diff: "",
    rubric: {
      mustCover: [
        "Standard VII(B) Reference to CFA Institute, the CFA Designation, and the CFA Program — the CFA designation may only be used after passing all three levels AND being awarded the charter.",
        "Using 'CFA' as a suffix before charter award misrepresents one's credentials.",
        "Noah may state that he is a 'Level III Candidate' but cannot use 'CFA' as a designation.",
      ],
      strongSignals: [
        "Explicitly names Standard VII(B).",
        "Distinguishes 'CFA Candidate' (allowed, with level) from 'CFA' suffix (not allowed until charter).",
      ],
      weakPatterns: [
        "Says it's fine because he passed Level II — charter requires all three levels plus work experience.",
        "Claims this is Standard I(C) Misrepresentation only, without identifying VII(B).",
      ],
    },
  },

  {
    id: "cfa_ethics_003",
    category: "cfa",
    type: "ethics",
    difficulty: "medium",
    title: "PM receives courtside Raptors tickets from a broker",
    prompt: `Aisha is a portfolio manager at a Toronto asset manager. A broker she routes trades to offers her two courtside Toronto Raptors tickets (value approximately CAD 2,000) as a "thank you" for the business. Aisha doesn't tell her employer.

Which CFA Institute Standard is implicated, and what should Aisha do?`,
    diff: "",
    rubric: {
      mustCover: [
        "Standard I(B) Independence and Objectivity — gifts or benefits from parties seeking to influence the member's investment decisions can compromise independence.",
        "Additionally Standard IV(A) Loyalty to Employer and Standard VI(A) Disclosure of Conflicts — Aisha must disclose this to her employer in writing and obtain permission.",
        "Best practice: decline the gift, or if accepting, disclose to employer in writing before accepting.",
      ],
      strongSignals: [
        "Notes that modest token gifts may be acceptable but CAD 2,000 courtside tickets clearly exceed that threshold.",
        "References employer's gift/entertainment policy as the governing internal rule.",
      ],
      weakPatterns: [
        "Treats it as acceptable because 'everyone does it' in the industry.",
        "Only mentions disclosure without identifying the independence concern.",
      ],
    },
  },

  {
    id: "cfa_ethics_004",
    category: "cfa",
    type: "ethics",
    difficulty: "medium",
    title: "Research note says 'guaranteed 20% return'",
    prompt: `Ethan, a CFA charterholder, writes a research note on a small-cap biotech. He concludes with: "This stock is guaranteed to return 20% in the next 12 months."

Which CFA Institute Standard does this violate?`,
    diff: "",
    rubric: {
      mustCover: [
        "Standard I(C) Misrepresentation — members must not make any misrepresentations relating to investment analysis or recommendations.",
        "No equity return can be 'guaranteed' — this language misleads clients about the nature of investment risk.",
        "Standard V(B) Communication with Clients and Prospective Clients also applies — members must distinguish fact from opinion.",
      ],
      strongSignals: [
        "Names Standard I(C) and/or V(B) explicitly.",
        "Notes that performance projections must always be framed as estimates with disclosed assumptions and risks.",
      ],
      weakPatterns: [
        "Thinks it's acceptable if Ethan has strong conviction in the thesis.",
        "Focuses only on 'aggressive' being bad, without identifying the misrepresentation standard.",
      ],
    },
  },

  {
    id: "cfa_ethics_005",
    category: "cfa",
    type: "ethics",
    difficulty: "medium",
    title: "Analyst finds MNPI through hacked documents",
    prompt: `Mei receives an anonymous email containing internal financial projections from a company she covers. The documents appear to have been obtained through a cyberattack. The information is clearly material and not public.

Under CFA Institute Standards, what must Mei do?`,
    diff: "",
    rubric: {
      mustCover: [
        "Standard II(A) Material Nonpublic Information — Mei cannot trade on or cause others to trade on this information regardless of how it was obtained.",
        "The information source (hack/leak) does not change MNPI status — passive or illicit acquisition still triggers II(A).",
        "Mei should isolate the information, not act on it, notify her compliance department, and not share it with anyone.",
      ],
      strongSignals: [
        "Explicitly cites Standard II(A).",
        "Notes the mosaic theory does NOT apply because this is a single material, nonpublic item.",
      ],
      weakPatterns: [
        "Thinks it's usable because Mei didn't steal it herself.",
        "Invokes mosaic theory to justify using the information.",
      ],
    },
  },

  // ════════════════════════════════════════════════════════
  //  QUANTITATIVE METHODS
  // ════════════════════════════════════════════════════════

  {
    id: "cfa_qm_001",
    category: "cfa",
    type: "quantitative_methods",
    difficulty: "easy",
    title: "Arithmetic mean vs geometric mean for returns",
    prompt: `A Canadian equity fund reports annual returns over three years of +50%, -30%, and +20%. An analyst shows the arithmetic mean return and calls it the fund's "average annual performance."

Why would the geometric mean be more appropriate here, conceptually?`,
    diff: "",
    rubric: {
      mustCover: [
        "Geometric mean accounts for compounding over multiple periods — it reflects the actual realized growth rate of an investment.",
        "Arithmetic mean overstates multi-period performance whenever returns are volatile (it does not reflect compounding losses and gains).",
        "Geometric mean ≤ arithmetic mean, with the gap growing as return volatility increases.",
      ],
      strongSignals: [
        "States that geometric mean is the correct measure for past multi-period performance.",
        "Notes arithmetic mean is appropriate for expected (forward-looking) single-period return.",
      ],
      weakPatterns: [
        "Claims arithmetic mean is always right because it's simpler.",
        "Confuses geometric mean with median.",
      ],
    },
  },

  {
    id: "cfa_qm_002",
    category: "cfa",
    type: "quantitative_methods",
    difficulty: "easy",
    title: "Correlation vs causation in a market study",
    prompt: `A junior analyst observes that the number of Tim Hortons store openings in Canada is highly correlated with the TSX Composite index over the past decade (r = 0.85). He concludes that Tim Hortons expansion drives the Canadian stock market.

What is the conceptual error?`,
    diff: "",
    rubric: {
      mustCover: [
        "Correlation does not imply causation — a high correlation only indicates a statistical association, not a directional cause-and-effect relationship.",
        "A third common factor (e.g., general Canadian economic growth) likely drives both Tim Hortons expansion AND stock market performance — this is a confounding variable.",
        "Spurious correlation risk — two variables can be correlated purely by chance or due to shared trend, without any causal link.",
      ],
      strongSignals: [
        "Uses the term 'confounding variable' or 'spurious correlation.'",
        "Suggests a controlled analysis or economic reasoning test before drawing causal conclusions.",
      ],
      weakPatterns: [
        "Accepts the conclusion because r = 0.85 is high.",
        "Focuses only on sample size without addressing the causation issue.",
      ],
    },
  },

  {
    id: "cfa_qm_003",
    category: "cfa",
    type: "quantitative_methods",
    difficulty: "medium",
    title: "Type I vs Type II error in manager selection",
    prompt: `A pension consultant tests whether a Canadian fund manager's excess returns are due to skill (rejecting the null of "no skill"). At 5% significance, she fails to reject — but the manager actually is skilled.

What type of error has the consultant made, and what's the conceptual consequence?`,
    diff: "",
    rubric: {
      mustCover: [
        "This is a Type II error (false negative) — failing to reject a null hypothesis when the alternative is actually true.",
        "Consequence: the consultant misses identifying a genuinely skilled manager.",
        "Type I error would be the opposite — rejecting the null of 'no skill' when the manager actually has no skill (false positive / hiring a lucky manager).",
      ],
      strongSignals: [
        "Distinguishes clearly: Type I = false positive (α), Type II = false negative (β).",
        "Notes that lowering α (significance level) increases β — there is a trade-off.",
      ],
      weakPatterns: [
        "Confuses Type I and Type II.",
        "Thinks the 5% significance level itself is the error.",
      ],
    },
  },

  {
    id: "cfa_qm_004",
    category: "cfa",
    type: "quantitative_methods",
    difficulty: "medium",
    title: "Simple random vs stratified sampling",
    prompt: `A researcher wants to estimate average savings of Canadian households. He takes a simple random sample of 500 households from across Canada. His colleague suggests instead stratifying by province and sampling proportionally within each.

Why might stratified sampling give a better estimate, conceptually?`,
    diff: "",
    rubric: {
      mustCover: [
        "Stratified sampling divides the population into homogeneous subgroups (strata) and samples within each — ensuring each stratum is represented in proportion to its population share.",
        "Reduces sampling variance when strata differ meaningfully (e.g., Alberta, Ontario, and Quebec households may have systematically different income/savings patterns).",
        "Simple random sampling may by chance over- or under-represent certain provinces, introducing noise.",
      ],
      strongSignals: [
        "Notes that stratification is most beneficial when between-strata variance is large relative to within-strata variance.",
        "Mentions the estimate is more precise (lower standard error) for a given sample size.",
      ],
      weakPatterns: [
        "Claims stratified sampling is always better regardless of strata differences.",
        "Confuses stratified with cluster sampling.",
      ],
    },
  },

  {
    id: "cfa_qm_005",
    category: "cfa",
    type: "quantitative_methods",
    difficulty: "easy",
    title: "Normal distribution interpretation",
    prompt: `An analyst says the monthly returns of a Canadian bond fund are approximately normally distributed with mean 0.5% and standard deviation 1%. She states: "About 95% of monthly returns should fall between roughly -1.5% and +2.5%."

Is her statement conceptually correct, and what property of the normal distribution is she applying?`,
    diff: "",
    rubric: {
      mustCover: [
        "She is applying the empirical rule — approximately 95% of observations fall within ±2 standard deviations of the mean in a normal distribution.",
        "Her calculation is conceptually correct: mean ± 2σ = 0.5% ± 2% = -1.5% to +2.5%.",
        "This assumes the returns are actually normally distributed — which is often an imperfect assumption for financial returns (fat tails, skew).",
      ],
      strongSignals: [
        "Notes the 68-95-99.7 rule (±1σ / ±2σ / ±3σ).",
        "Flags the limitation: real return distributions often exhibit excess kurtosis and skewness.",
      ],
      weakPatterns: [
        "Confuses 95% with ±3σ.",
        "Accepts normality assumption uncritically without noting it's an approximation.",
      ],
    },
  },

  // ════════════════════════════════════════════════════════
  //  ECONOMICS
  // ════════════════════════════════════════════════════════

  {
    id: "cfa_econ_001",
    category: "cfa",
    type: "economics",
    difficulty: "easy",
    title: "Shift in demand vs movement along the curve",
    prompt: `The price of Canadian lumber rises sharply. As a result, builders buy less lumber. Separately, a new government housing program subsidizes homebuyers, boosting demand for lumber at every price level.

For each scenario, is this a shift in the demand curve or a movement along it?`,
    diff: "",
    rubric: {
      mustCover: [
        "Price rising → quantity demanded falls is a MOVEMENT ALONG the demand curve — the demand curve itself has not changed, only the point on it.",
        "Housing subsidy → buyers want more lumber at EVERY price — this is a SHIFT of the entire demand curve to the right (increase in demand).",
        "Shifts occur when non-price factors change (income, preferences, substitutes, policy); movements occur when price changes.",
      ],
      strongSignals: [
        "Clearly distinguishes 'quantity demanded' (point on curve) from 'demand' (curve itself).",
        "Lists other demand shifters: income, prices of substitutes/complements, expectations, number of buyers.",
      ],
      weakPatterns: [
        "Calls both scenarios 'shifts.'",
        "Confuses supply and demand shifts.",
      ],
    },
  },

  {
    id: "cfa_econ_002",
    category: "cfa",
    type: "economics",
    difficulty: "easy",
    title: "Elastic vs inelastic demand",
    prompt: `A Canadian gasoline retailer raises prices by 10%. Sales volume falls by only 2%. Meanwhile, a luxury jewellery retailer raises prices by 10% and sales volume falls by 30%.

Which good has elastic demand and which has inelastic demand? What does this imply for total revenue?`,
    diff: "",
    rubric: {
      mustCover: [
        "Gasoline: inelastic demand — price elasticity (2%/10% = 0.2) is less than 1 in absolute value, so quantity is relatively insensitive to price.",
        "Luxury jewellery: elastic demand — elasticity (30%/10% = 3.0) is greater than 1, so quantity is highly sensitive to price.",
        "Revenue implication: raising price INCREASES total revenue when demand is inelastic (gasoline) and DECREASES total revenue when demand is elastic (jewellery).",
      ],
      strongSignals: [
        "Explains inelasticity drivers for gasoline (few substitutes, necessity, short time frame).",
        "Explains elasticity drivers for luxury goods (substitutes, discretionary, not a necessity).",
      ],
      weakPatterns: [
        "Reverses which good is elastic/inelastic.",
        "Ignores the revenue implication.",
      ],
    },
  },

  {
    id: "cfa_econ_003",
    category: "cfa",
    type: "economics",
    difficulty: "medium",
    title: "Identifying market structure",
    prompt: `Consider two Canadian industries: (1) the Big Five Canadian banks, which collectively dominate domestic banking, face interdependent pricing decisions, and have high barriers to entry; (2) Canadian wheat farming, where thousands of individual farmers sell an essentially identical commodity.

Identify the market structure of each.`,
    diff: "",
    rubric: {
      mustCover: [
        "Big Five banks: OLIGOPOLY — few large firms, interdependent pricing, high entry barriers, differentiated but similar products.",
        "Canadian wheat farming: PERFECT COMPETITION — many sellers, homogeneous product, no single seller can influence price, low barriers to entry/exit.",
        "Key distinguishing features across market structures are: number of sellers, product differentiation, barriers to entry, and pricing power.",
      ],
      strongSignals: [
        "Notes monopolistic competition as a middle category (differentiated products, many firms).",
        "Mentions regulatory barriers as a specific source of entry barriers for Canadian banking.",
      ],
      weakPatterns: [
        "Calls the Big Five a monopoly (it's an oligopoly — multiple firms).",
        "Confuses perfect competition with monopolistic competition.",
      ],
    },
  },

  {
    id: "cfa_econ_004",
    category: "cfa",
    type: "economics",
    difficulty: "easy",
    title: "GDP component classification",
    prompt: `For each of the following Canadian transactions, identify which GDP component (C, I, G, or NX) it primarily affects:
(a) A Canadian household buys a new refrigerator.
(b) The federal government builds a new bridge in Quebec.
(c) Bombardier sells rail cars to a buyer in Germany.
(d) A Toronto company buys a new factory machine.`,
    diff: "",
    rubric: {
      mustCover: [
        "(a) Consumption (C) — household purchase of a consumer durable.",
        "(b) Government spending (G) — public infrastructure investment is government expenditure.",
        "(c) Net exports (NX) — specifically an export (+X), increasing the NX component.",
        "(d) Investment (I) — business purchase of capital equipment is fixed investment, not consumption.",
      ],
      strongSignals: [
        "Notes that 'investment' in GDP means business capital spending, not financial investment.",
        "Mentions that government transfers (like pensions) are NOT counted in G.",
      ],
      weakPatterns: [
        "Classifies the Bombardier export as 'investment.'",
        "Classifies the factory machine as 'consumption.'",
      ],
    },
  },

  {
    id: "cfa_econ_005",
    category: "cfa",
    type: "economics",
    difficulty: "medium",
    title: "Fiscal vs monetary policy",
    prompt: `In response to a slowing Canadian economy, two actions are proposed:
(1) The Bank of Canada cuts its overnight rate by 50 bps.
(2) The federal government passes a CAD 20B infrastructure stimulus package.

Classify each as fiscal or monetary policy, and briefly describe the transmission mechanism.`,
    diff: "",
    rubric: {
      mustCover: [
        "(1) Bank of Canada rate cut = MONETARY policy — central bank influences interest rates and money supply to stimulate borrowing, investment, and consumption.",
        "(2) Federal infrastructure stimulus = FISCAL policy — government uses spending and taxation to directly affect aggregate demand.",
        "Transmission differs: monetary works through interest rates → credit → investment/consumption; fiscal works through direct government spending → jobs/income → consumption.",
      ],
      strongSignals: [
        "Notes that monetary policy tends to act with a lag (6-18 months).",
        "Mentions fiscal policy can have more immediate impact but political/implementation constraints.",
      ],
      weakPatterns: [
        "Swaps the two classifications.",
        "Says the Bank of Canada controls fiscal policy.",
      ],
    },
  },

  // ════════════════════════════════════════════════════════
  //  CORPORATE ISSUERS
  // ════════════════════════════════════════════════════════

  {
    id: "cfa_ci_001",
    category: "cfa",
    type: "corporate_issuers",
    difficulty: "easy",
    title: "Shareholder vs stakeholder conflict",
    prompt: `A Canadian mining company's CEO proposes a large dividend that would return capital to shareholders but requires scaling back environmental remediation spending in Northern Ontario. Employees, Indigenous community groups, and regulators push back.

Identify this as a conflict between which parties, and what governance concept is central?`,
    diff: "",
    rubric: {
      mustCover: [
        "This is a SHAREHOLDER vs STAKEHOLDER conflict — shareholders want higher distributions, while non-shareholder stakeholders (employees, communities, regulators) have competing interests.",
        "Stakeholder theory holds that companies have responsibilities to multiple parties beyond shareholders, not just equity holders.",
        "Governance concept: the board must balance fiduciary duty to shareholders with broader stakeholder considerations, especially where ESG/regulatory risk is involved.",
      ],
      strongSignals: [
        "Notes ESG considerations increasingly weigh in corporate governance decisions.",
        "References Canadian regulatory context — Indigenous consultation and environmental obligations are legally meaningful.",
      ],
      weakPatterns: [
        "Frames it as only a shareholder/management (principal-agent) conflict.",
        "Ignores the stakeholder dimension entirely.",
      ],
    },
  },

  {
    id: "cfa_ci_002",
    category: "cfa",
    type: "corporate_issuers",
    difficulty: "easy",
    title: "Role of the audit committee",
    prompt: `The board of a TSX-listed company has three key committees: audit, compensation, and nominating. The audit committee's specific responsibilities come under scrutiny after a restatement.

What is the primary role of the audit committee and who should serve on it?`,
    diff: "",
    rubric: {
      mustCover: [
        "The audit committee's primary role is oversight of the financial reporting process, the integrity of financial statements, internal controls, and the relationship with the external auditor.",
        "Members should be independent directors — not part of management — to preserve objectivity.",
        "At least one member should have financial expertise (financial literacy / accounting background).",
      ],
      strongSignals: [
        "Notes NI 52-110 (Canadian audit committee rules) or equivalent requirement for independence and financial literacy.",
        "Explicitly separates the audit committee role from compensation and nominating committees.",
      ],
      weakPatterns: [
        "Says the audit committee runs the audit itself (it oversees the auditor).",
        "Says management should sit on the audit committee.",
      ],
    },
  },

  {
    id: "cfa_ci_003",
    category: "cfa",
    type: "corporate_issuers",
    difficulty: "medium",
    title: "Working capital vs long-term capital needs",
    prompt: `A Canadian retailer has a strong holiday sales season but experiences a large inventory buildup in October each year before the rush. The CFO is deciding whether to finance the October inventory with: (a) a line of credit, or (b) a 10-year bond.

Which source is more appropriate and why?`,
    diff: "",
    rubric: {
      mustCover: [
        "Short-term financing should match short-term needs — the October inventory buildup is seasonal and reverses within 2-3 months, making it a working capital need.",
        "A line of credit is appropriate — it can be drawn and repaid flexibly as inventory cycles.",
        "A 10-year bond would leave the retailer paying interest for a decade on funds needed only seasonally — mismatched financing term.",
      ],
      strongSignals: [
        "Uses the term 'matching principle' — match asset duration with financing duration.",
        "Notes the 10-year bond would also have higher total interest cost over time and less flexibility.",
      ],
      weakPatterns: [
        "Chooses the bond because 'long-term debt is cheaper.'",
        "Doesn't identify the seasonal / working capital nature of the need.",
      ],
    },
  },

  {
    id: "cfa_ci_004",
    category: "cfa",
    type: "corporate_issuers",
    difficulty: "medium",
    title: "Debt vs equity capital structure",
    prompt: `A mature Canadian utility with stable cash flows is evaluating how to fund a new transmission project. The CFO is choosing between issuing new debt or new common equity.

At a conceptual level, what are the key trade-offs she should consider?`,
    diff: "",
    rubric: {
      mustCover: [
        "Debt is typically cheaper than equity (lower required return, plus interest tax shield in Canada), but increases financial leverage and bankruptcy risk.",
        "Equity does not require fixed payments and lowers leverage, but is more expensive and dilutes existing shareholders.",
        "For a mature utility with stable cash flows and predictable revenue, debt is generally more appropriate — it can be serviced reliably and the tax shield adds value.",
      ],
      strongSignals: [
        "References the trade-off theory of capital structure — optimal leverage balances tax shield against financial distress costs.",
        "Notes that regulated utilities typically operate with high leverage precisely because their cash flows are stable.",
      ],
      weakPatterns: [
        "Claims equity is always safer without acknowledging cost trade-off.",
        "Ignores the tax shield benefit of debt.",
      ],
    },
  },

  {
    id: "cfa_ci_005",
    category: "cfa",
    type: "corporate_issuers",
    difficulty: "easy",
    title: "Identifying ESG factors",
    prompt: `Three separate issues arise at a Canadian oil & gas company: (a) a pipeline leak, (b) allegations of workplace harassment, and (c) the CEO sitting on the board of a related-party supplier without disclosure.

Classify each as an E, S, or G concern.`,
    diff: "",
    rubric: {
      mustCover: [
        "(a) Pipeline leak = ENVIRONMENTAL (E) — pollution, ecological damage, emissions.",
        "(b) Workplace harassment = SOCIAL (S) — employee relations, human capital, workplace safety.",
        "(c) CEO related-party supplier without disclosure = GOVERNANCE (G) — conflicts of interest, board oversight, related-party transactions.",
      ],
      strongSignals: [
        "Notes that ESG factors can overlap (e.g., environmental incidents also have social/community impact).",
        "Mentions that governance failures often precede E/S failures — weak oversight enables other issues.",
      ],
      weakPatterns: [
        "Misclassifies the related-party issue as 'social.'",
        "Merges all three under 'ESG' without distinguishing.",
      ],
    },
  },

  // ════════════════════════════════════════════════════════
  //  FINANCIAL STATEMENT ANALYSIS
  // ════════════════════════════════════════════════════════

  {
    id: "cfa_fsa_001",
    category: "cfa",
    type: "fsa",
    difficulty: "easy",
    title: "Which financial statement answers which question",
    prompt: `An analyst asks three questions about a Canadian company reporting under IFRS:
(a) "What did the company own and owe at year-end?"
(b) "How profitable was the company this year?"
(c) "How much cash did the company actually generate from operations?"

Which financial statement answers each question?`,
    diff: "",
    rubric: {
      mustCover: [
        "(a) Balance sheet (Statement of Financial Position) — shows assets, liabilities, and equity at a point in time.",
        "(b) Income statement (Statement of Profit or Loss) — shows revenues, expenses, and net income over a period.",
        "(c) Cash flow statement — specifically the operating activities section — shows actual cash generated/used by core business.",
      ],
      strongSignals: [
        "Notes that net income and operating cash flow can differ significantly due to accruals, non-cash items, and working capital changes.",
        "Uses IFRS terminology (Statement of Financial Position) given Canadian context.",
      ],
      weakPatterns: [
        "Says income statement answers the cash question.",
        "Confuses balance sheet (point in time) with income statement (over a period).",
      ],
    },
  },

  {
    id: "cfa_fsa_002",
    category: "cfa",
    type: "fsa",
    difficulty: "easy",
    title: "Accrual vs cash basis",
    prompt: `A Canadian SaaS company receives CAD 120,000 upfront in December 2025 for a 12-month subscription starting January 2026. Under accrual accounting (IFRS), how is this treated?`,
    diff: "",
    rubric: {
      mustCover: [
        "Under accrual accounting, revenue is recognized when earned, not when cash is received — so the CAD 120,000 cannot be recognized as 2025 revenue.",
        "The cash received creates a LIABILITY: unearned revenue (deferred revenue) on the December 2025 balance sheet.",
        "Revenue is recognized CAD 10,000 per month as the service is delivered over 2026, reducing the deferred revenue liability.",
      ],
      strongSignals: [
        "Links to IFRS 15 Revenue from Contracts with Customers — performance obligations satisfied over time.",
        "Notes cash flow statement shows the full CAD 120,000 as cash inflow in 2025 even though no revenue is recognized.",
      ],
      weakPatterns: [
        "Recognizes all CAD 120,000 as 2025 revenue.",
        "Treats the upfront cash as equity rather than a liability.",
      ],
    },
  },

  {
    id: "cfa_fsa_003",
    category: "cfa",
    type: "fsa",
    difficulty: "medium",
    title: "IFRS vs US GAAP inventory difference",
    prompt: `A Canadian company reports under IFRS. A competitor reports under US GAAP and uses LIFO for inventory. The Canadian analyst comparing them asks: "Can we compare their COGS directly?"

Why is direct comparison problematic?`,
    diff: "",
    rubric: {
      mustCover: [
        "IFRS prohibits LIFO — only FIFO and weighted average cost are permitted under IFRS (IAS 2).",
        "US GAAP permits LIFO, which typically results in higher COGS and lower net income during periods of rising prices.",
        "Direct comparison of COGS / gross margin / net income between an IFRS and a LIFO-using US GAAP firm is distorted — analysts adjust using LIFO reserve disclosure (a US GAAP requirement) to restate to FIFO equivalent.",
      ],
      strongSignals: [
        "Explicitly mentions IAS 2 prohibits LIFO.",
        "Notes that the Canadian context (all Canadian public issuers on IFRS) means LIFO never appears domestically.",
      ],
      weakPatterns: [
        "Says both standards allow LIFO.",
        "Claims the difference doesn't matter for analysis.",
      ],
    },
  },

  {
    id: "cfa_fsa_004",
    category: "cfa",
    type: "fsa",
    difficulty: "medium",
    title: "Current ratio interpretation",
    prompt: `A Canadian company reports a current ratio of 0.8. The industry average is 1.5. The CEO says "We're more efficient than peers."

What is the current ratio measuring, and is the CEO's interpretation defensible?`,
    diff: "",
    rubric: {
      mustCover: [
        "Current ratio = current assets / current liabilities — it measures short-term liquidity (ability to meet obligations due within 12 months).",
        "A ratio below 1.0 means current liabilities exceed current assets — potential liquidity concern, not clearly 'efficient.'",
        "The CEO's interpretation is weak — lower current ratio could reflect tight working capital management OR liquidity risk; without more context (industry norms, cash flow patterns, access to credit lines), 'efficient' is not justified.",
      ],
      strongSignals: [
        "Mentions quick ratio as a more conservative liquidity measure (excludes inventory).",
        "Notes that interpretation depends on the business — retailers can operate at lower current ratios with predictable daily cash inflows.",
      ],
      weakPatterns: [
        "Accepts the CEO's framing uncritically.",
        "Confuses current ratio with profitability measure.",
      ],
    },
  },

  {
    id: "cfa_fsa_005",
    category: "cfa",
    type: "fsa",
    difficulty: "medium",
    title: "Cash flow statement section classification",
    prompt: `Under IFRS, classify each of the following cash flows as operating, investing, or financing:
(a) Purchase of new manufacturing equipment.
(b) Interest paid on long-term debt (company elects either classification allowed under IFRS).
(c) Dividend received from an equity investment.
(d) Repurchase of company's own common shares.`,
    diff: "",
    rubric: {
      mustCover: [
        "(a) Investing activity — purchase of long-lived productive assets (capex).",
        "(b) IFRS allows classification as either operating OR financing — US GAAP requires operating. Company must apply chosen treatment consistently.",
        "(c) IFRS allows as either operating or investing; (d) Repurchase of own shares is financing.",
      ],
      strongSignals: [
        "Correctly flags IFRS flexibility on interest and dividends vs US GAAP rigidity.",
        "Notes consistency requirement — classification choice must be applied period to period.",
      ],
      weakPatterns: [
        "Classifies the equipment purchase as operating.",
        "Says IFRS treats interest the same as US GAAP.",
      ],
    },
  },

  // ════════════════════════════════════════════════════════
  //  EQUITY
  // ════════════════════════════════════════════════════════

  {
    id: "cfa_eq_001",
    category: "cfa",
    type: "equity",
    difficulty: "easy",
    title: "Common vs preferred shares",
    prompt: `A Canadian investor is deciding between common and preferred shares of the same TSX-listed utility. The preferred pays a fixed 5% dividend; the common pays a variable 2% dividend currently.

What are the key differences between the two, conceptually?`,
    diff: "",
    rubric: {
      mustCover: [
        "Preferred shares have priority over common in dividends and on liquidation — and preferred dividends are typically fixed.",
        "Common shares typically have voting rights; most preferred shares do not.",
        "Common has upside through capital appreciation tied to company growth; preferred behaves more like a fixed-income instrument with limited upside.",
      ],
      strongSignals: [
        "Notes Canadian tax treatment — eligible Canadian dividends receive dividend tax credit regardless of common vs preferred status.",
        "Mentions cumulative vs non-cumulative preferred distinction.",
      ],
      weakPatterns: [
        "Says preferred always pays higher returns long-term.",
        "Says preferred shareholders have more voting power than common.",
      ],
    },
  },

  {
    id: "cfa_eq_002",
    category: "cfa",
    type: "equity",
    difficulty: "medium",
    title: "Market efficiency forms",
    prompt: `An analyst claims: "I can consistently beat the TSX by analyzing historical price charts." A colleague responds: "If that worked, the market wouldn't even be weak-form efficient."

Explain the three forms of market efficiency and which the colleague is invoking.`,
    diff: "",
    rubric: {
      mustCover: [
        "Weak form: all past price/volume information is reflected in current prices — technical analysis cannot produce consistent excess returns.",
        "Semi-strong form: all publicly available information is reflected — fundamental analysis on public info cannot produce consistent excess returns.",
        "Strong form: all information (public + private) is reflected — even insiders cannot produce excess returns.",
      ],
      strongSignals: [
        "Correctly notes the colleague is invoking WEAK form efficiency.",
        "Observes that if markets were strong-form efficient, insider trading would be useless — empirical evidence suggests markets are not strong-form efficient.",
      ],
      weakPatterns: [
        "Swaps definitions of weak and semi-strong.",
        "Says weak form means the market is bad at pricing.",
      ],
    },
  },

  {
    id: "cfa_eq_003",
    category: "cfa",
    type: "equity",
    difficulty: "easy",
    title: "Price-weighted vs value-weighted index",
    prompt: `The Dow Jones Industrial Average is price-weighted. The S&P/TSX Composite and S&P 500 are value-weighted (market-cap weighted).

What's the key difference, and which type gives Apple (a large company with a moderate share price) more influence?`,
    diff: "",
    rubric: {
      mustCover: [
        "Price-weighted index: influence is based on SHARE PRICE — a stock with a higher nominal share price has more weight, regardless of company size.",
        "Value-weighted (market-cap weighted): influence is based on TOTAL MARKET CAPITALIZATION (price × shares outstanding) — larger companies dominate.",
        "Apple has more influence in a value-weighted index (S&P 500) because of its massive market cap, not its share price.",
      ],
      strongSignals: [
        "Notes that stock splits affect price-weighted indices but not value-weighted indices.",
        "Mentions equal-weighted as a third approach (each stock weighted equally).",
      ],
      weakPatterns: [
        "Says value-weighted uses share price.",
        "Claims all major indices use the same methodology.",
      ],
    },
  },

  {
    id: "cfa_eq_004",
    category: "cfa",
    type: "equity",
    difficulty: "medium",
    title: "Industry life cycle stage",
    prompt: `Three Canadian industries: (a) Canadian cannabis producers, post-legalization, with rapid but volatile growth; (b) Canadian Big Five banks, with slow but steady growth and high market share; (c) Canadian print newspapers.

Identify the life cycle stage of each.`,
    diff: "",
    rubric: {
      mustCover: [
        "(a) Cannabis: GROWTH stage — rapid expansion, new market, high volatility, many new entrants, low profitability as firms invest in share.",
        "(b) Big Five banks: MATURE stage — slow growth, stable market share, high profitability, consolidated industry.",
        "(c) Print newspapers: DECLINE stage — falling demand due to digital substitution, consolidation, negative unit growth.",
      ],
      strongSignals: [
        "Notes a fifth possible stage (embryonic / pioneer) for very early stage industries.",
        "Mentions that investment thesis and valuation multiples differ sharply by stage.",
      ],
      weakPatterns: [
        "Calls the Big Five banks a 'growth' industry.",
        "Classifies print newspapers as 'mature' rather than 'declining.'",
      ],
    },
  },

  {
    id: "cfa_eq_005",
    category: "cfa",
    type: "equity",
    difficulty: "medium",
    title: "Dividend types recognition",
    prompt: `A TSX-listed Canadian company announces three distributions in one year:
(a) A regular CAD 0.50 quarterly dividend.
(b) A one-time CAD 5.00 "special dividend" from asset sale proceeds.
(c) A "stock dividend" of 1 additional share for every 20 held.

Distinguish these three conceptually.`,
    diff: "",
    rubric: {
      mustCover: [
        "(a) Regular cash dividend — ongoing distribution from earnings, signals expected future payout, embedded in valuation models.",
        "(b) Special (one-time) dividend — non-recurring cash payment, usually from extraordinary proceeds; does not signal ongoing payout level.",
        "(c) Stock dividend — distribution of additional shares rather than cash; increases share count but not shareholder wealth or company value. Similar economic effect to a stock split.",
      ],
      strongSignals: [
        "Notes that a stock dividend dilutes per-share metrics (EPS, book value per share) mechanically without changing total firm value.",
        "Mentions Canadian eligible dividend tax credit applies to cash dividends.",
      ],
      weakPatterns: [
        "Claims a stock dividend increases total shareholder wealth.",
        "Treats special dividends as part of ongoing yield.",
      ],
    },
  },

  // ════════════════════════════════════════════════════════
  //  FIXED INCOME
  // ════════════════════════════════════════════════════════

  {
    id: "cfa_fi_001",
    category: "cfa",
    type: "fixed_income",
    difficulty: "easy",
    title: "Bond price-yield relationship",
    prompt: `A Canadian investor holds a 10-year Government of Canada bond with a 3% coupon. Interest rates rise suddenly — the Bank of Canada hikes by 100 bps.

What happens to the market price of this bond, and why?`,
    diff: "",
    rubric: {
      mustCover: [
        "The bond's market PRICE FALLS — bond prices and yields move inversely.",
        "The 3% coupon is now below what newly issued bonds offer at higher prevailing rates, so this bond must sell at a discount for its yield to be competitive.",
        "The magnitude of price decline depends on the bond's duration — longer maturity bonds fall more for the same rate change.",
      ],
      strongSignals: [
        "Introduces duration as the sensitivity measure.",
        "Notes that existing holders face mark-to-market losses but still receive promised coupons and par at maturity if held to maturity.",
      ],
      weakPatterns: [
        "Says the bond price rises when rates rise.",
        "Ignores that the relationship is inverse.",
      ],
    },
  },

  {
    id: "cfa_fi_002",
    category: "cfa",
    type: "fixed_income",
    difficulty: "easy",
    title: "Credit rating scale interpretation",
    prompt: `Three Canadian corporate bonds have ratings of AAA, BBB, and BB from DBRS (Morningstar DBRS).

Classify each as investment grade or speculative ("junk"), and explain the key implication.`,
    diff: "",
    rubric: {
      mustCover: [
        "AAA = highest investment grade — very low default risk.",
        "BBB = lowest investment grade — still investment grade (minimum threshold is BBB- / Baa3).",
        "BB = speculative grade (high yield / junk) — falls below investment grade threshold, materially higher default risk, and often higher yields.",
      ],
      strongSignals: [
        "Notes investment grade / speculative threshold: BBB- or higher = IG; BB+ or lower = speculative.",
        "Mentions that many institutional mandates restrict holdings to investment grade only.",
      ],
      weakPatterns: [
        "Classifies BBB as junk.",
        "Says BB is still investment grade.",
      ],
    },
  },

  {
    id: "cfa_fi_003",
    category: "cfa",
    type: "fixed_income",
    difficulty: "medium",
    title: "Duration as interest rate sensitivity",
    prompt: `Two Canadian bonds:
(a) A 2-year Government of Canada bond with 3% coupon, modified duration ~1.9.
(b) A 20-year Government of Canada bond with 3% coupon, modified duration ~15.

Interest rates rise 100 bps. Conceptually, what does modified duration tell us about each bond's expected price change?`,
    diff: "",
    rubric: {
      mustCover: [
        "Modified duration approximates the percentage price change for a 1% change in yield — a duration of 15 means ~15% price decline for +100 bps move.",
        "The 2-year bond falls approximately 1.9% — much less sensitive to rates.",
        "Longer maturity and lower coupon both increase duration — which is why the 20-year bond is roughly 8x more sensitive to rates than the 2-year.",
      ],
      strongSignals: [
        "Notes duration is a linear approximation that works well for small changes; convexity captures curvature for larger moves.",
        "Mentions that holding longer-duration bonds during a rate-hiking cycle is risky.",
      ],
      weakPatterns: [
        "Thinks duration = maturity (they are related but distinct).",
        "Says the 2-year bond is more sensitive to rates.",
      ],
    },
  },

  {
    id: "cfa_fi_004",
    category: "cfa",
    type: "fixed_income",
    difficulty: "medium",
    title: "Callable bond features",
    prompt: `A Canadian corporate bond has a 5% coupon, matures in 10 years, and is callable by the issuer at par after 5 years. Rates fall dramatically in year 4.

What is likely to happen and why is this a disadvantage to the bondholder?`,
    diff: "",
    rubric: {
      mustCover: [
        "The issuer will likely call (redeem) the bond at par after year 5 and refinance at lower prevailing rates — call options benefit the issuer.",
        "The bondholder loses the above-market coupon (5%) and must reinvest the proceeds at lower prevailing rates — this is reinvestment risk.",
        "Callable bonds offer HIGHER yield at issuance to compensate for this risk; their price appreciation is capped near the call price when rates fall.",
      ],
      strongSignals: [
        "Mentions yield-to-worst as the more conservative yield measure for callable bonds.",
        "Notes negative convexity of callable bonds near the call price.",
      ],
      weakPatterns: [
        "Thinks callable bonds favor the investor.",
        "Ignores reinvestment risk entirely.",
      ],
    },
  },

  {
    id: "cfa_fi_005",
    category: "cfa",
    type: "fixed_income",
    difficulty: "easy",
    title: "Government vs corporate yield spread",
    prompt: `A 10-year Government of Canada bond yields 3.5%. A 10-year BBB-rated Canadian corporate bond yields 5.2%. The difference is 170 bps.

What does this spread represent, conceptually?`,
    diff: "",
    rubric: {
      mustCover: [
        "The 170 bp spread represents CREDIT SPREAD — compensation for the incremental credit/default risk of the corporate issuer relative to the Government of Canada (treated as essentially risk-free in CAD).",
        "Other components embedded in the spread: liquidity risk premium, tax differences, and any option features.",
        "Spreads widen when markets perceive higher credit risk (recession, sector stress) and narrow in risk-on environments — a useful market signal.",
      ],
      strongSignals: [
        "Distinguishes GoC (sovereign) yield curve as the Canadian benchmark for spread calculations.",
        "Notes that spread-based valuation is standard practice for corporate bonds.",
      ],
      weakPatterns: [
        "Claims the spread is purely compensation for longer maturity.",
        "Ignores the credit risk component.",
      ],
    },
  },

  // ════════════════════════════════════════════════════════
  //  DERIVATIVES
  // ════════════════════════════════════════════════════════

  {
    id: "cfa_deriv_001",
    category: "cfa",
    type: "derivatives",
    difficulty: "easy",
    title: "Forward vs futures contract",
    prompt: `A Canadian wheat farmer enters into two hedging arrangements: (a) a customized forward contract with a specific mill to sell his harvest at a set price, and (b) a standardized wheat futures contract on the ICE exchange.

What are the key conceptual differences between forwards and futures?`,
    diff: "",
    rubric: {
      mustCover: [
        "Forwards are CUSTOMIZED (any terms, any counterparty) and traded OVER-THE-COUNTER; futures are STANDARDIZED and traded on EXCHANGES.",
        "Forwards carry COUNTERPARTY (default) risk; futures use a CLEARINGHOUSE that guarantees performance — plus daily margin and mark-to-market to manage risk.",
        "Futures are highly LIQUID and easy to close early; forwards typically require finding the original counterparty to unwind and are less liquid.",
      ],
      strongSignals: [
        "Mentions daily marking-to-market as a key mechanical difference.",
        "Notes that cash flows for futures occur daily (margin), while forwards settle only at expiry.",
      ],
      weakPatterns: [
        "Says forwards and futures are economically identical with no risk distinctions.",
        "Reverses which is exchange-traded vs OTC.",
      ],
    },
  },

  {
    id: "cfa_deriv_002",
    category: "cfa",
    type: "derivatives",
    difficulty: "easy",
    title: "Call vs put option payoffs",
    prompt: `A Canadian investor buys a CAD 50 strike call on TD Bank and separately buys a CAD 50 strike put on the same stock. At expiry, TD trades at CAD 60.

Which option has value, which expires worthless, and what's the intuition?`,
    diff: "",
    rubric: {
      mustCover: [
        "CALL has value — gives the right to BUY at 50 when market is 60, so intrinsic value = CAD 10. The call holder benefits when the stock is ABOVE strike.",
        "PUT expires worthless — gives the right to SELL at 50 when market is 60; no one would choose to sell below market. The put holder benefits when stock is BELOW strike.",
        "General intuition: calls are bullish (benefit from price increases); puts are bearish (benefit from price decreases).",
      ],
      strongSignals: [
        "Mentions the premium paid upfront is a sunk cost — the 'net' P&L subtracts the premium.",
        "Notes that maximum loss is capped at the premium for an option BUYER.",
      ],
      weakPatterns: [
        "Reverses call and put directions.",
        "Thinks options always have value at expiry regardless of stock price.",
      ],
    },
  },

  {
    id: "cfa_deriv_003",
    category: "cfa",
    type: "derivatives",
    difficulty: "easy",
    title: "Interest rate swap basic concept",
    prompt: `A Canadian company has issued floating-rate debt but prefers predictable interest expense. It enters into an interest rate swap with a bank: the company pays fixed and receives floating.

What does this swap accomplish conceptually?`,
    diff: "",
    rubric: {
      mustCover: [
        "The swap converts the company's effective interest exposure from FLOATING to FIXED — it now pays fixed to the bank and receives floating, which offsets the floating debt payment, leaving a net fixed obligation.",
        "The company's goal is achieved: predictable interest expense regardless of rate movements.",
        "No principal is actually exchanged — only the interest cash flows are swapped, based on a notional amount.",
      ],
      strongSignals: [
        "Notes that swaps are typically OTC contracts subject to counterparty risk (now often centrally cleared post-2008).",
        "Mentions CDOR-to-CORRA transition as Canadian market context if relevant.",
      ],
      weakPatterns: [
        "Thinks the notional amount is actually exchanged.",
        "Reverses which direction the company is paying.",
      ],
    },
  },

  {
    id: "cfa_deriv_004",
    category: "cfa",
    type: "derivatives",
    difficulty: "medium",
    title: "Hedging vs speculation",
    prompt: `Two separate investors use derivatives:
(a) A Canadian oil producer sells (goes short) WTI crude oil futures equal to its expected production.
(b) A retail trader with no oil business buys WTI crude futures because they think prices will rise.

Classify each and explain the conceptual distinction.`,
    diff: "",
    rubric: {
      mustCover: [
        "(a) HEDGING — the oil producer has natural LONG exposure to oil prices (through its production). The short futures position OFFSETS this exposure, locking in price and reducing risk.",
        "(b) SPECULATION — the trader has no underlying exposure. The long futures position CREATES directional price risk in pursuit of profit.",
        "Key distinction: hedging REDUCES existing risk; speculation CREATES new risk for expected return.",
      ],
      strongSignals: [
        "Mentions that speculators provide liquidity that enables hedgers to find counterparties.",
        "Notes that the same derivative instrument can be used for either purpose — the label depends on the user's pre-existing exposure.",
      ],
      weakPatterns: [
        "Calls both speculation.",
        "Says hedgers are trying to profit rather than reduce risk.",
      ],
    },
  },

  {
    id: "cfa_deriv_005",
    category: "cfa",
    type: "derivatives",
    difficulty: "easy",
    title: "Arbitrage concept",
    prompt: `A Canadian trader notices that shares of a dual-listed stock are trading at CAD 50 on the TSX and USD 40 on the NYSE simultaneously. The current exchange rate makes USD 40 equivalent to CAD 54.

Is there an arbitrage opportunity and what does arbitrage mean?`,
    diff: "",
    rubric: {
      mustCover: [
        "Yes, there is an apparent arbitrage opportunity — the same security is trading at two different prices (CAD 50 on TSX vs effectively CAD 54 on NYSE).",
        "Arbitrage = simultaneously buying the lower-priced and selling the higher-priced instrument to lock in a risk-free profit.",
        "Trade: buy on TSX at CAD 50, sell on NYSE at USD 40 (≈ CAD 54), profit ≈ CAD 4 per share, subject to transaction costs, FX conversion costs, and settlement timing.",
      ],
      strongSignals: [
        "Notes that in efficient markets, true arbitrage is fleeting — traders arbitrage the gap until prices converge (law of one price).",
        "Mentions practical frictions: transaction costs, FX spreads, borrowing availability, settlement delay.",
      ],
      weakPatterns: [
        "Says there's no opportunity because prices are in different currencies.",
        "Confuses arbitrage with speculation.",
      ],
    },
  },

  // ════════════════════════════════════════════════════════
  //  ALTERNATIVE INVESTMENTS
  // ════════════════════════════════════════════════════════

  {
    id: "cfa_alt_001",
    category: "cfa",
    type: "alternatives",
    difficulty: "easy",
    title: "Characteristics of alternative investments",
    prompt: `A Canadian wealth manager considers adding 10% allocation to alternatives (private equity, real estate, hedge funds) for a client previously in 60/40 stocks/bonds.

What characteristics generally distinguish alternatives from traditional stocks and bonds?`,
    diff: "",
    rubric: {
      mustCover: [
        "Lower liquidity — alternatives often require multi-year lock-ups and lack active secondary markets, compared to publicly traded stocks/bonds.",
        "Lower transparency and less frequent pricing — fair value is estimated rather than observed in liquid markets.",
        "Often lower correlation with traditional public markets — which is the key diversification benefit.",
      ],
      strongSignals: [
        "Mentions higher fees (commonly 2/20 structure for PE/hedge funds).",
        "Notes that reported volatility can be understated due to infrequent pricing (smoothing).",
      ],
      weakPatterns: [
        "Claims alternatives are always higher return.",
        "Ignores the liquidity trade-off.",
      ],
    },
  },

  {
    id: "cfa_alt_002",
    category: "cfa",
    type: "alternatives",
    difficulty: "easy",
    title: "Direct real estate vs REIT",
    prompt: `A Canadian investor wants exposure to Canadian commercial real estate. She considers:
(a) Buying a direct equity stake in a small Toronto office building.
(b) Buying units of a publicly listed Canadian REIT (e.g., on the TSX).

What are the key conceptual differences?`,
    diff: "",
    rubric: {
      mustCover: [
        "Direct ownership is ILLIQUID (sale takes months), requires active management, and has high entry cost — but gives full control and direct tax pass-through.",
        "Public REIT units are HIGHLY LIQUID (trade on exchange), require no property management, offer diversification across many properties, and are priced daily.",
        "Public REITs show higher short-term correlation with equity markets due to public listing; direct real estate shows lower reported volatility partly due to appraisal-based (infrequent) valuations.",
      ],
      strongSignals: [
        "Notes Canadian REIT tax structure — trusts pass income through to unitholders.",
        "Mentions that REITs can be better liquidity for smaller investors lacking capital for direct purchase.",
      ],
      weakPatterns: [
        "Says direct and REIT exposures are economically identical.",
        "Claims REITs have no equity market correlation.",
      ],
    },
  },

  {
    id: "cfa_alt_003",
    category: "cfa",
    type: "alternatives",
    difficulty: "medium",
    title: "Hedge fund vs mutual fund",
    prompt: `A Canadian retail client asks: "What's the difference between a hedge fund and a mutual fund? Can I invest in one?"

How would you distinguish them, and what's the Canadian access context?`,
    diff: "",
    rubric: {
      mustCover: [
        "Hedge funds use a wider range of strategies (short-selling, leverage, derivatives); mutual funds are generally long-only with strict regulatory constraints.",
        "Hedge funds typically charge 2/20 (management + performance fee); mutual funds charge a lower management fee only.",
        "Access: hedge funds are generally restricted to accredited/institutional investors under Canadian securities rules (NI 45-106); mutual funds are available to retail investors via prospectus distribution.",
      ],
      strongSignals: [
        "Mentions liquidity difference — hedge funds have lock-ups and redemption gates, mutual funds offer daily liquidity.",
        "References CSA / NI 45-106 accredited investor exemption for Canadian context.",
      ],
      weakPatterns: [
        "Claims retail investors can freely invest in hedge funds.",
        "Says hedge funds are just unregulated mutual funds.",
      ],
    },
  },

  {
    id: "cfa_alt_004",
    category: "cfa",
    type: "alternatives",
    difficulty: "medium",
    title: "Private equity investment stages",
    prompt: `A Canadian pension plan is evaluating private equity commitments. It sees three fund types: (a) venture capital, (b) growth equity, (c) leveraged buyout.

Distinguish these three conceptually.`,
    diff: "",
    rubric: {
      mustCover: [
        "Venture capital: invests in EARLY-STAGE companies — startups with unproven business models but high growth potential. Highest risk, highest potential return.",
        "Growth equity: invests in more mature companies that are still growing — takes minority stakes in profitable businesses seeking expansion capital.",
        "Leveraged buyout: acquires MATURE, stable cash-flow businesses using significant leverage, often takes the company private, and focuses on operational improvements.",
      ],
      strongSignals: [
        "Notes the J-curve pattern common in PE returns (early losses, later gains).",
        "Mentions typical hold periods (3-7+ years) and capital call structure.",
      ],
      weakPatterns: [
        "Treats all PE as identical.",
        "Says VC targets mature, cash-flow positive businesses.",
      ],
    },
  },

  {
    id: "cfa_alt_005",
    category: "cfa",
    type: "alternatives",
    difficulty: "easy",
    title: "Why include commodities in a portfolio",
    prompt: `A Canadian investor asks whether she should add a small commodities allocation (e.g., gold, oil futures) to her portfolio.

What is the conceptual case for including commodities, and what are the risks?`,
    diff: "",
    rubric: {
      mustCover: [
        "Diversification — commodities historically have low correlation with stocks and bonds, potentially reducing portfolio volatility.",
        "Inflation hedge — commodity prices often rise with inflation, providing some protection to purchasing power (this relationship is strongest for energy and broad commodity baskets).",
        "Risks: high price volatility, no intrinsic yield (no dividend/coupon), and storage costs (for physical). Most investors access via futures or ETFs rather than physical holdings.",
      ],
      strongSignals: [
        "Notes contango/backwardation can affect futures-based commodity ETF returns.",
        "Mentions gold specifically as a safe-haven asset distinct from other commodities.",
      ],
      weakPatterns: [
        "Claims commodities always hedge inflation perfectly.",
        "Ignores the non-yielding nature of commodities.",
      ],
    },
  },

  // ════════════════════════════════════════════════════════
  //  PORTFOLIO MANAGEMENT
  // ════════════════════════════════════════════════════════

  {
    id: "cfa_pm_001",
    category: "cfa",
    type: "portfolio_management",
    difficulty: "easy",
    title: "Components of an Investment Policy Statement",
    prompt: `A new Canadian advisor is drafting an Investment Policy Statement (IPS) for a retail client. What are the major components an IPS should include, conceptually?`,
    diff: "",
    rubric: {
      mustCover: [
        "Investment OBJECTIVES: return objective and risk tolerance / risk objective — what the client wants and what risk they can accept.",
        "Investment CONSTRAINTS: liquidity needs, time horizon, tax situation, legal/regulatory factors, and unique circumstances (often summarized as LLTTU).",
        "Strategic asset allocation and a review/rebalancing process — plus benchmark selection for performance evaluation.",
      ],
      strongSignals: [
        "Distinguishes risk TOLERANCE (willingness) from risk CAPACITY (ability to take risk) — both must be considered.",
        "References Canadian regulatory context — Know-Your-Client / NI 31-103 suitability requirements tie to IPS content.",
      ],
      weakPatterns: [
        "Reduces IPS to 'just asset allocation.'",
        "Omits constraints entirely.",
      ],
    },
  },

  {
    id: "cfa_pm_002",
    category: "cfa",
    type: "portfolio_management",
    difficulty: "easy",
    title: "Risk tolerance vs risk capacity",
    prompt: `A retired Canadian client (age 70) with fixed pension income emotionally prefers to take 'more risk to grow his savings,' but he cannot afford a large portfolio decline because he relies on savings for 20+ years of retirement spending.

Distinguish risk tolerance from risk capacity and explain which constrains the portfolio.`,
    diff: "",
    rubric: {
      mustCover: [
        "Risk TOLERANCE is the willingness to take risk — a psychological/emotional attribute. The client's tolerance is HIGH.",
        "Risk CAPACITY is the ability to take risk — a financial/situational attribute. The client's capacity is LOW (fixed income, long horizon dependent on savings).",
        "When tolerance and capacity diverge, the portfolio should be guided by the LOWER of the two — here, LOW capacity constrains, regardless of the client's emotional preference.",
      ],
      strongSignals: [
        "Notes the advisor's role is to educate the client about capacity, not merely defer to stated tolerance.",
        "Connects to suitability obligation under NI 31-103 / Standard III(C) Suitability.",
      ],
      weakPatterns: [
        "Defers to the client's willingness regardless of capacity.",
        "Treats tolerance and capacity as the same concept.",
      ],
    },
  },

  {
    id: "cfa_pm_003",
    category: "cfa",
    type: "portfolio_management",
    difficulty: "medium",
    title: "Systematic vs unsystematic risk",
    prompt: `A Canadian investor holds a concentrated portfolio of 3 Canadian bank stocks. A classmate holds the TSX Composite index ETF. Both face risks.

What types of risk does each portfolio face — and which can be reduced by diversification?`,
    diff: "",
    rubric: {
      mustCover: [
        "Concentrated 3-bank portfolio: faces both SYSTEMATIC risk (broad Canadian market moves, recessions, rate changes) AND significant UNSYSTEMATIC risk (Canadian banking sector shocks, bank-specific events).",
        "TSX Composite ETF: retains SYSTEMATIC risk (market-wide) but has largely DIVERSIFIED AWAY unsystematic/sector-specific risk.",
        "Diversification can reduce unsystematic (idiosyncratic/specific) risk but cannot eliminate systematic (market) risk — this is the key lesson of modern portfolio theory.",
      ],
      strongSignals: [
        "Connects to CAPM: only systematic risk (beta) is compensated in equilibrium, because unsystematic risk can be eliminated by diversification.",
        "Notes Canadian market concentration risk — the TSX itself is heavily weighted to financials and energy, so even the index has sector concentration.",
      ],
      weakPatterns: [
        "Says diversification eliminates all risk.",
        "Reverses systematic and unsystematic definitions.",
      ],
    },
  },

  {
    id: "cfa_pm_004",
    category: "cfa",
    type: "portfolio_management",
    difficulty: "medium",
    title: "Identifying behavioral biases",
    prompt: `Three separate Canadian retail investors demonstrate behaviors:
(a) Chen refuses to sell his losing Cenovus shares until they "get back to what I paid."
(b) Sarah only reads news that supports her bullish view on Shopify.
(c) Raj is confident he can pick winning stocks because his last two picks worked.

Identify each behavioral bias.`,
    diff: "",
    rubric: {
      mustCover: [
        "(a) LOSS AVERSION / disposition effect — unwillingness to realize losses leads to holding losers too long, anchored to the purchase price.",
        "(b) CONFIRMATION BIAS — seeking only information that supports an existing belief and discounting contrary evidence.",
        "(c) OVERCONFIDENCE BIAS — overestimating one's skill based on a small, possibly lucky, sample of past results.",
      ],
      strongSignals: [
        "Notes anchoring as a related bias in (a) — the purchase price as a reference point is not economically meaningful.",
        "Mentions representativeness bias (small sample → large conclusion) as related to (c).",
      ],
      weakPatterns: [
        "Mislabels confirmation bias as herding.",
        "Describes only one bias in plain language without naming any of the three.",
      ],
    },
  },

  {
    id: "cfa_pm_005",
    category: "cfa",
    type: "portfolio_management",
    difficulty: "easy",
    title: "ETF vs mutual fund for a retail client",
    prompt: `A Canadian retail client asks whether she should use an ETF or a mutual fund for her TSX-based index exposure in her TFSA.

What are the conceptual differences, and which tends to be more cost-efficient?`,
    diff: "",
    rubric: {
      mustCover: [
        "ETFs trade intraday on an exchange at market-determined prices; mutual funds transact at end-of-day NAV.",
        "Index ETFs generally have LOWER management expense ratios (MERs) than comparable index mutual funds, and lower total cost of ownership.",
        "Both are suitable for TFSA / RRSP registered accounts in Canada — tax-efficient structures shelter all gains regardless.",
      ],
      strongSignals: [
        "Notes trading commissions may apply to ETFs (though many Canadian brokers now offer commission-free ETF trades).",
        "Mentions that mutual funds sometimes bundle trailing advisor commissions (discontinued for DIY accounts under CSA rules).",
      ],
      weakPatterns: [
        "Says ETFs and mutual funds have identical costs.",
        "Claims TFSAs tax ETF gains differently from mutual fund gains.",
      ],
    },
  },

];
