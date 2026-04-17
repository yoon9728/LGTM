import type { Question } from "./questions.js";

// Canadian CFA — scenario-based concept questions (no calculations).
// Uses Canadian regulators (CIRO, CSA), IFRS (not US GAAP), and CAD examples where relevant.
// CFA Institute Code of Ethics and Standards are global and apply to all CFA members.

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
    title: "Analyst overhears earnings guidance at an industry conference",
    prompt: `Sarah is a CFA charterholder working as an equity analyst in Toronto. At an industry conference coffee break, she overhears the CFO of Maple Retail Corp (a public company she covers) telling his colleague privately that "Q3 will crush expectations — we're looking at 30% above consensus." Sarah was not included in the conversation but heard it clearly while standing nearby.

Back at her desk, she is drafting her Maple Retail earnings preview. Should she incorporate what she overheard? What is her obligation under the CFA Institute Standards?`,
    diff: "",
    rubric: {
      mustCover: [
        "The overheard information is material nonpublic information (MNPI) — specific Q3 earnings that would move the stock price if disclosed — so Standard II(A) Material Nonpublic Information prohibits trading or causing others to trade on it.",
        "Sarah cannot use this information in her research report, recommendations, or share it with clients, even though she acquired it passively — Standard II(A) applies regardless of how MNPI was obtained.",
        "The correct action is to isolate the information, not act on it, and consider reporting it to her supervisor or compliance — she should also consider whether the CFO may have violated selective disclosure rules (mosaic theory does NOT apply because this is a single material, nonpublic fact).",
      ],
      strongSignals: [
        "Distinguishes the mosaic theory (legitimate: combining non-material public + non-public items) from this case (single material item).",
        "References the firm's responsibility under Standard IV(C) to prevent misuse and possibly establish information barriers.",
        "Notes Canadian regulatory context — similar prohibition under National Instrument 51-102 and CSA rules on selective disclosure.",
      ],
      weakPatterns: [
        "Claims it's acceptable because she 'just overheard' it — passivity of acquisition does not change MNPI status.",
        "Confuses mosaic theory to justify using the information.",
      ],
    },
  },

  {
    id: "cfa_ethics_002",
    category: "cfa",
    type: "ethics",
    difficulty: "medium",
    title: "Unsuitable trade requested by a sophisticated client",
    prompt: `David is a portfolio manager at a Vancouver wealth management firm. His client, Mr. Chen, is 68, retired, and his written Investment Policy Statement (IPS) specifies low risk tolerance, income focus, and capital preservation. Mr. Chen's portfolio is 70% fixed income, 25% dividend equities, 5% cash.

Mr. Chen calls David and insists on putting 20% of his portfolio into a leveraged junior mining ETF. When David raises concerns about suitability, Mr. Chen says: "I've been reading about it for months. I'll sign a waiver. It's my money." Mr. Chen signs a written acknowledgment confirming he understands the risk and directs David to proceed.

What is David's obligation under CFA Institute Standards?`,
    diff: "",
    rubric: {
      mustCover: [
        "Standard III(C) Suitability requires David to ensure investments are consistent with the client's written IPS — a client-signed waiver does not override this duty.",
        "David should first attempt to update the IPS itself, in writing, if Mr. Chen's risk tolerance and objectives have genuinely changed — not simply execute the trade as a one-off exception.",
        "If Mr. Chen refuses to update the IPS but insists on the trade, David should decline the trade or escalate to compliance — he cannot execute an unsuitable trade even with client instruction.",
      ],
      strongSignals: [
        "Notes that a full IPS review (not just a waiver) is required to properly reflect changed circumstances; ad-hoc exceptions risk drift and later disputes.",
        "Identifies the concentration risk (20% in a leveraged single-sector ETF) as a separate diversification issue beyond risk tolerance.",
        "References Standard V(A) Diligence and Reasonable Basis — David would also need independent analysis supporting the position.",
      ],
      weakPatterns: [
        "Concludes the signed waiver makes the trade acceptable — waivers do not replace the suitability obligation.",
        "Treats this as a purely legal/compliance question without addressing the IPS framework.",
      ],
    },
  },

  {
    id: "cfa_ethics_003",
    category: "cfa",
    type: "ethics",
    difficulty: "medium",
    title: "IPO allocation across discretionary and non-discretionary accounts",
    prompt: `Priya manages both discretionary and non-discretionary accounts at her firm in Calgary. A hot IPO is being allocated and her firm receives a small allocation relative to client demand.

Priya decides to allocate the IPO shares only to her discretionary clients because: (1) she personally made the investment decision for them, (2) she can act faster without having to call each non-discretionary client for authorization, and (3) the shares are limited and calling clients individually would delay execution past the allocation deadline.

Is Priya's allocation approach consistent with CFA Institute Standards? Justify your answer.`,
    diff: "",
    rubric: {
      mustCover: [
        "Standard III(B) Fair Dealing requires Priya to treat all suitable clients fairly in both investment action and trade allocation — discretionary vs non-discretionary status alone is not a basis for exclusion.",
        "The firm must have a written, pre-established allocation policy (e.g., pro rata across suitable eligible accounts) and apply it consistently — Priya's ad hoc reasoning based on convenience violates fair dealing.",
        "Suitability must be determined independently — if the IPO is suitable for some non-discretionary clients, they should be offered participation via a pre-agreed expedited process (e.g., indications of interest gathered before allocations).",
      ],
      strongSignals: [
        "Recommends the firm maintain a standing 'IPO interest' list so non-discretionary clients can pre-commit, removing the timing excuse.",
        "Distinguishes between excluding based on suitability (legitimate) and excluding based on operational convenience (not legitimate).",
        "Notes that documentation of the allocation process is critical for demonstrating fairness.",
      ],
      weakPatterns: [
        "Accepts operational convenience as a justification for differential treatment.",
        "Conflates discretionary authority with priority entitlement to limited supply.",
      ],
    },
  },

  {
    id: "cfa_ethics_004",
    category: "cfa",
    type: "ethics",
    difficulty: "hard",
    title: "Relying on a third-party research report for a recommendation",
    prompt: `Marcus is publishing a Buy recommendation on a mid-cap Canadian industrial company. Ninety percent of his report's thesis and financial projections are taken directly from a research report produced by a well-known U.S. sell-side firm. Marcus has read the U.S. report carefully and finds the logic compelling, but he has not independently verified the financial projections or reviewed the company's primary disclosures. Marcus cites the U.S. firm in a footnote of his report.

Under CFA Institute Standards, is Marcus's approach acceptable? What must he do differently?`,
    diff: "",
    rubric: {
      mustCover: [
        "Standard V(A) Diligence and Reasonable Basis requires Marcus to have a reasonable and adequate basis for his recommendation — simply citing another firm's work does not establish this basis; he must independently verify material claims.",
        "Standard I(C) Misrepresentation is implicated because presenting primarily derivative work without substantive independent analysis may mislead clients into believing Marcus has done the analysis himself.",
        "Marcus must either (a) conduct his own diligence on the key drivers of the thesis and financial projections, or (b) clearly represent the report as a commentary on another firm's research, not as original analysis.",
      ],
      strongSignals: [
        "Addresses Standard V(C) Record Retention — Marcus needs documentation of his own analysis, not just the third-party report.",
        "Notes that evaluating the third-party firm's reliability (methodology, track record) is a legitimate step but does not substitute for independent verification of the subject company.",
        "Distinguishes permissible use of third-party research as supporting input vs. impermissible use as the primary basis.",
      ],
      weakPatterns: [
        "Concludes the citation footnote resolves the issue — citation does not create reasonable basis.",
        "Confuses 'reasonable basis' (investment merit) with 'plagiarism' (authorship attribution) — both matter but are different.",
      ],
    },
  },

  {
    id: "cfa_ethics_005",
    category: "cfa",
    type: "ethics",
    difficulty: "medium",
    title: "Directing client trades to obtain research services (soft dollars)",
    prompt: `Jenna is a portfolio manager at a Montreal asset management firm. She consistently directs her client trades to Broker A, which charges 8 cents per share, instead of Broker B, which offers best execution at 3 cents per share. In exchange, Broker A provides Jenna's firm with a Bloomberg terminal subscription, industry conference passes for her team, and an annual client appreciation dinner at a high-end restaurant attended by portfolio managers and their spouses.

Jenna believes this is acceptable because the research services benefit her investment process. Evaluate her arrangement under CFA Institute Standards.`,
    diff: "",
    rubric: {
      mustCover: [
        "Standard III(A) Loyalty, Prudence, and Care requires Jenna to place client interests above her firm's and her own — client brokerage is the client's asset and must be used for the client's benefit.",
        "Bloomberg terminal and industry research are generally permissible soft-dollar uses (benefit the investment process for clients); conference passes may be borderline; the client appreciation dinner with spouses is NOT permissible — it's a personal benefit, not a research service.",
        "The differential commission cost (5 cents per share more) must be justified by commensurate client benefit — mixed-use services require allocation between research (paid with soft dollars) and administrative/personal portions (paid by the firm).",
      ],
      strongSignals: [
        "References the CFA Institute Soft Dollar Standards and the requirement to disclose soft dollar arrangements to clients.",
        "Notes the obligation to periodically assess whether Broker A is providing best execution adjusted for the research benefit.",
        "Recommends segregating clearly impermissible items (spousal dinner) from mixed-use items (conference).",
      ],
      weakPatterns: [
        "Concludes all items are acceptable because they relate to the firm's business.",
        "Focuses only on best execution without addressing the soft-dollar framework.",
      ],
    },
  },

  // ════════════════════════════════════════════════════════
  //  QUANTITATIVE METHODS (concept-based, no calculation)
  // ════════════════════════════════════════════════════════

  {
    id: "cfa_qm_001",
    category: "cfa",
    type: "quantitative_methods",
    difficulty: "medium",
    title: "Type I vs Type II error in a strategy backtest",
    prompt: `A quantitative team in Toronto is backtesting a new momentum factor strategy. Their null hypothesis (H0) is that the strategy has zero excess return; their alternative (H1) is that it has positive excess return. The team sets their significance level (alpha) at 10% rather than the conventional 5% because they want to "be faster to adopt promising strategies."

Describe the trade-off the team has made. In the context of deploying a trading strategy with real client capital, which error type is more costly, and how should the significance level reflect that?`,
    diff: "",
    rubric: {
      mustCover: [
        "Type I error = rejecting a true null (concluding the strategy has excess return when it actually does not) — setting alpha at 10% makes Type I errors MORE likely than at 5%.",
        "Type II error = failing to reject a false null (missing a strategy that actually works) — a higher alpha reduces Type II error (increases power), which is why the team chose it.",
        "In live trading with client capital, Type I error is typically more costly — it means deploying a useless or harmful strategy, incurring transaction costs, opportunity cost, and potentially losses; the conventional 5% (or stricter) threshold is prudent for this reason.",
      ],
      strongSignals: [
        "Notes that multiple-testing bias across many candidate strategies compounds Type I error (data mining), arguing for even stricter alpha in a backtest pipeline.",
        "Suggests additional safeguards: out-of-sample testing, walk-forward validation, Bonferroni or FDR correction — not just a single p-value threshold.",
        "Distinguishes statistical significance from economic significance (after transaction costs, slippage, capacity).",
      ],
      weakPatterns: [
        "Confuses the direction — claiming 10% alpha reduces Type I error.",
        "Treats significance level as purely a statistical convention without tying it to economic consequences.",
      ],
    },
  },

  {
    id: "cfa_qm_002",
    category: "cfa",
    type: "quantitative_methods",
    difficulty: "medium",
    title: "Sample selection bias in a survey of hedge fund returns",
    prompt: `A researcher publishes a study concluding that Canadian hedge funds have outperformed the S&P/TSX Composite by 3% annually over the past decade. The study's methodology: she sent surveys to 200 Canadian hedge funds asking them to report their 10-year annualized returns. She received 80 responses and averaged them.

Identify the biases that undermine her conclusion. What would you need to change about the methodology to produce a credible estimate?`,
    diff: "",
    rubric: {
      mustCover: [
        "Survivorship bias — only funds still operating after 10 years responded; failed or closed funds are absent, systematically inflating the average return.",
        "Self-selection (or self-reporting) bias — funds with weaker returns are less likely to respond; the 60% response rate skews toward better performers.",
        "Backfill bias if funds report full 10-year histories only after launching a track record publicly; pre-inception paper returns are biased upward.",
      ],
      strongSignals: [
        "Recommends using a database that includes defunct funds (e.g., HFR, Preqin) and a fixed point-in-time universe.",
        "Notes that the appropriate benchmark comparison should adjust for leverage, fees (gross vs net), and risk, not just raw return.",
        "Discusses confidence interval widening due to small effective sample and heterogeneous strategies.",
      ],
      weakPatterns: [
        "Identifies 'small sample size' as the main problem without naming the specific biases.",
        "Concludes the 3% outperformance figure is probably correct, just with uncertainty.",
      ],
    },
  },

  {
    id: "cfa_qm_003",
    category: "cfa",
    type: "quantitative_methods",
    difficulty: "medium",
    title: "Interpreting a multi-factor regression with multicollinearity",
    prompt: `An analyst runs a regression predicting Canadian bank stock returns using four independent variables: (1) change in the Bank of Canada overnight rate, (2) change in the 10-year Government of Canada yield, (3) change in the yield curve slope (10Y minus 2Y), and (4) change in Canadian CPI.

The regression has a high R-squared (0.62) but most individual coefficients are statistically insignificant with wide standard errors, and signs on some coefficients are counterintuitive. What is most likely happening, and how should she fix it?`,
    diff: "",
    rubric: {
      mustCover: [
        "This is classic multicollinearity — the rate variables are highly correlated with each other (overnight rate, 10Y yield, and curve slope are mathematically related), inflating standard errors and making individual coefficients unreliable.",
        "High R-squared with insignificant individual coefficients is the hallmark diagnostic of multicollinearity — the regression explains returns well collectively but cannot reliably attribute impact to individual variables.",
        "The fix is to reduce collinearity: drop redundant variables, use principal components, or respecify the model to use orthogonal factors (e.g., level, slope, curvature of yield curve as independent constructs).",
      ],
      strongSignals: [
        "Notes the Variance Inflation Factor (VIF) as the diagnostic tool to quantify multicollinearity.",
        "Recommends economic reasoning for variable selection — which rate is the true driver? — rather than throwing all rates into the model.",
        "Warns that inference (individual coefficient tests) is compromised but prediction may still be usable.",
      ],
      weakPatterns: [
        "Concludes the counterintuitive signs are genuine economic findings.",
        "Suggests adding MORE variables to 'solve' the problem.",
      ],
    },
  },

  {
    id: "cfa_qm_004",
    category: "cfa",
    type: "quantitative_methods",
    difficulty: "hard",
    title: "Non-stationarity in a return forecasting model",
    prompt: `A forecasting model using a 20-year history of Canadian equity returns and macroeconomic variables worked well in backtesting through 2015 but has degraded significantly since. In particular, the relationship between oil prices and Canadian equities appears to have weakened, and inflation expectations seem to have shifted. The model still uses fixed coefficients estimated from the full 20-year sample.

What is the likely statistical issue, and how should the team respond?`,
    diff: "",
    rubric: {
      mustCover: [
        "The time series relationships are non-stationary — the joint distribution of returns and predictors has changed over time (regime shift), so a single fixed-coefficient model estimated on the full history is misspecified.",
        "Structural breaks (e.g., post-2014 oil crash changing Canadian equity composition; post-2020 inflation regime change) invalidate assumption of constant parameters.",
        "Remedies include: rolling-window estimation, regime-switching models (e.g., Markov switching), time-varying coefficients, or explicitly modeling the regime shift with a dummy variable.",
      ],
      strongSignals: [
        "Discusses formal tests for structural breaks (Chow test, CUSUM) and stationarity (ADF test).",
        "Notes that the Canadian index itself has changed composition — energy weight fell from ~28% to under 18%, which is a compositional non-stationarity on top of economic regime change.",
        "Recommends ensemble or Bayesian model averaging to hedge against regime uncertainty.",
      ],
      weakPatterns: [
        "Attributes degradation to 'small sample' or 'randomness' rather than non-stationarity.",
        "Suggests simply retraining with more recent data without addressing why the old data is no longer informative.",
      ],
    },
  },

  {
    id: "cfa_qm_005",
    category: "cfa",
    type: "quantitative_methods",
    difficulty: "medium",
    title: "Normality assumption for value-at-risk in a crisis",
    prompt: `A risk team at a Canadian pension plan calculates daily value-at-risk (VaR) for its equity portfolio using a parametric approach that assumes returns are normally distributed. During normal markets the model performs well. During the March 2020 COVID crash and the 2022 rapid rate-hike episode, actual losses significantly exceeded VaR predictions on multiple days.

Explain the statistical assumption being violated and what alternative methodologies the team should consider.`,
    diff: "",
    rubric: {
      mustCover: [
        "Equity returns exhibit fat tails (excess kurtosis) and negative skew — the normal distribution underestimates the probability and magnitude of extreme losses, especially in crises.",
        "Volatility clustering (ARCH/GARCH effects) means that periods of high volatility cluster together; assuming i.i.d. normal returns misses this — actual volatility during the crisis is far higher than a long-run constant estimate.",
        "Alternative methodologies: historical simulation VaR (captures actual historical tails), Monte Carlo with fat-tailed distributions (Student-t, skewed-t), GARCH-based conditional VaR, Expected Shortfall (CVaR) instead of VaR to capture tail depth.",
      ],
      strongSignals: [
        "Notes that VaR alone is insufficient — Expected Shortfall (Conditional VaR) measures the magnitude of losses beyond VaR, which is more informative in fat-tailed environments.",
        "Discusses backtesting VaR (Kupiec test, traffic light zones under Basel) to detect model failure.",
        "Recommends stress testing with specific historical scenarios (2008, 2020, 2022) as complement to statistical VaR.",
      ],
      weakPatterns: [
        "Treats the problem as a one-off crisis event rather than a systematic violation of the normality assumption.",
        "Recommends only increasing the confidence level (e.g., 99% to 99.9%) without changing the distributional assumption.",
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
    difficulty: "medium",
    title: "Bank of Canada policy response to a demand-pull inflation shock",
    prompt: `Canadian CPI inflation has risen from 2% to 5% over six months, driven primarily by strong consumer demand, tight labour markets, and robust wage growth. GDP is growing at 3.5% and the unemployment rate is at a multi-decade low of 4.8%. The Bank of Canada's target is 2% inflation.

Describe the likely monetary policy response, the transmission mechanism through the Canadian economy, and the implications for (a) CAD, (b) Canadian equities, and (c) Canadian government bond prices.`,
    diff: "",
    rubric: {
      mustCover: [
        "The Bank of Canada will raise the overnight policy rate to restrain demand — classic response to demand-pull inflation with an overheating economy (unemployment below NAIRU).",
        "Transmission channels: higher borrowing costs → reduced consumer credit, mortgages, business investment → slower aggregate demand → inflation moderation. Household debt sensitivity in Canada (among highest in G7) amplifies transmission.",
        "Market implications: (a) CAD appreciates on higher yield differential vs USD (assuming Fed holds); (b) Canadian equities face headwinds — rate-sensitive sectors (REITs, utilities, financials with duration gap) hit hardest, commodities mixed; (c) bond prices fall as yields rise across the curve, front-end moves most.",
      ],
      strongSignals: [
        "Distinguishes demand-pull (this case — rate hikes work) from cost-push inflation (supply shocks — rate hikes less effective, risk stagflation).",
        "Notes that Canadian housing is a unique transmission amplifier (variable-rate mortgages, renewal cycle) so BoC may move more cautiously than the Fed.",
        "Discusses the yield curve reshape — front end rises most, 10Y may invert below short rates.",
      ],
      weakPatterns: [
        "Applies a generic 'central banks raise rates' answer without Canadian-specific transmission.",
        "Confuses expected currency direction (appreciation with higher domestic rates, not depreciation).",
      ],
    },
  },

  {
    id: "cfa_econ_002",
    category: "cfa",
    type: "economics",
    difficulty: "medium",
    title: "CAD depreciation impact across Canadian sectors",
    prompt: `The Canadian dollar has depreciated 12% against the U.S. dollar over the past nine months due to a combination of falling oil prices and a widening rate differential with the Fed. You are analyzing sector exposure for a Canadian equity portfolio.

For each of the following sectors, describe whether CAD depreciation is net positive or negative, and why: (a) Canadian energy producers, (b) Canadian auto-parts manufacturers exporting to the U.S., (c) Canadian airlines, (d) Canadian REITs owning domestic properties, (e) Canadian retailers importing consumer goods.`,
    diff: "",
    rubric: {
      mustCover: [
        "(a) Canadian energy producers: NET POSITIVE — oil priced in USD but costs (wages, taxes, domestic services) in CAD, so weaker CAD boosts CAD-denominated revenue and margins. (b) Auto-parts exporters to U.S.: NET POSITIVE — USD revenue translates to more CAD, improving competitiveness vs U.S. domestic producers.",
        "(c) Airlines: NET NEGATIVE — jet fuel priced in USD, aircraft leases often USD-denominated, but domestic ticket revenue in CAD; weaker CAD raises costs faster than revenue. (d) Domestic REITs: MIXED but generally negative — properties and rental income are CAD, so no direct revenue boost; however, if debt is USD-denominated, servicing costs rise.",
        "(e) Retailers importing consumer goods: NET NEGATIVE — inventory costs rise with weaker CAD, while retail prices are slow to adjust (consumer price resistance); margins compress unless pricing power exists.",
      ],
      strongSignals: [
        "Distinguishes commodity producers (pricing in USD regardless of where they operate) from domestic-oriented firms.",
        "Notes hedging behavior — large exporters often use FX forwards; short-term insulation, but long-run exposure remains.",
        "Discusses second-order effects: CAD weakness imports inflation, potentially accelerating BoC response.",
      ],
      weakPatterns: [
        "Applies uniform 'weak currency is good for exporters' without considering cost structure.",
        "Ignores that many Canadian energy costs are also USD-linked (equipment, capex).",
      ],
    },
  },

  {
    id: "cfa_econ_003",
    category: "cfa",
    type: "economics",
    difficulty: "easy",
    title: "Identifying the business cycle phase and sector implications",
    prompt: `The Canadian economy currently shows: (1) GDP growth 1.2% and decelerating, (2) unemployment has begun to tick up from 5.0% to 5.6%, (3) CPI inflation has fallen from 5% to 3%, (4) BoC has paused its hiking cycle after aggressive tightening, (5) yield curve remains inverted (10Y < 2Y), (6) consumer confidence has dropped.

Identify the current business cycle phase and recommend sector positioning consistent with that phase. Justify using the economic indicators given.`,
    diff: "",
    rubric: {
      mustCover: [
        "This is late cycle / pre-recession — decelerating growth, rising unemployment, inverted yield curve (classic recession precursor), central bank pause after hikes, falling consumer confidence — all consistent with late cycle transitioning to contraction.",
        "Defensive positioning is appropriate: overweight consumer staples, healthcare, utilities (inelastic demand); underweight cyclicals (industrials, discretionary, materials) and high-beta financials.",
        "Duration exposure in fixed income is favorable — as the cycle turns and BoC eventually cuts, long-duration government bonds outperform; credit spreads likely to widen, so investment grade preferred over high yield.",
      ],
      strongSignals: [
        "References the Canadian-specific energy/materials weight in the TSX — the index has outsized cyclical exposure vs S&P 500, amplifying cycle sensitivity.",
        "Notes that an inverted yield curve has preceded every Canadian recession since the 1970s, though with variable lead time (6-18 months).",
        "Distinguishes tactical positioning (months) from strategic (years) — late cycle calls for gradual defensive shift, not wholesale portfolio overhaul.",
      ],
      weakPatterns: [
        "Calls this early cycle or expansion due to the rate pause (the pause is exhaustion of tightening, not stimulus).",
        "Recommends cyclical overweights based on growth optimism.",
      ],
    },
  },

  {
    id: "cfa_econ_004",
    category: "cfa",
    type: "economics",
    difficulty: "medium",
    title: "Tariffs on Canadian steel exports — sector and macro impact",
    prompt: `The U.S. imposes a 25% tariff on Canadian steel exports. Canada is a significant steel exporter to the U.S., with steel representing a meaningful share of Canadian manufacturing exports. The Canadian government is considering retaliatory tariffs on select U.S. imports.

Analyze the direct and indirect effects on: (1) Canadian steel producers, (2) Canadian manufacturers that use steel as input, (3) Canadian consumers, (4) overall Canadian economic growth. What policy response would you advocate, and why?`,
    diff: "",
    rubric: {
      mustCover: [
        "Canadian steel producers lose effective access to the U.S. market at prior prices — volumes drop or they absorb the tariff, compressing margins. Domestic overcapacity pushes prices down in Canada, further squeezing margins.",
        "Canadian steel-using manufacturers (auto, machinery, construction) benefit from lower domestic steel prices in the short run BUT face demand destruction if their own U.S. exports are hit by retaliation or recession in U.S. buyers.",
        "Canadian consumers lose via retaliatory tariffs raising import prices; aggregate GDP drag from reduced trade volumes, investment uncertainty, and negative business sentiment typically outweighs any import-substitution gains (classical economic consensus).",
      ],
      strongSignals: [
        "Discusses that retaliatory tariffs, while politically satisfying, usually impose domestic cost (importers pay, consumers pay) — targeted WTO dispute or negotiated relief is economically preferable.",
        "Notes that tariffs in integrated supply chains (e.g., auto) disrupt bidirectional flows — Canadian parts in U.S. cars, U.S. components in Canadian-assembled vehicles.",
        "Addresses currency response: CAD may weaken on trade shock, partially offsetting the tariff for exporters but importing inflation.",
      ],
      weakPatterns: [
        "Recommends broad retaliatory tariffs without weighing domestic cost.",
        "Treats tariffs as purely a sectoral issue without macro/currency spillover.",
      ],
    },
  },

  {
    id: "cfa_econ_005",
    category: "cfa",
    type: "economics",
    difficulty: "hard",
    title: "Diagnosing stagflation risk in Canada",
    prompt: `Over the past 12 months the Canadian economy has shown: inflation has risen from 3% to 5.5% despite weak demand; GDP growth has fallen from 2.5% to 0.5%; unemployment has risen from 5.5% to 6.8%; the Bank of Canada is under pressure from some to cut rates (to support growth) and from others to hike (to contain inflation).

Diagnose the macroeconomic condition. What is likely driving it? Evaluate the policy options — can a central bank solve this condition with interest rate tools alone?`,
    diff: "",
    rubric: {
      mustCover: [
        "This is stagflation — simultaneous high inflation and weak growth, with rising unemployment — suggesting a supply-side shock rather than demand-driven inflation (which would show strong growth and low unemployment).",
        "Likely causes: global energy/commodity shock, supply chain disruption, productivity collapse, or wage-price dynamics from structural labour shortage — inflation without demand strength means the Phillips curve relationship has broken down or shifted.",
        "Monetary policy is in a bind — hiking fights inflation but worsens growth/unemployment; cutting supports growth but entrenches inflation expectations. Rate tools alone are insufficient; fiscal measures, supply-side reforms, or supply shock resolution are needed. Central banks typically prioritize anchoring inflation expectations even at growth cost.",
      ],
      strongSignals: [
        "References the 1970s stagflation experience and Paul Volcker's eventual choice to prioritize inflation at the cost of deep recession.",
        "Notes the danger of de-anchored inflation expectations — if wage and price setters expect persistent high inflation, it becomes self-fulfilling and harder to break.",
        "Distinguishes imported commodity inflation (limited central bank tool leverage) from domestic wage-price spiral (more responsive to tight monetary policy).",
      ],
      weakPatterns: [
        "Treats this as a normal inflation episode requiring standard rate hikes.",
        "Recommends cutting rates primarily to support growth without addressing inflation expectation risk.",
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
    difficulty: "medium",
    title: "Capital structure choice for a high-growth Canadian tech firm",
    prompt: `Northstar Tech, a mid-cap Canadian software company listed on the TSX, is evaluating how to fund CAD $200M of expansion capex. Its current capital structure is 95% equity, 5% debt. Revenue is growing 30% annually, but free cash flow is just break-even as the company reinvests aggressively. The company has no meaningful tangible assets (software IP and contracts). Management is considering: (a) issue new equity at current price, (b) issue senior secured bank debt, (c) issue convertible debt.

Evaluate each option and recommend one. Consider growth stage, asset base, and signaling effects.`,
    diff: "",
    rubric: {
      mustCover: [
        "Senior secured bank debt is poorly suited — break-even FCF means debt service coverage is weak, and the absence of tangible collateral makes secured debt limited in size and expensive. Pecking-order theory disfavors debt here.",
        "New equity issuance dilutes existing shareholders but fits the growth profile — however, signaling theory (Myers & Majluf) warns that equity issuance signals management believes shares are overvalued, often causing a price drop on announcement.",
        "Convertible debt is often optimal for high-growth firms: lower coupon than straight debt (equity option has value), delayed dilution until conversion, milder negative signaling than pure equity. Recommendation: convertible debt, with terms supporting future conversion at a premium.",
      ],
      strongSignals: [
        "Discusses debt capacity tied to operating cash flow coverage ratios rather than just leverage ratios.",
        "Notes the tax deductibility advantage of debt (interest shield) — but limited value when the company has low taxable income.",
        "References the trade-off theory (bankruptcy cost vs tax benefit) and pecking-order theory (internal > debt > equity).",
      ],
      weakPatterns: [
        "Recommends equity purely because growth firms 'should' use equity without considering signaling cost.",
        "Ignores the lack of collateral when recommending secured debt.",
      ],
    },
  },

  {
    id: "cfa_ci_002",
    category: "cfa",
    type: "corporate_issuers",
    difficulty: "medium",
    title: "Interpreting a surprise dividend cut announcement",
    prompt: `Maple Resources, a large Canadian oil and gas producer, unexpectedly announces a 60% cut to its quarterly dividend. In the announcement, management cites "prudent capital allocation in light of market conditions" and emphasizes the cut is "not a reflection of any near-term concern about the business." Recent quarterly earnings met analyst estimates. The share price drops 15% on the day.

Evaluate the dividend decision from a signaling perspective. What interpretations does the market likely apply, and what additional information would you seek to assess whether the market reaction is warranted?`,
    diff: "",
    rubric: {
      mustCover: [
        "Dividend cuts carry strong negative signaling — under signaling theory (Miller & Modigliani extended, Lintner's model), firms smooth dividends and cut only under genuine financial stress; the market interprets cuts as management's private information about worsening cash flow prospects.",
        "The generic 'prudent capital allocation' language is suspicious — if the company had a specific, value-creating alternative use (acquisition, buyback, capex), disclosing it would mitigate the negative signal. Vague language reinforces the stress interpretation.",
        "Key information to seek: forward guidance on cash flow, hedging coverage, capex plans, debt maturity schedule, and whether the cut is reinvestment-driven vs defensive — also peer behavior in the same sector to distinguish firm-specific from sector-wide stress.",
      ],
      strongSignals: [
        "References clientele theory — income-focused investors exit on dividend cut, amplifying share price reaction beyond the information content.",
        "Notes that buybacks are a more flexible alternative for returning capital without the commitment signal of dividends — switching from dividend to buyback may signal less commitment to payout.",
        "Discusses that the 15% drop implies the market assigns meaningful probability to more bad news to come.",
      ],
      weakPatterns: [
        "Takes management's stated rationale at face value without skepticism.",
        "Treats dividend payout as financially neutral (pure M&M framework) without signaling and clientele effects.",
      ],
    },
  },

  {
    id: "cfa_ci_003",
    category: "cfa",
    type: "corporate_issuers",
    difficulty: "hard",
    title: "Governance red flags in a family-controlled TSX company",
    prompt: `You are reviewing Beaupré Industries, a TSX-listed manufacturing firm, for a potential investment. You find the following: (1) the founder's family holds 58% of the voting shares but only 22% of the economic interest through a dual-class share structure, (2) four of seven board seats are held by family members or long-time family business partners, (3) the CEO's compensation is heavily weighted toward a bonus tied to revenue (not profitability), (4) the company recently purchased a commercial property from the founder's private holding company at a price 20% above an independent appraisal, (5) related-party transactions are disclosed but not put to minority shareholder vote.

Rank the top three governance concerns. What mitigants or changes would materially improve your comfort?`,
    diff: "",
    rubric: {
      mustCover: [
        "The related-party transaction at above-appraisal pricing is the most serious concern — direct value transfer from public shareholders to the controlling family, indicating weak minority shareholder protection and potential recurrence.",
        "The dual-class structure with 58% voting control on 22% economic interest is a structural entrenchment risk — the family's incentives may diverge from public shareholders' (e.g., empire building, perpetuating family employment) without accountability through share-based discipline.",
        "Board composition with 4/7 family-affiliated seats lacks meaningful independent oversight — combined with the CEO comp structure tied to revenue (growth at any cost, not value creation), there is no effective check on related-party dealings or capital allocation discipline.",
      ],
      strongSignals: [
        "Discusses specific mitigants: independent majority on audit and related-party committees, minority shareholder veto on related-party transactions, sunset clause on dual-class, fair valuation process for all related-party dealings.",
        "Notes that revenue-based CEO comp can incentivize value-destroying M&A or margin erosion for top-line growth.",
        "References specific Canadian governance context — ISS/Glass Lewis voting recommendations for dual-class firms, CSA disclosure requirements under NI 52-110.",
      ],
      weakPatterns: [
        "Accepts family control as inherently fine if disclosed.",
        "Focuses only on surface disclosure compliance without evaluating substantive incentive alignment.",
      ],
    },
  },

  {
    id: "cfa_ci_004",
    category: "cfa",
    type: "corporate_issuers",
    difficulty: "medium",
    title: "Working capital squeeze at a retailer heading into the holiday season",
    prompt: `Your analysis of Urban Outfitters Canada (a hypothetical Canadian specialty retailer) reveals that over the past four quarters: (1) days inventory outstanding rose from 85 to 135 days, (2) days payable outstanding fell from 55 to 38 days (suppliers tightening terms), (3) the company drew $40M of $60M available on its credit facility, (4) management guides to "strong holiday demand" driving an inventory build, (5) same-store sales growth has decelerated from 6% to 1%.

Assess the working capital situation. Is management's explanation plausible? What are the risks heading into Q4?`,
    diff: "",
    rubric: {
      mustCover: [
        "Management's 'inventory build for demand' narrative is inconsistent with decelerating same-store sales — true demand-driven inventory build is a leading indicator with strong sales; here sales are decelerating while inventory swells, suggesting excess/unsold stock, not anticipated demand.",
        "Payables days shrinking from 55 to 38 is a warning sign — suppliers are tightening credit terms, typically because they perceive credit risk; this compounds working capital pressure at the same time inventory is consuming more cash.",
        "Credit facility utilization at 67% with further inventory build implied means limited liquidity runway — if holiday demand disappoints, the company risks a markdown cycle that destroys gross margin, breaches covenants, and forces emergency financing or distressed action.",
      ],
      strongSignals: [
        "Discusses the cash conversion cycle (DIO + DSO - DPO) explicitly — it has worsened by ~70 days, meaning ~2 months more working capital tied up per cycle.",
        "Recommends scenario analysis: what if holiday sales miss by 15%? — markdowns cascade to gross margin, inventory write-downs, covenant stress.",
        "Notes the leading-indicator value of supplier payment term changes — suppliers often know first when a retailer is struggling.",
      ],
      weakPatterns: [
        "Accepts management's holiday demand narrative without scrutinizing the sales trend.",
        "Focuses only on the inventory line without connecting the payables deterioration.",
      ],
    },
  },

  {
    id: "cfa_ci_005",
    category: "cfa",
    type: "corporate_issuers",
    difficulty: "medium",
    title: "Shareholder vs bondholder conflict in a leveraged buyout target",
    prompt: `A private equity firm has announced a leveraged buyout of Dominion Packaging, a BBB-rated TSX-listed company. The deal will take the company private at a 35% premium to the undisturbed share price. The financing structure adds CAD $3B of new debt, raising pro-forma leverage from 2.5x EBITDA to 6.8x EBITDA. Existing bondholders hold CAD $800M of senior unsecured notes with no change-of-control put protection but with a leverage covenant that allows up to 5.0x.

Evaluate the impact on (a) existing shareholders, (b) existing bondholders, (c) the company's credit rating and future borrowing capacity.`,
    diff: "",
    rubric: {
      mustCover: [
        "Existing shareholders benefit — the 35% premium is received in cash; this is the classic LBO value transfer from other stakeholders (bondholders, employees, tax authority in some structures).",
        "Existing bondholders are harmed — leverage more than doubles, credit quality deteriorates sharply; bonds will likely be downgraded multiple notches (BBB to B area), trading at significant discount. The absence of change-of-control puts means they cannot exit at par, and the 5.0x covenant appears to be breached by the pro-forma 6.8x structure (potential technical default or forced refinancing).",
        "Credit rating will be downgraded (typically to high-yield); future borrowing is more expensive and restrictive; equity cushion is eroded; the combination of higher fixed charges and cyclical sensitivity (packaging is cyclical) raises financial distress probability and lowers financial flexibility.",
      ],
      strongSignals: [
        "Notes the covenant breach issue — if the 5.0x leverage covenant is triggered, existing bonds must be refinanced or waived, creating negotiation leverage for bondholders despite no formal put.",
        "Discusses the importance of change-of-control puts in investment-grade bond indentures and why this bond's lack of one is unusual/weak protection.",
        "References the agency cost of debt (Jensen & Meckling) — equityholders can transfer value to themselves via leverage-increasing transactions absent protective covenants.",
      ],
      weakPatterns: [
        "Treats the LBO as value-creating for all stakeholders without identifying the wealth transfer.",
        "Misses the covenant issue and its implications for bondholder leverage in negotiation.",
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
    difficulty: "medium",
    title: "Revenue recognition red flags under IFRS 15",
    prompt: `You are analyzing Cascade Software Solutions, a Canadian SaaS company. The MD&A notes: "Revenue grew 40% year-over-year. This quarter we recognized $45M of upfront license revenue from a 5-year enterprise agreement with a new strategic customer, representing the total contract value. Professional services revenue included a $12M bill-and-hold arrangement for software that remains on our premises pending customer infrastructure readiness."

Evaluate the revenue recognition under IFRS 15. Identify what is potentially problematic and what disclosures or analysis you would require before relying on the reported numbers.`,
    diff: "",
    rubric: {
      mustCover: [
        "Recognizing the full 5-year contract value upfront is suspect under IFRS 15 — distinct performance obligations (license delivered vs ongoing services/support/updates) must be identified, and revenue allocated to each obligation and recognized when control transfers. For SaaS, the license is often a right-to-access that is recognized over time, not upfront.",
        "The bill-and-hold arrangement requires specific IFRS 15 criteria: customer must have substantive reason, product identified as customer's, ready for physical transfer, company cannot use it for another customer — mere infrastructure delay does not qualify; this looks like channel stuffing.",
        "Key diagnostic metrics to examine: deferred revenue (should rise if genuine multi-year contracts), billings vs recognized revenue divergence, DSO trend (bill-and-hold often shows rising receivables), and whether these two items materially explain the 40% growth — strip them out to assess underlying growth.",
      ],
      strongSignals: [
        "Discusses the performance obligation identification step of IFRS 15 and distinct vs bundled goods/services.",
        "Recommends adjusting the reported numbers to a 'quality of earnings' view that spreads the upfront license and excludes the bill-and-hold pending resolution.",
        "References the SEC/CSA focus on revenue recognition as a frequent area of restatement risk.",
      ],
      weakPatterns: [
        "Accepts the 40% growth at face value without interrogating the specific unusual items.",
        "Confuses IFRS 15 with the older IAS 18 rules (SaaS treatment changed meaningfully under IFRS 15).",
      ],
    },
  },

  {
    id: "cfa_fsa_002",
    category: "cfa",
    type: "fsa",
    difficulty: "medium",
    title: "Earnings quality — non-recurring items distorting trend analysis",
    prompt: `Bluewater Mining reported Q3 net income of CAD $180M, up 60% year-over-year. The income statement includes: (1) a $45M gain on sale of a non-core exploration asset, (2) a $20M reversal of a prior-year impairment charge on a mine, (3) a $30M foreign exchange gain on USD-denominated receivables due to CAD weakness, (4) a $15M litigation settlement (expense) classified within 'other operating expenses', (5) inventory was valued at $60M vs $40M last year due to higher commodity prices.

Compute (conceptually) the adjusted/recurring earnings and assess the sustainability of Q3 results.`,
    diff: "",
    rubric: {
      mustCover: [
        "Adjustments to reach recurring earnings: exclude (1) $45M gain on asset sale (non-recurring), (2) $20M impairment reversal (non-recurring, conceptually a reversal of a prior loss), (3) $30M FX gain (non-operating, often volatile quarter-to-quarter), and add back (4) $15M litigation expense (non-recurring, one-time). Net recurring adjustment: reported $180M minus ~$95M of non-recurring gains plus $15M litigation = ~$100M recurring — roughly flat YoY, not 60% growth.",
        "The inventory increase reflects price effects, not volume — inventory mark-to-market (or LCNRV reversal) inflates reported COGS benefit/margin; analyze production volumes and realized prices separately to understand operating leverage.",
        "Conclusion: headline growth is not indicative of underlying operating momentum; sustainability depends on commodity price environment, production trends, and cost discipline — not on the one-time items inflating the quarter.",
      ],
      strongSignals: [
        "Discusses IFRS treatment — gains/losses on asset sales and impairment reversals are in operating income under IFRS but can be disclosed separately as unusual items.",
        "Notes that FX gains on receivables can reverse in the next quarter if CAD appreciates, adding volatility.",
        "Recommends computing a multi-year adjusted operating cash flow and cash earnings (excluding non-cash and non-recurring) to anchor valuation.",
      ],
      weakPatterns: [
        "Accepts the 60% headline growth as operating performance.",
        "Adjusts only for the gain on sale while missing other non-recurring items.",
      ],
    },
  },

  {
    id: "cfa_fsa_003",
    category: "cfa",
    type: "fsa",
    difficulty: "medium",
    title: "IFRS 16 lease accounting — comparing pre-adoption vs post-adoption metrics",
    prompt: `An airline industry analyst is comparing Air Canada (reports under IFRS) with a hypothetical U.S. peer that transitioned to ASC 842 in the same period. Both companies moved previously operating leases onto their balance sheets. A junior analyst notes: "Air Canada's debt/EBITDA jumped from 3.5x to 5.8x after IFRS 16 adoption — they became much more leveraged."

Evaluate the junior analyst's conclusion. What actually changed, and how should the analyst reinterpret the ratios?`,
    diff: "",
    rubric: {
      mustCover: [
        "The economics did not change — IFRS 16 merely made previously off-balance-sheet operating leases visible on the balance sheet as right-of-use assets and lease liabilities. The underlying cash flows and obligations were always there; only the accounting presentation changed.",
        "Debt/EBITDA jump from 3.5x to 5.8x is an accounting effect, not a deterioration: reported debt rose due to lease liabilities, and EBITDA rose because operating lease expense (previously in OPEX) is now split between depreciation and interest (both below EBITDA) — but the numerator rises more proportionally than the denominator in most cases.",
        "For cross-period comparability: either (a) restate prior periods to a pro-forma IFRS 16 basis, or (b) use a consistently adjusted metric (e.g., EV/EBITDAR capitalizing rent at a multiple) that treated operating leases as debt even before IFRS 16. Do NOT compare pre- and post-adoption ratios without adjustment.",
      ],
      strongSignals: [
        "Notes that credit analysts (Moody's, S&P) already capitalized operating leases as debt pre-IFRS 16, so rating and credit metrics did not change despite GAAP change.",
        "Distinguishes the IFRS 16 model (single on-balance-sheet model) from ASC 842 (dual model: finance vs operating, operating still has straight-line expense above EBITDA) — makes cross-border comparability harder.",
        "Recommends EV/EBITDAR or rent-adjusted metrics for airline industry specifically, given high lease dependency.",
      ],
      weakPatterns: [
        "Agrees with the junior analyst that leverage genuinely worsened.",
        "Recommends simply ignoring leases when comparing periods.",
      ],
    },
  },

  {
    id: "cfa_fsa_004",
    category: "cfa",
    type: "fsa",
    difficulty: "hard",
    title: "Divergence between reported earnings and operating cash flow",
    prompt: `Maple Tech Systems reports growing net income (15% CAGR over three years) but its operating cash flow has been flat to declining over the same period. Digging in: (a) receivables have grown 40% annually versus revenue growth of 20%, (b) "other current assets" has grown materially, (c) the company capitalizes software development costs aggressively, moving expenses from the income statement to the balance sheet, (d) share-based compensation is a rising percentage of revenue.

Evaluate the earnings quality. Identify the likely drivers of the divergence between NI and OCF. What adjustments would you make for valuation purposes?`,
    diff: "",
    rubric: {
      mustCover: [
        "Accounts receivable growing faster than revenue is a major red flag — either credit terms are being relaxed (pulling forward revenue), the customer base is worsening (collectibility risk), or revenue is being recognized without genuine invoicing behavior (channel stuffing). This directly explains part of the OCF lag.",
        "Capitalizing development costs shifts expenses below the operating income line (into depreciation/amortization later), inflating current EPS while consuming cash now — a classic 'aggressive accounting' pattern. Valuation must treat capitalized dev spend as a current cash cost.",
        "Share-based compensation is a real economic cost (dilution) that reduces OCF indirectly (no cash outflow for SBC, but the firm must eventually buy back to offset dilution or shareholders are diluted). Adjusted earnings and FCF should subtract SBC at fair value.",
      ],
      strongSignals: [
        "Recommends recasting financial statements: treat capitalized development as OPEX, deduct SBC as cash expense, and examine DSO trend vs revenue seasonality.",
        "Discusses the 'accruals anomaly' (Sloan 1996) — large accruals relative to earnings predict future underperformance.",
        "Notes that OCF is typically more manipulation-resistant than NI, so persistent divergence warrants deep skepticism of NI growth.",
      ],
      weakPatterns: [
        "Attributes the divergence to investment in growth without quantifying or questioning the accounting choices.",
        "Accepts SBC-adjusted EPS without considering the dilution cost to shareholders.",
      ],
    },
  },

  {
    id: "cfa_fsa_005",
    category: "cfa",
    type: "fsa",
    difficulty: "medium",
    title: "Inventory method comparability across peers (IFRS context)",
    prompt: `An analyst is comparing three Canadian industrial companies. Company A uses weighted-average cost for inventory; Company B uses FIFO; Company C is a U.S.-based peer (reports under US GAAP) using LIFO. All three operate in an environment of rising input costs (commodity inflation of ~8% annually).

Explain the effects of the different inventory methods on gross margin, reported inventory balance, and comparability. Given Canada's IFRS framework, what is the correct approach?`,
    diff: "",
    rubric: {
      mustCover: [
        "IFRS (used in Canada) prohibits LIFO — allowable methods are FIFO, weighted-average, or specific identification. LIFO is permitted only under US GAAP (Company C).",
        "In rising-cost environment: FIFO (Company B) reports the lowest COGS (oldest, cheapest costs in COGS), highest gross margin, and highest ending inventory (newest, more expensive costs remain); weighted-average (Company A) is in between; LIFO (Company C) reports highest COGS, lowest gross margin, and oldest/cheapest inventory on balance sheet (inventory layers may understate replacement cost significantly).",
        "For comparability: adjust Company C from LIFO to FIFO using the LIFO reserve disclosure (LIFO reserve = FIFO inventory − LIFO inventory) — add back the change in LIFO reserve to Company C's net income and adjust inventory balance upward. Without this adjustment, cross-company margin and ROE comparisons are invalid.",
      ],
      strongSignals: [
        "Notes that under IFRS, inventory write-downs to net realizable value can be reversed in later periods if values recover, unlike US GAAP where LIFO-basis write-downs generally cannot be reversed.",
        "Discusses the tax implication — LIFO reduces reported income and thus reduces taxes in US GAAP firms during inflation (LIFO conformity rule).",
        "Recommends specifically recalculating inventory turnover using ending inventory on a consistent (FIFO) basis for all three firms.",
      ],
      weakPatterns: [
        "Assumes LIFO is allowable under IFRS.",
        "Compares gross margins across the three companies without method adjustment.",
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
    difficulty: "medium",
    title: "Valuation method selection for a mature utility vs a growth tech firm",
    prompt: `You are tasked with valuing two TSX-listed companies: (1) Hydro-Quebec Infrastructure Partners — a mature regulated utility with stable cash flows, a long history of 4% annual dividend growth, and a payout ratio around 75%; (2) Lightspeed Commerce — a Canadian payments/SaaS company with 35% revenue growth, negative free cash flow, no dividend, and significant reinvestment in R&D and sales.

Recommend the most appropriate primary valuation methodology for each, and explain why other common methods would be inappropriate.`,
    diff: "",
    rubric: {
      mustCover: [
        "Hydro-Quebec utility — Dividend Discount Model (DDM), specifically the Gordon Growth model, is ideal: stable dividend, predictable growth, high payout ratio means dividends closely approximate free cash flow to equity. FCFE model would also work but adds little given dividend stability.",
        "Lightspeed — DDM is inappropriate (no dividend, unlikely to pay soon); FCFE is poor because FCF is negative. The primary method should be a forward-looking valuation: multi-stage DCF with explicit forecast through cash flow positivity, or a relative-value multiple on forward revenue (EV/Revenue) or forward gross profit, benchmarked against growth-adjusted peers (e.g., rule of 40).",
        "Residual income or exit-multiple DCF are also reasonable secondary methods for Lightspeed; for the utility, regulatory asset base (rate base) valuation offers a useful sanity check. Relative-value methods (P/E) work for the mature utility but are not primary for the growth firm given unprofitability.",
      ],
      strongSignals: [
        "Discusses the signaling / clientele issue — utilities attract income investors, making dividend stability self-reinforcing in valuation.",
        "For the growth firm, recommends sensitivity analysis on terminal value drivers (terminal growth, terminal margin) since these drive most of the DCF value.",
        "Notes that comparables must be growth- and margin-matched — naively comparing Lightspeed to mature tech is misleading.",
      ],
      weakPatterns: [
        "Applies DCF uniformly without considering the stability/growth distinction.",
        "Values the growth firm on trailing P/E (negative or meaningless).",
      ],
    },
  },

  {
    id: "cfa_eq_002",
    category: "cfa",
    type: "equity",
    difficulty: "medium",
    title: "Industry life cycle — positioning in a mature vs declining sector",
    prompt: `You are analyzing two Canadian industries for equity exposure: (1) Canadian wireline telecom (fixed-line landline service), (2) Canadian data center REITs. Both contain publicly listed issuers on the TSX.

Identify the life-cycle stage of each, describe the expected competitive dynamics (profitability, pricing power, capex, entry/exit), and recommend how a long-only equity portfolio should approach each — which stage warrants growth-style exposure, income-style, or defensive underweight?`,
    diff: "",
    rubric: {
      mustCover: [
        "Wireline telecom is in the decline stage — secular revenue contraction as customers cut landlines for mobile/VoIP; competitive dynamics show pricing pressure, shrinking margins, and increasing consolidation. Capex is falling (legacy asset milking); exit is slow due to regulatory obligation but the sector's best case is slow wind-down with cash return. Defensive/income-style approach at most, not growth.",
        "Data center REITs are in the growth stage — driven by cloud computing, AI inference demand, and data sovereignty trends; competitive dynamics show strong pricing power at hyperscale tier, high barriers to entry (land + power + cooling), rising capex, new entrants but high capital thresholds. Growth-style positioning is appropriate, though REITs have interest-rate sensitivity.",
        "Portfolio approach: defensive/underweight on wireline (treat cash flows as decaying option); growth-tilt on data centers but with awareness of duration risk (REITs trade like long bonds) and hyperscaler concentration risk (top 3-4 customers often drive 50%+ of revenue).",
      ],
      strongSignals: [
        "References Porter's Five Forces explicitly — buyer power, entry barriers, substitution, rivalry, supplier power — to characterize each sector.",
        "Distinguishes absolute growth rate from unit economics — wireline could 'grow' revenue via price hikes but volumes decline faster.",
        "Notes the energy intensity and ESG scrutiny on data centers — rising regulatory scrutiny in Canadian provinces on power/water use.",
      ],
      weakPatterns: [
        "Labels both as 'mature' without distinguishing the secular forces driving each.",
        "Ignores the customer concentration risk in data centers.",
      ],
    },
  },

  {
    id: "cfa_eq_003",
    category: "cfa",
    type: "equity",
    difficulty: "hard",
    title: "Why intrinsic value diverges from market price — framework",
    prompt: `Your DCF analysis of Nordic Energy (a Canadian oil and gas producer) produces an intrinsic value of CAD $65 per share. The stock trades at CAD $38. Your analysis uses consensus production and cost assumptions, a WACC of 9%, and a long-term oil price of US$70/bbl. The stock has been below your intrinsic estimate for two years.

Before recommending a Buy, enumerate the possible explanations for the persistent divergence. Which would you investigate first, and how would you distinguish a genuine mispricing from an error in your model?`,
    diff: "",
    rubric: {
      mustCover: [
        "Possible model errors: WACC may be too low (Canadian E&P carries commodity + geographic + ESG/regulatory risk premium — 9% may understate it); long-term oil price of $70 may be optimistic given energy transition expectations; production decline rates may be underestimated; reserve life and capex-to-maintain may be wrong.",
        "Possible market-priced risks not in model: ESG discount applied by institutional investors reducing the investable base; carbon tax / regulatory trajectory risk in Canada; takeaway capacity constraints affecting realized prices; Indigenous consultation and permitting delays impacting project timelines.",
        "Distinguishing genuine mispricing from model error: (a) compare your WACC and price assumptions to peer consensus and forward-curve data; (b) run reverse DCF to see what assumptions the market is pricing and assess if they are plausible; (c) examine whether catalysts exist to close the gap (discovery, strategic review, activist interest) or whether the market has systematically re-rated the sector.",
      ],
      strongSignals: [
        "Discusses the concept of a value trap — persistently cheap stocks that never rerate because structural factors (terminal decline, ESG exclusion) keep fundamentals weak.",
        "Recommends cross-checking with relative valuation (EV/EBITDA, EV/Reserves) — if all three methods show discount, more robust; if only DCF shows it, model error is likelier.",
        "Notes the importance of investor ownership and flows — if key institutional holders are divesting (ESG mandates), price pressure can persist regardless of intrinsic value.",
      ],
      weakPatterns: [
        "Assumes the market is wrong without stress-testing own assumptions.",
        "Treats the 2-year underperformance as purely behavioral without considering structural re-rating.",
      ],
    },
  },

  {
    id: "cfa_eq_004",
    category: "cfa",
    type: "equity",
    difficulty: "medium",
    title: "Growth vs value style positioning at a cyclical turning point",
    prompt: `Over the past three years, growth stocks (Canadian tech, high-multiple names) have significantly outperformed value stocks (Canadian banks, energy, materials). Current conditions: interest rates have risen sharply and stabilized; credit spreads are wide; consumer spending is weakening; corporate profit growth is decelerating broadly.

Make a case for a tactical style rotation decision (growth vs value). What factors support each side, and what specific indicators would confirm the rotation has begun?`,
    diff: "",
    rubric: {
      mustCover: [
        "Case for value rotation: higher discount rates compress long-duration growth-stock valuations (cash flows far in the future discounted more heavily); wider credit spreads reward companies with current earnings and strong balance sheets (typical value traits); decelerating earnings growth narrows the relative advantage of growth names.",
        "Case against aggressive value rotation: weakening consumer and decelerating profit growth hits cyclical value names (financials, industrials, consumer discretionary) hard; growth names with pricing power and secular tailwinds may retain earnings even as cyclicals suffer; historical value rotations have required growth recovery, not recession.",
        "Indicators to confirm rotation: (a) 10-year yield direction and shape — stable/declining rates reverse headwind to growth, but rising rates favor value; (b) earnings revision breadth — value sector revisions turning less negative than growth; (c) relative P/E ratio spread between growth and value returning from extreme historical levels; (d) Canadian-specific: TSX energy/financials vs tech sector relative strength.",
      ],
      strongSignals: [
        "Distinguishes tactical rotation (months) from strategic (years) — tactical calls on style should be sized modestly given historical difficulty of timing.",
        "Notes that Canada's TSX is structurally value-tilted (energy, materials, financials dominate) — rotation calls in Canadian context often translate to sector allocation, not pure style.",
        "Recommends factor diversification rather than all-or-nothing rotation.",
      ],
      weakPatterns: [
        "Recommends full rotation based on recent underperformance alone.",
        "Ignores the macro risk of recession harming cyclical value names.",
      ],
    },
  },

  {
    id: "cfa_eq_005",
    category: "cfa",
    type: "equity",
    difficulty: "easy",
    title: "Porter's Five Forces applied to Canadian railways",
    prompt: `Apply Porter's Five Forces framework to the Canadian Class I railway industry (Canadian National Railway and Canadian Pacific Kansas City). Evaluate competitive intensity and structural profitability. What does this analysis imply for long-term investment attractiveness?`,
    diff: "",
    rubric: {
      mustCover: [
        "Threat of new entrants: VERY LOW — massive capital intensity (CAD tens of billions in track/rolling stock), right-of-way monopoly (railroads own the rails), extensive regulatory approval for any new network — near-insurmountable barriers to new entry.",
        "Competitive rivalry: LOW to MODERATE — effectively duopoly in Canada (CN, CPKC) with geographic overlap but also geographic specialization; competition is more with trucking and barge than between the two rails in most corridors.",
        "Bargaining power of buyers: MODERATE — large industrial shippers (grain, oil, lumber) have some leverage via long-term contracts and regulatory recourse (Canadian Transportation Agency); small shippers have limited alternatives. Suppliers (labour unions, equipment) have moderate power; substitutes (trucking) viable for short-haul but not heavy/bulk long-haul.",
      ],
      strongSignals: [
        "Concludes that the industry has attractive structural profitability and high returns on capital — supported empirically by consistent operating margins of 35-45%.",
        "Notes that the primary long-term risks are regulatory (rate setting, labor disputes), cyclical (freight volumes tied to commodity and industrial cycles), and secular (decarbonization may benefit vs trucking on CO2 per ton-mile).",
        "Discusses that moats translate to pricing power and strong FCF generation, making these attractive quality/compounder stocks for long-horizon portfolios.",
      ],
      weakPatterns: [
        "Applies all five forces superficially without ranking them.",
        "Concludes the industry is highly competitive based on CN vs CPKC rivalry alone.",
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
    difficulty: "medium",
    title: "Duration positioning ahead of a BoC pause/cut",
    prompt: `A Canadian bond portfolio manager currently holds a portfolio duration of 4.2 years versus a benchmark duration of 6.5 years (the FTSE Canada Universe Bond Index). The Bank of Canada has just paused its hiking cycle after 11 months of aggressive tightening. Market consensus expects rate cuts to begin within 6-9 months. Inflation has fallen to 3.5% from a peak of 5.5% and continues to moderate. Unemployment has risen from 4.8% to 5.5%.

Evaluate the current positioning and recommend a duration strategy. What risks accompany your recommendation?`,
    diff: "",
    rubric: {
      mustCover: [
        "Current positioning is SHORT duration vs benchmark (4.2 vs 6.5) — this was sensible during the hiking cycle to limit losses from rising rates; however, it is now poorly suited for a pause/cut environment where rates are likely to fall and long-duration bonds will outperform.",
        "Recommendation: extend duration toward or above benchmark. Prefer extending via the 5-10 year part of the curve (belly) where rate sensitivity is high and roll-down benefits from curve steepening are typically meaningful; avoid very long end where term premium uncertainty dominates.",
        "Risks: (a) inflation may be stickier than expected, delaying cuts or prompting re-hike — long duration underperforms; (b) the cutting cycle may be priced in already (check forwards) — extending now captures little further gain; (c) credit spreads may widen in a growth slowdown, offsetting duration gains in corporate allocation — consider upgrading credit quality alongside extending duration.",
      ],
      strongSignals: [
        "Discusses using the forward curve to assess how much cutting is already priced — if forwards show 150bps of cuts over 12 months and you expect 100bps, you may be too late.",
        "Recommends gradual (laddered) duration extension rather than one-shot — reduces timing risk.",
        "Notes the distinction between parallel shift (classic duration) and curve reshape (key rate durations) — a bull steepener (short rates fall more than long) benefits short duration more than long.",
      ],
      weakPatterns: [
        "Recommends extreme long duration without considering inflation risk.",
        "Maintains short duration based solely on recent hiking history.",
      ],
    },
  },

  {
    id: "cfa_fi_002",
    category: "cfa",
    type: "fixed_income",
    difficulty: "medium",
    title: "Interpreting widening credit spreads in Canadian corporates",
    prompt: `Canadian investment-grade corporate credit spreads have widened by 80 basis points over three months, while Government of Canada yields have remained relatively stable. High-yield spreads have widened 250bps. The widening is broad across sectors but is most pronounced in REITs, consumer discretionary, and BBB-rated industrials.

What does the spread behavior signal about the economy and investor expectations? What investment actions does it suggest for a credit portfolio manager?`,
    diff: "",
    rubric: {
      mustCover: [
        "Widening credit spreads with stable Treasury yields indicate rising credit risk premium — investors are demanding more compensation for default risk, consistent with deteriorating economic outlook, rising recession probability, or worsening corporate fundamentals.",
        "Sector pattern is informative: REITs widening reflects duration concerns and commercial real estate stress; consumer discretionary widening signals consumer weakness concerns; BBB-industrial widening suggests migration risk (BBB → BB fallen-angel concerns during downturns).",
        "Portfolio actions: (a) reduce exposure to sectors with worsening fundamentals (REIT, consumer discretionary); (b) up-quality within IG — prefer A and higher to BBB given fallen-angel risk; (c) shorten duration within credit to reduce spread duration impact; (d) maintain or add high-quality short-dated IG as spreads may offer attractive risk-reward if recession is limited in depth.",
      ],
      strongSignals: [
        "Distinguishes spread duration (sensitivity to spread changes) from interest rate duration — spread duration matters most now given stable Treasury yields.",
        "References specific Canadian sector dynamics — e.g., office REIT stress, unsecured consumer lenders.",
        "Notes that in severe recessions, spread widening continues until policy response — timing the bottom is difficult; gradual buying is often better than attempting to call the bottom.",
      ],
      weakPatterns: [
        "Interprets spread widening as a buying opportunity without considering further deterioration.",
        "Treats all BBB credits as homogeneous without considering sector migration risk.",
      ],
    },
  },

  {
    id: "cfa_fi_003",
    category: "cfa",
    type: "fixed_income",
    difficulty: "hard",
    title: "Yield curve inversion — interpreting the signal and portfolio implications",
    prompt: `The Canadian yield curve has inverted: the 2-year Government of Canada yield is 4.5%, while the 10-year is 3.7% — a -80 bps spread. The inversion has been in place for 10 months. Historically in Canada, yield curve inversions have preceded recessions with an 8-18 month lag.

Explain what the inversion signals about (a) monetary policy expectations, (b) growth expectations, (c) inflation expectations. What are the fixed income portfolio implications, and what are the key risks to relying too heavily on this signal?`,
    diff: "",
    rubric: {
      mustCover: [
        "(a) Monetary policy: market expects the BoC to cut rates materially over the next 1-3 years — short-end yield is anchored by current policy rate, long-end reflects average expected short rates plus term premium, so 10Y below 2Y means expected average future short rates are lower than today.",
        "(b) Growth expectations: inversion typically reflects expected weaker growth/recession — central bank cuts usually follow weak growth; markets are pricing in a demand slowdown that will force policy accommodation.",
        "(c) Inflation expectations: inversion often implies expected inflation moderation — if long-term inflation expectations were rising, long-end yields would rise too; the fact that 10Y is lower than 2Y suggests disinflation.",
      ],
      strongSignals: [
        "Portfolio implications: extend duration gradually; prefer government bonds or high-quality IG credit; reduce exposure to recession-sensitive cyclical credit; consider barbell (short + long) to benefit from curve reshape when cuts come.",
        "Risks of relying on the signal: (a) regime change — QE/QT distort term premium, possibly breaking historical inversion-recession link; (b) timing is uncertain (8-18 month lag is wide); (c) soft-landing scenario possible — cuts without deep recession (1995, 1998 precedents); (d) term premium can turn negative, exaggerating the signal.",
        "Notes that cross-country context matters — U.S. curve inversion often influences Canadian curve due to rate correlation; global investor flows can distort the signal.",
      ],
      weakPatterns: [
        "Treats inversion as a certain recession signal without discussing probability or timing variability.",
        "Confuses the direction of yield curve movements (bull flattener vs bear flattener).",
      ],
    },
  },

  {
    id: "cfa_fi_004",
    category: "cfa",
    type: "fixed_income",
    difficulty: "medium",
    title: "Callable bond analysis in a falling-rate environment",
    prompt: `A Canadian investor holds a 10-year callable corporate bond with coupon 6.5%, callable in 2 years at par. Current market conditions: the issuer's non-callable 10-year debt trades at a 4.2% yield; the 2-year non-callable yield is 3.5%. Rates have fallen about 100bps over the past six months and the consensus expects further modest decline.

Evaluate the callable bond's position. What is likely to happen, and what are the investor's risks and opportunities?`,
    diff: "",
    rubric: {
      mustCover: [
        "The bond's 6.5% coupon is ABOVE the issuer's current non-callable yield of 4.2% — the issuer has an economic incentive to call the bond in 2 years and refinance at lower rates. The call option is in-the-money from the issuer's perspective.",
        "The investor faces reinvestment risk: if called, the $100 par proceeds must be reinvested at then-prevailing rates (likely below 6.5%), reducing future income. The bond's price is capped near par — it cannot appreciate much above par regardless of how far rates fall, because the call will truncate upside.",
        "Effective duration of callable bonds is shorter than straight bonds of the same maturity (negative convexity near call price) — traditional duration overstates rate sensitivity; use option-adjusted spread and effective duration for analysis. Consider selling the callable and purchasing non-callable if rate view strongly supports further decline.",
      ],
      strongSignals: [
        "Distinguishes yield-to-maturity (assumes not called) from yield-to-call — in this case YTC is the likely realized yield.",
        "Discusses the negative convexity near the call price — as rates fall, price rises toward par but no further, limiting capital gain.",
        "Recommends using option-adjusted spread (OAS) to properly compare callable and non-callable bonds on an apples-to-apples basis.",
      ],
      weakPatterns: [
        "Analyzes the bond as a straight bond using YTM without call consideration.",
        "Assumes the bond will appreciate substantially as rates fall.",
      ],
    },
  },

  {
    id: "cfa_fi_005",
    category: "cfa",
    type: "fixed_income",
    difficulty: "medium",
    title: "Mortgage-backed securities — prepayment risk in a rate-cut scenario",
    prompt: `A Canadian fixed income investor holds Canadian residential mortgage-backed securities (NHA MBS). The Bank of Canada is widely expected to cut rates by 100bps over the next year, which should drive 5-year fixed mortgage rates meaningfully lower. The investor's MBS has a weighted-average life (WAL) of 4 years and trades at a premium to par.

Describe the prepayment risk exposure. How will the rate cut affect the MBS, and what features of Canadian mortgages differ from U.S. MBS that shape this analysis?`,
    diff: "",
    rubric: {
      mustCover: [
        "Falling rates incentivize homeowners to refinance at lower rates, accelerating prepayments — MBS holders receive principal back earlier than expected, then reinvest at lower rates. For a premium-priced MBS, faster prepayments accelerate the loss of the premium, hurting realized yield.",
        "Canadian mortgages differ structurally from U.S. mortgages: (a) shorter terms — typical 5-year fixed with renewal, not 30-year fixed; (b) prepayment penalties are substantive (interest rate differential or 3-month interest, whichever greater) — reducing refinance incentive; (c) mortgages are 'full recourse' in most provinces — affects credit risk, not prepayment.",
        "The prepayment penalty structure in Canada significantly dampens prepayment sensitivity compared to U.S. MBS where prepayment can be costless — Canadian MBS has less negative convexity. However, at renewal (every 5 years), refinancing frictions are low, so rate-driven decisions cluster at renewal dates rather than occurring continuously.",
      ],
      strongSignals: [
        "Discusses the distinction between NHA-insured MBS (government-backed credit) and conventional or non-insured mortgages — credit risk treatment differs.",
        "Notes that option-adjusted spread analysis is essential for MBS — raw yield or static spread overstates attractiveness due to the embedded prepayment option.",
        "Recommends stress-testing under faster prepayment assumptions to gauge the downside from faster return of principal.",
      ],
      weakPatterns: [
        "Applies U.S. MBS prepayment models directly to Canadian MBS.",
        "Treats the MBS as a straight bond for duration analysis.",
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
    difficulty: "medium",
    title: "Choosing between forwards and options to hedge USD revenue",
    prompt: `A Canadian industrial exporter will receive USD $100M from a U.S. customer in six months. The company's functional currency is CAD. The CFO wants to hedge the FX exposure. Two options are available: (a) a forward contract to sell USD at the 6-month forward rate, (b) a purchased USD put option (right to sell USD at a fixed strike).

Compare the two hedging strategies. In what scenarios would you recommend each? What factors determine the choice?`,
    diff: "",
    rubric: {
      mustCover: [
        "Forward contract locks in a fixed CAD amount — eliminates all FX variability (both upside and downside). Zero upfront cost; obligation to transact at forward rate regardless of spot direction at settlement. Provides certainty but gives up participation if CAD weakens (USD strengthens).",
        "Purchased put option provides asymmetric hedge — sets a floor (strike minus premium) but preserves upside if USD strengthens. Requires upfront premium payment; if the scenario hedged against does not occur, the premium is lost. Economically equivalent to insurance.",
        "Recommendation depends on: (a) if the exporter has strong view that CAD will appreciate (USD weakens), forward locks in better rate; (b) if view is neutral/unclear and the exporter wants to preserve upside, put option preferred despite cost; (c) hedge accounting preferences and CFO risk tolerance also factor in. Hybrid strategies (collar, participating forwards) can balance cost and participation.",
      ],
      strongSignals: [
        "Discusses the cost of carry embedded in the forward rate — if CAD interest rates > USD rates, the 6-month forward CAD/USD shows CAD premium vs spot (or equivalently USD discount), affecting the effective hedge rate.",
        "Recommends considering the exporter's margin and competitive position — thin margins demand certainty (forward), fat margins afford optionality (option).",
        "References hedge accounting treatment — forwards qualify as cash flow hedges more readily; options require accounting care to avoid earnings volatility from time-value changes.",
      ],
      weakPatterns: [
        "Recommends options universally as 'more flexible' without considering cost.",
        "Ignores the upfront premium cost of options in comparison.",
      ],
    },
  },

  {
    id: "cfa_deriv_002",
    category: "cfa",
    type: "derivatives",
    difficulty: "medium",
    title: "Protective put vs covered call — matching strategy to view",
    prompt: `An investor holds 10,000 shares of Royal Bank of Canada (RY.TO), currently trading at $135. Her views are: (1) long-term positive on the bank but (2) concerned about near-term downside risk from a potential recession. She is considering either (a) buying 3-month put options on RY at strike $130 (protective put), or (b) selling 3-month covered calls at strike $145 (covered call).

Evaluate which strategy better matches her stated view. Describe the payoff profile and trade-offs of each.`,
    diff: "",
    rubric: {
      mustCover: [
        "Protective put matches her view — she is concerned about downside and wants to preserve upside participation. The put costs a premium but establishes a floor; if the stock falls below $130, losses are capped. Upside participation is preserved above the current price (minus premium cost).",
        "Covered call does NOT match her view — selling a call caps upside at $145, which is inconsistent with her long-term positive view; meanwhile, it provides only limited downside protection (premium received). If she is worried about downside, covered call is the WRONG direction of asymmetry.",
        "Recommendation: protective put. If premium cost is a concern, consider financing the put by selling an out-of-the-money call (creating a collar) — this gives downside protection while accepting a ceiling on upside; but only if she accepts the capped upside, which contradicts her long-term positive view.",
      ],
      strongSignals: [
        "Draws the payoff diagram concepts explicitly — protective put = long stock + long put = synthetic call; covered call = long stock + short call = synthetic short put.",
        "Discusses the decay of the put's time value if the feared scenario doesn't materialize — the protection has a cost.",
        "Notes that the put strike selection ($130 vs $125) trades off cost vs protection level — deeper OTM = cheaper but less protection.",
      ],
      weakPatterns: [
        "Recommends covered call because it 'generates income' without addressing the directional view mismatch.",
        "Evaluates the strategies without connecting to the investor's stated view.",
      ],
    },
  },

  {
    id: "cfa_deriv_003",
    category: "cfa",
    type: "derivatives",
    difficulty: "medium",
    title: "Interest rate swap to manage debt exposure",
    prompt: `A Canadian manufacturer has CAD $500M of floating-rate debt tied to 3-month CDOR + 200bps. Current CDOR is 4.8%, so the effective rate is 6.8%. Management expects further rate increases over the next 2 years but wants to protect against that outcome. A 5-year interest rate swap is available at a fixed rate of 5.2% vs 3-month CDOR.

Explain how the swap can be used to hedge. What is the post-swap effective cost? What are the risks of this strategy?`,
    diff: "",
    rubric: {
      mustCover: [
        "The manufacturer enters a pay-fixed, receive-floating swap — pays 5.2% fixed, receives 3-month CDOR. Combined with the original floating debt (pays CDOR + 200bps), the net position is: pay 5.2% (swap) - receive CDOR (swap) + pay CDOR + 200bps (debt) = pay 5.2% + 200bps = pay 7.2% fixed.",
        "Post-swap effective cost: 7.2% fixed for 5 years. This is higher than the current 6.8% floating rate BUT protects against further rate increases. Break-even: if CDOR rises above 5.0% (5.2% swap fixed - 200bps, or equivalently overall 7.0%), the hedge pays off relative to unhedged.",
        "Risks: (a) rates may fall instead of rise — the fixed-rate commitment means the company pays more than market floating; (b) counterparty credit risk on the swap (mitigated via clearing/CSA); (c) covenant implications — swap liability on balance sheet may affect leverage ratios; (d) refinancing risk if the underlying debt is refinanced away or prepaid, leaving an orphan swap; (e) CDOR transition risk (CDOR is being replaced by CORRA — swap basis risk).",
      ],
      strongSignals: [
        "Discusses the hedge effectiveness accounting — if swap qualifies as cash flow hedge, MTM changes go to OCI rather than P&L, reducing earnings volatility.",
        "References the CDOR-to-CORRA transition specifically as a Canadian-specific risk that affects existing swaps and new pricing.",
        "Notes alternatives: partial hedge (swap only 50% of exposure to preserve some benefit of potential rate decline), or cap/swaption for asymmetric protection.",
      ],
      weakPatterns: [
        "Confuses pay-fixed vs receive-fixed directions in the swap.",
        "Ignores the CDOR-CORRA transition affecting Canadian floating-rate exposures.",
      ],
    },
  },

  {
    id: "cfa_deriv_004",
    category: "cfa",
    type: "derivatives",
    difficulty: "hard",
    title: "Basis risk in a cross-hedge",
    prompt: `A Canadian oil producer wants to hedge forward production of Western Canadian Select (WCS) crude but finds no deep, liquid futures market for WCS specifically. The producer decides to hedge using WTI crude futures (the most liquid North American oil contract). WCS typically trades at a discount of $15-25 per barrel below WTI, reflecting quality and transport costs.

Analyze the basis risk. Under what conditions might this hedge perform poorly? What additional information and alternatives should the producer consider?`,
    diff: "",
    rubric: {
      mustCover: [
        "Basis risk is the risk that the WCS-WTI differential widens or narrows unpredictably — the hedge protects against WTI price changes but not against differential changes. If WCS discount widens from $20 to $35, the producer loses on the unhedged differential even if WTI is steady.",
        "Conditions where the hedge performs poorly: (a) pipeline or rail takeaway constraints cause WCS discounts to blow out (2018 example — differential hit $50+); (b) Canadian refinery outage reducing local demand for WCS specifically; (c) U.S. policy changes affecting cross-border crude flows; (d) quality-differential changes due to new sour crude supply competition.",
        "Alternatives to consider: (a) WCS-specific OTC swaps with a commodity dealer — better basis alignment but less liquid and with counterparty risk; (b) combined WTI hedge + WTI-WCS differential swap to hedge both legs; (c) volumetric swaps based on WCS index; (d) partial hedge ratio to compensate for historical basis volatility.",
      ],
      strongSignals: [
        "Discusses optimal hedge ratio using regression of WCS returns on WTI returns — the ratio is not 1:1; historical beta estimation yields a more effective hedge.",
        "References the specific 2018 WCS differential episode as a case study of basis risk materializing catastrophically.",
        "Notes that hedging via pipeline capacity contracts can complement financial hedging to address the physical flow risk driving differentials.",
      ],
      weakPatterns: [
        "Treats WTI hedge as a perfect substitute for WCS exposure.",
        "Ignores the possibility of differential blowouts and focuses only on WTI price movement.",
      ],
    },
  },

  {
    id: "cfa_deriv_005",
    category: "cfa",
    type: "derivatives",
    difficulty: "hard",
    title: "Put-call parity violation and arbitrage framework",
    prompt: `You observe the following on a Canadian large-cap stock: spot price $50, European call option with strike $50 and 6 months to expiry trades at $4.50; European put option with same strike and expiry trades at $6.00; the 6-month risk-free rate is 4% annualized; the stock pays no dividend over this period.

Apply the put-call parity framework. Is parity violated? If so, describe conceptually what arbitrage strategy would exploit the violation and what practical obstacles might prevent profit in reality.`,
    diff: "",
    rubric: {
      mustCover: [
        "Put-call parity: C + PV(Strike) = P + S, which rearranges to C - P = S - PV(Strike). Here, C - P = $4.50 - $6.00 = -$1.50. S - PV(Strike) at 4% for 6 months: $50 - $50/(1.02) ≈ $50 - $49.02 = +$0.98. Parity requires C - P = S - PV(Strike), or -$1.50 = +$0.98 — clearly violated. The put is overpriced and/or the call is underpriced relative to parity.",
        "Arbitrage strategy: buy the cheap synthetic (call + PV of strike) and sell the expensive synthetic (put + stock). Specifically: buy call ($4.50), short the stock ($50 received), lend PV($50) ≈ $49.02, buy put ($6.00). Net immediate cash flow: +$50 - $4.50 - $49.02 - $6.00 + ??? — conceptually, the arbitrage locks in the parity gap (~$2.48 risk-free) regardless of stock price at expiry.",
        "Practical obstacles that may prevent actual profit: (a) bid-ask spreads on all four instruments eat into the arbitrage profit; (b) short-sale constraints (borrowing cost, recall risk); (c) margin requirements tie up capital; (d) transaction costs (commissions, exchange fees); (e) the apparent violation may reflect stale option quotes or non-synchronous prices rather than genuine dislocation.",
      ],
      strongSignals: [
        "Distinguishes European and American option parity — the relationship shown applies exactly to European options; American options have inequality bounds due to early exercise possibility.",
        "Notes that persistent parity violations are rare in liquid markets — most apparent violations reflect market microstructure, not genuine arbitrage.",
        "Discusses the dividend adjustment — with dividends, parity becomes C + PV(Strike) = P + S - PV(Dividends); here the zero-dividend assumption simplifies analysis.",
      ],
      weakPatterns: [
        "Concludes parity holds without doing the check.",
        "Proposes an arbitrage strategy with the wrong direction (short the cheap side).",
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
    difficulty: "medium",
    title: "Private equity vs public equity for a Canadian pension plan",
    prompt: `A Canadian corporate defined-benefit pension plan (CAD $5B AUM, closed to new members, 15-year average liability duration) is considering increasing private equity from 5% to 15% of assets, funded by reducing public equity. The CIO's thesis: "PE offers illiquidity premium and higher long-term returns."

Evaluate this allocation decision. What are the benefits, costs, and risks specific to a closed corporate pension plan? What factors would you want to confirm before recommending the increase?`,
    diff: "",
    rubric: {
      mustCover: [
        "Benefits: historically PE has delivered ~200-300bps excess over public equity net of fees (though debated — see critiques of return measurement); illiquidity premium is genuine if the plan can accept long lock-up; diversification from public market beta and access to value creation levers (operational improvement, leverage) not available in public markets.",
        "Costs and risks: high fees (2% management + 20% carry) dragging net returns; J-curve — early years show negative IRR as fees accrue before value materializes; illiquidity is particularly risky for a closed plan with known payout schedule — forced selling in a downturn at steep discounts is a real risk; vintage concentration risk (committing all at one market peak).",
        "Closed corporate plan specifics: liability duration of 15 years suggests moderate illiquidity tolerance BUT payout profile is predictable — cash needs must be met regardless of market. Plan sponsor must commit to multi-year capital calls (typically 3-5 year investment period + 5-7 year harvest), which creates cash-flow discipline. Must assess ability to meet capital calls during market stress.",
      ],
      strongSignals: [
        "Discusses the denominator effect — public market drawdowns inflate PE weight (slow-to-mark PE NAVs) forcing rebalancing out of PE at discounts; critical for a 15% allocation.",
        "Recommends diversification across vintages, strategies (buyout vs growth vs venture), and geographies — concentration in one vintage/year is a major risk.",
        "Notes Canadian pension plan benchmarks — CPP and Ontario Teachers have high PE allocations (25%+) but with massive scale, internal teams, and perpetual horizon; smaller closed plans cannot replicate their model.",
      ],
      weakPatterns: [
        "Accepts the 'illiquidity premium' narrative without considering plan-specific constraints.",
        "Fails to address the J-curve cash flow profile.",
      ],
    },
  },

  {
    id: "cfa_alt_002",
    category: "cfa",
    type: "alternatives",
    difficulty: "medium",
    title: "Hedge fund 2-and-20 fee structure — implications for net returns",
    prompt: `An institutional investor is evaluating a long/short equity hedge fund. The fund charges 2% management fee and 20% performance fee over a hurdle rate of zero (no hurdle), with a high-water mark. The fund's gross returns have been: Year 1: +15%, Year 2: -10%, Year 3: +12%, Year 4: +8%.

Walk through the net return impact of the fee structure year by year. What conclusions would you draw about the fee structure's incentive alignment?`,
    diff: "",
    rubric: {
      mustCover: [
        "Year 1: Gross +15%. Management fee: 2%. Performance fee: 20% × 13% = 2.6%. Net return: 15% - 2% - 2.6% ≈ 10.4%. High-water mark is set at this level. Year 2: Gross -10%. Management fee: 2% (charged regardless of performance — often on NAV). Net return: -10% - 2% ≈ -12%. Portfolio is now below high-water mark; no performance fee charged.",
        "Year 3: Gross +12%. Management fee: 2%. Need to check if high-water mark is recovered. After Year 2 net of -12%, portfolio value is ~0.92 × 1.104 ≈ 0.971 (starting from $1, after Y1 it's $1.104, after Y2 $0.971). Year 3 brings portfolio to 0.971 × 1.10 = ~1.068 (after 2% mgmt fee), which is still below original Y1 high-water mark of 1.104. Performance fee = 0 this year (below high-water mark). Net: +10%.",
        "Year 4: Gross +8%. Management fee: 2%. Net of mgmt fee: ~+6%. Portfolio value: 1.068 × 1.06 = 1.132. Now above Y1 high-water mark (1.104) by 0.028. Performance fee: 20% × 0.028 / 1.068 ≈ 0.52% of Y4 return. Net Y4: ~5.5%. Cumulative net vs gross: gross compounded +25% over 4 years; net compounded much less — the fee structure extracts significant return, especially due to management fee on down years.",
      ],
      strongSignals: [
        "Discusses the asymmetry of incentive fees without hurdle — GP benefits from volatility (upside participation) while LP bears full downside — a call option on performance.",
        "Notes that a hurdle rate (e.g., 5% or risk-free rate) would better align incentives by forcing GP to deliver true alpha before taking performance fee.",
        "References GIPS fee presentation standards and the importance of net-of-fees reporting for LP decision-making.",
      ],
      weakPatterns: [
        "Ignores the management fee drag during negative years.",
        "Assumes performance fee is charged every year without considering high-water mark.",
      ],
    },
  },

  {
    id: "cfa_alt_003",
    category: "cfa",
    type: "alternatives",
    difficulty: "medium",
    title: "Real estate role in a balanced portfolio",
    prompt: `A Canadian high-net-worth investor has a 60/40 stock/bond portfolio. His advisor suggests adding 15% direct Canadian commercial real estate (Toronto/Vancouver office and multi-family). The investor is skeptical, noting: "Real estate is highly correlated to the economy. I already have Canadian REITs in my equity allocation. Why would I add more?"

Evaluate the investor's concern. What differentiates direct real estate from REITs in a portfolio, and what specific risks and benefits would you highlight?`,
    diff: "",
    rubric: {
      mustCover: [
        "Direct real estate differs from REITs in several ways: (a) REITs trade with equity market beta (~0.6-0.8) — correlated to S&P/TSX; direct real estate is less correlated to public markets, providing genuine diversification not captured by REITs; (b) REITs are marked to market daily; direct real estate is appraisal-based (smoothed, lagged), reducing reported volatility; (c) liquidity differs drastically — REITs are liquid, direct real estate requires 6-12 months to sell.",
        "Benefits of direct real estate: long-term income stream from rents (especially multi-family with inflation linkage); tax advantages (depreciation shield); leverage access (mortgage financing) amplifies returns; inflation hedge properties when leases include CPI escalators; illiquidity premium.",
        "Risks and concerns specific to Toronto/Vancouver commercial: (a) office sector faces secular decline from hybrid work — Toronto office vacancy is elevated; (b) regulatory risk from foreign-buyer taxes, rent controls, capital gains changes; (c) concentration risk — two cities, one country; (d) management intensity — direct RE requires active management unlike REITs; (e) valuation opacity — appraisals often lag market.",
      ],
      strongSignals: [
        "Notes that the 'lower volatility' of direct real estate vs REITs is partly an artifact of appraisal smoothing — true economic volatility is higher than reported.",
        "Discusses liquidity-adjusted expected return — illiquidity is a cost that should be compensated by premium, but not all investors can afford the illiquidity.",
        "Recommends considering listed infrastructure or private real estate funds as hybrid alternatives with improved liquidity vs direct ownership.",
      ],
      weakPatterns: [
        "Dismisses the investor's concern by assuming direct and REIT are identical.",
        "Recommends 15% concentrated direct exposure without considering management burden.",
      ],
    },
  },

  {
    id: "cfa_alt_004",
    category: "cfa",
    type: "alternatives",
    difficulty: "medium",
    title: "Commodity allocation as inflation hedge",
    prompt: `A Canadian multi-asset portfolio manager is considering adding a 5% commodities allocation (via a diversified commodity index fund holding energy, metals, and agricultural futures). Her rationale: "Commodities are a proven inflation hedge." Inflation has moderated from 5.5% to 3.5% and consensus expects further decline.

Evaluate the commodity allocation decision. What are the nuances of 'commodities as inflation hedge' that the manager may be oversimplifying?`,
    diff: "",
    rubric: {
      mustCover: [
        "Commodities as inflation hedge has strong evidence in DEMAND-PULL inflation (growth + commodity demand rising together — 1970s, 2021-22) but weak evidence in COST-PUSH or monetary inflation (commodity prices may not track general price levels when inflation is driven by wages or services rather than goods).",
        "In the current scenario (inflation moderating from 5.5% to 3.5%), the timing is poor — commodities typically peak during peak inflation and underperform during disinflation; entering at 3.5% inflation and falling is chasing yesterday's hedge at current high price levels.",
        "Commodity futures returns decompose into: spot price change + roll yield (contango vs backwardation) + collateral return. In contango (most commodities most of the time), roll yield is negative and erodes returns — the strategy may underperform spot price appreciation for extended periods.",
      ],
      strongSignals: [
        "Distinguishes different commodities' inflation-hedging properties — energy and industrial metals more cyclical, gold more monetary inflation hedge, agriculture more weather/supply driven.",
        "Notes the correlation-over-time variability — commodities have periods of very high equity correlation (2008 crisis, 2020 crash) when diversification is most needed.",
        "Recommends considering Canadian-specific context — Canadian economy is already commodity-exposed via TSX composition, so an additional 5% commodity allocation may be over-exposure.",
      ],
      weakPatterns: [
        "Accepts 'commodities hedge inflation' as a universal truth.",
        "Ignores the timing issue of adding commodities as inflation is moderating.",
      ],
    },
  },

  {
    id: "cfa_alt_005",
    category: "cfa",
    type: "alternatives",
    difficulty: "hard",
    title: "Infrastructure investment for a Canadian pension plan",
    prompt: `The Canadian pension fund industry (CPP, CDPQ, OTPP, PSP) has been a leader in direct infrastructure investment globally. A smaller Canadian provincial pension plan (CAD $20B AUM) is considering building an infrastructure allocation from 2% to 10%. The plan has a young member base and growing liability duration (25+ years). Internal team is small but they could use external fund managers.

Evaluate this allocation decision. What makes infrastructure attractive for pension plans specifically? What challenges does a smaller plan face vs the large Canadian pension plans?`,
    diff: "",
    rubric: {
      mustCover: [
        "Infrastructure attractions for pension plans: (a) long-duration cash flows matching long-duration liabilities; (b) inflation-linked revenue (toll roads, regulated utilities, CPI-indexed contracts) hedging inflation risk in liabilities; (c) low correlation to public equities and bonds — genuine diversification; (d) lower volatility (appraisal-based) and stable yield; (e) potential ESG alignment with renewable/green infrastructure.",
        "Challenges for smaller plan vs large Canadian pensions: (a) scale — large deals (>$1B) are inaccessible for minority positions; large pensions invest direct, smaller ones must use funds with 2-and-20 style fees; (b) talent — direct infrastructure requires specialized sourcing, operational, legal expertise; smaller team cannot match CPPIB/CDPQ capacity; (c) access — best deals are typically co-investment/direct, reserved for large commitments; small plans see later vintage or smaller assets.",
        "Recommendation: build allocation gradually via mix of direct fund commitments (closed-end infrastructure funds for diversification and manager expertise), co-investment alongside larger partners (fee-friendly), and possibly listed infrastructure (liquid but more market-correlated). Avoid trying to replicate direct-investment model of large pensions without comparable resources.",
      ],
      strongSignals: [
        "Discusses the J-curve and long capital call period (~3-5 years to deploy) — may be frustrating for committee patience.",
        "Notes the ESG angle — Canadian pensions face LP pressure and regulatory reporting (e.g., SFDR, OSFI climate disclosures) that may favor infrastructure aligned with energy transition.",
        "References specific Canadian pension plan examples (OMERS, CPPIB) as benchmarks for strategy but cautions against wholesale imitation.",
      ],
      weakPatterns: [
        "Recommends replicating CPPIB/OTPP direct model without assessing scale feasibility.",
        "Overlooks the gap between asset-level attractive characteristics and net-of-fee fund returns.",
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
    difficulty: "medium",
    title: "Investment Policy Statement for a Canadian retiree couple",
    prompt: `Clients: Margaret (65) and Jim (67), newly retired. Combined investable assets: CAD $1.8M in RRSPs (now converting to RRIFs), CAD $200K in TFSAs, CAD $500K in non-registered accounts. CPP and OAS cover ~40% of planned annual expenses of $100K; portfolio must generate $60K annually (pre-tax). They own a $900K house, debt-free. Children are financially independent; they plan to leave a modest bequest. Health is good. Time horizon: assume 25+ years.

Outline the key elements of their IPS: return objective, risk tolerance, time horizon, liquidity needs, and any tax/legal constraints specific to Canadian context.`,
    diff: "",
    rubric: {
      mustCover: [
        "Return objective: approximately 3.3% pre-tax real (nominal + inflation + spending + fees) generating $60K on $1.8M core retirement assets. This is a moderate return target — not aggressive, but inflation-linked to maintain purchasing power over 25 years. Asset allocation implied: roughly 50-60% equity / 40-50% fixed income to support real returns without excessive volatility.",
        "Risk tolerance: MODERATE — ability above average (large asset base, bequest flexibility, house as backstop) but willingness likely lower in retirement stage (behavioral preference for stability, sequence-of-returns risk concern). Sequence risk is critical — a severe drawdown in early retirement is hardest to recover from. Glide-path or bucket strategies may help manage.",
        "Liquidity: ~$60K annual withdrawal is small relative to $2.5M total assets (including non-investable), but sequence matters; maintain 1-2 years of expenses in cash/short-term bonds as buffer. Time horizon 25+ years with two life expectancies (longer of the two). Tax considerations: RRIF minimum withdrawals mandated; TFSA withdrawals are tax-free (consider drawing strategy); Canadian dividend tax credit for eligible dividends in non-registered accounts; capital gains treatment.",
      ],
      strongSignals: [
        "Discusses the drawdown sequence — optimal order of account withdrawals (non-registered vs RRIF vs TFSA) for tax efficiency across a 25-year horizon.",
        "Addresses bequest planning — estate freeze, TFSA as inheritance vehicle (remains tax-free for spouse as successor holder), joint tenancy considerations.",
        "Notes behavioral risk — retirees often underestimate longevity and overestimate risk tolerance after positive returns.",
      ],
      weakPatterns: [
        "Sets a single return target without specifying real vs nominal or linking to spending.",
        "Ignores the tax account structure implications for Canadian retirees.",
      ],
    },
  },

  {
    id: "cfa_pm_002",
    category: "cfa",
    type: "portfolio_management",
    difficulty: "medium",
    title: "Asset allocation shift across life stages",
    prompt: `A 30-year-old Canadian software engineer earns CAD $150K, maxes out her TFSA ($7K/yr) and RRSP ($27K/yr), has a company group RRSP match, and has a 35-year time horizon to retirement. She currently holds 100% in a Canadian equity index fund. Her friend (same age, same income) recommends diversifying globally and adding bonds: "You're too concentrated in Canada, and you need some bonds for stability."

Evaluate the current allocation. Describe how allocation should evolve over her life and the rationale. Is the friend's advice correct?`,
    diff: "",
    rubric: {
      mustCover: [
        "Current 100% Canadian equity is highly concentrated — Canada is ~3% of global equity market cap; a globally diversified equity allocation (50% U.S., 20% international developed, 10% emerging, 20% Canadian or less) materially reduces idiosyncratic country risk without sacrificing expected return. TSX is sector-concentrated (40%+ financials + energy + materials) compounding the concentration issue.",
        "For a 30-year-old with 35-year horizon, bond allocation is debatable — high equity allocation (80-100%) is justified by long horizon, high human capital (future earnings), and ability to endure drawdowns. However, a modest bond allocation (10-20%) provides rebalancing optionality (buying equities cheap in downturns) and smooths returns, which helps behavioral discipline.",
        "Allocation evolution: gradual de-risking over time as human capital is converted to financial capital. 30s: 90/10 or 80/20 equity/bond, heavy global diversification; 40s-50s: 70/30; late 50s/retirement: 60/40 or 50/50 with rising fixed income duration matched to liability-like retirement spending. Canadian RRSP/TFSA accounts should hold tax-inefficient assets (bonds, foreign dividends) in registered accounts; Canadian dividends benefit from non-registered tax treatment.",
      ],
      strongSignals: [
        "Discusses currency hedging — whether to hedge USD exposure when adding U.S. equity; partial hedging common for Canadian investors with significant USD exposure.",
        "References home-country bias specifically in Canadian context and the sector concentration problem.",
        "Notes the value of glide-path target-date funds as a low-cost implementation for those without strong active views.",
      ],
      weakPatterns: [
        "Agrees with the friend only on bonds without addressing the much larger concentration issue.",
        "Recommends an overly conservative allocation given her age and horizon.",
      ],
    },
  },

  {
    id: "cfa_pm_003",
    category: "cfa",
    type: "portfolio_management",
    difficulty: "hard",
    title: "Mismatch between stated and behavioral risk tolerance",
    prompt: `A new client completes a risk tolerance questionnaire and scores 'aggressive' (willing to accept a 35% drawdown for higher expected returns). Based on this, you construct an 80/20 equity/bond portfolio. Six months into the relationship, the Canadian stock market declines 20%; her portfolio is down 16%. She calls you in distress, asking to sell everything and 'go to cash until things stabilize.'

Analyze what happened. How do you handle this conversation, and what does it suggest about her IPS going forward?`,
    diff: "",
    rubric: {
      mustCover: [
        "There is a mismatch between her stated 'willingness' (aggressive on questionnaire) and actual behavioral tolerance (panic at 16% drawdown). Risk tolerance questionnaires measure hypothetical responses; real-market experience reveals true tolerance. Ability to take risk (financial capacity) and willingness (behavioral) must both be considered — willingness is usually the binding constraint under stress.",
        "Conversation approach: (a) acknowledge her emotions and validate the discomfort; (b) avoid pressuring her into decisions at peak stress; (c) review her original goals and time horizon — emphasize that selling locks in losses and breaks the long-term plan; (d) discuss the historical evidence that market-timing rarely works and that missed recoveries are severe; (e) propose a compromise if needed (e.g., modest de-risking to 60/40) rather than all-or-nothing.",
        "IPS revision going forward: (a) adjust target allocation to one she can actually hold through drawdowns (perhaps 60/40 or 70/30); (b) add behavioral guardrails — written commitment to not sell below certain thresholds, scheduled rebalancing rather than tactical; (c) use bucket approach if appropriate — short-term bucket reduces anxiety about near-term volatility; (d) document this lesson in the IPS for future reference.",
      ],
      strongSignals: [
        "References behavioral finance concepts — loss aversion (losses feel ~2x as bad as equivalent gains), myopic framing, recency bias.",
        "Discusses the cost of 'selling to cash' — locking in losses plus missing recovery is compounding mistake.",
        "Notes the fiduciary duty to act in client's best interest — which sometimes means protecting her from herself, other times adjusting to her reality.",
      ],
      weakPatterns: [
        "Simply executes the client's request to go to cash without dialogue.",
        "Lectures the client about her 'irrationality' during the emotional peak.",
      ],
    },
  },

  {
    id: "cfa_pm_004",
    category: "cfa",
    type: "portfolio_management",
    difficulty: "medium",
    title: "Rebalancing strategy — tactical vs strategic",
    prompt: `A portfolio manager oversees a Canadian balanced fund with policy targets of 60% equity, 40% fixed income (with drift tolerance of +/- 5% before rebalancing). Over the past year, equity has rallied strongly and drifted to 68%. The manager faces a choice: (1) rebalance back to 60/40 immediately, (2) hold at 68% given continued positive equity momentum, (3) rebalance partially to 65% splitting the difference.

Evaluate each choice. What is the argument for each, and what is the best practice?`,
    diff: "",
    rubric: {
      mustCover: [
        "Choice 1 (rebalance to 60/40) follows strict strategic discipline — sell high-performing equity, buy underperforming fixed income. Consistent with policy; removes behavioral temptation; empirically rebalancing adds value over time through mean reversion. This is the orthodox recommendation if the IPS is to be followed.",
        "Choice 2 (hold at 68%) is tactical — implicitly expresses a view that equity will outperform further; this deviates from policy and requires skill (timing) that most managers lack. 'Letting winners run' feels comfortable but is momentum chasing; if correct, earns more; if wrong, compounds losses.",
        "Choice 3 (partial rebalance to 65%) is a common compromise but lacks principled basis — a 65% target is just a new implicit allocation reflecting recency bias. Unless the IPS has been formally updated to reflect changed circumstances, there is no reason to land at 65% specifically.",
      ],
      strongSignals: [
        "Recommends Choice 1 (full rebalance) as the best practice — discipline over tactical deviation; also reduces risk since drift inflated equity to 68% (excess of target risk budget).",
        "Discusses tax considerations — in a taxable account, realizing gains to rebalance has tax cost; in registered accounts (RRSP, TFSA), no tax drag. May inform rebalancing frequency and use of cash flows for rebalancing without selling.",
        "Notes that threshold-based rebalancing (like the +/- 5% tolerance) is generally superior to calendar-based (annual) — it triggers only when drift is meaningful.",
      ],
      weakPatterns: [
        "Recommends holding the drift based on recent momentum.",
        "Splits the difference (65%) without principled justification.",
      ],
    },
  },

  {
    id: "cfa_pm_005",
    category: "cfa",
    type: "portfolio_management",
    difficulty: "medium",
    title: "Anchoring bias in a client's cost-basis thinking",
    prompt: `A client holds a single Canadian bank stock position (Royal Bank) representing 25% of her investable assets. She inherited the position from her father 15 years ago at a cost basis of $40/share; the stock is now $130. When you recommend diversifying, she says: "I can't sell below $150 — that's the price I've decided is fair based on what I'd get after taxes, and anyway I don't want to sell while it's still going up."

Identify the behavioral biases at play. How do you address them? What diversification plan would you propose?`,
    diff: "",
    rubric: {
      mustCover: [
        "Anchoring — the $150 target has no analytical basis; it's a round number and a psychological reference point. Target prices based on arbitrary anchors are a well-documented bias. Additionally, loss aversion and endowment effect: the bequest dimension creates reluctance to sell something inherited.",
        "Cognitive dissonance / rationalization: combining tax-adjusted breakeven with 'still going up' is inconsistent — if fundamentals justify $150, trajectory is irrelevant; if trajectory is the reason, fundamentals are irrelevant. The client is constructing post-hoc reasoning to avoid diversification.",
        "Addressing the biases: (a) reframe from 'selling' to 'diversifying' (keeping wealth, just spreading it); (b) discuss concentration risk in quantitative terms — 25% in one stock implies significant idiosyncratic risk (one company scandal, one sector downturn); (c) propose a gradual diversification plan (e.g., sell 20% per year for 5 years, or triggered by price thresholds) to reduce regret; (d) use tax-efficient techniques — donate appreciated shares (charitable capital gains exemption), systematic withdrawal in multiple tax years to stay in lower brackets.",
      ],
      strongSignals: [
        "References the specific Canadian tax treatment — inherited property has a stepped-up cost basis at date of death (deemed disposition), though if the inheritance predated gains, the cost basis may differ from the father's original $40.",
        "Notes behavioral finance techniques: commitment device, pre-commitment to rules, scheduled reviews.",
        "Discusses the specific concentration risk of Canadian banks (5 banks dominate Canadian financial sector — correlated risks).",
      ],
      weakPatterns: [
        "Respects the client's $150 anchor as a legitimate constraint without challenge.",
        "Recommends immediate full sale, triggering regret and client relationship damage.",
      ],
    },
  },
];
