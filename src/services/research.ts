export interface ResearchFinding {
  findings: string[];
  confidenceDelta: number;
  source: string;
}

export class ResearchService {
  async queryRegulatoryFilings(question: string): Promise<ResearchFinding> {
    const q = question.toLowerCase();
    if (q.includes('cosmetics') || q.includes('eu')) {
      return {
        findings: [
          'EU Regulation 1223/2009 is the primary legal framework governing cosmetic products in the European Union. It requires that all cosmetic products placed on the EU market must be safe for human health when used under normal or reasonably foreseeable conditions of use. The regulation applies to manufacturers, importers, and distributors across all 27 member states.',
          'Before any cosmetic product can be placed on the EU market, a qualified safety assessor must complete a Cosmetic Product Safety Report (CPSR). This two-part report includes a quantitative and qualitative description of the product and an overall safety assessment conclusion. The regulation explicitly bans animal testing for cosmetic purposes since March 2013.',
          'All cosmetic products must be notified through the Cosmetic Products Notification Portal (CPNP) before being marketed. The notification must include product category, name, responsible person details, the original labelling, and a product photo. Additionally, the presence of nanomaterials must be specifically flagged and evaluated.',
        ],
        confidenceDelta: 0.35,
        source: 'regulatory',
      };
    }
    if (q.includes('fda') || q.includes('drug')) {
      return {
        findings: [
          'The FDA requires a New Drug Application (NDA) under Section 505 of the Federal Food, Drug, and Cosmetic Act before any new pharmaceutical product can be marketed in the United States. The NDA must include full reports of investigations demonstrating the drug is safe and effective, a complete list of components, a description of manufacturing methods, and proposed labelling.',
          'Clinical trial data submitted in an NDA must demonstrate both safety and efficacy through a phased trial process: Phase I (20–100 healthy volunteers for safety/dosage), Phase II (up to several hundred patients for effectiveness/side effects), and Phase III (1,000–3,000+ patients for definitive efficacy confirmation). The entire FDA review process typically takes 10–15 years from initial research to approval, with an average R&D cost exceeding $2.6 billion per approved drug.',
          'The FDA offers several expedited pathways for drugs addressing serious or life-threatening conditions: Fast Track designation (rolling review), Breakthrough Therapy designation (intensive FDA guidance), Accelerated Approval (using surrogate endpoints), and Priority Review (6-month review instead of standard 10 months). Each pathway has specific eligibility criteria and can significantly reduce time to market.',
        ],
        confidenceDelta: 0.45,
        source: 'regulatory',
      };
    }
    return {
      findings: [
        'General regulatory guidelines suggest compliance with local consumer protection laws, industry-specific codes of conduct, and international standards where applicable. Organizations should consult jurisdiction-specific regulatory bodies to determine which filing requirements, licensing obligations, and reporting standards apply to their particular product category and target market.',
        'Most jurisdictions require pre-market notification or approval for products that affect consumer health and safety. This includes maintaining proper documentation of ingredient sourcing, manufacturing processes, quality control measures, and post-market surveillance protocols.',
      ],
      confidenceDelta: 0.15,
      source: 'regulatory',
    };
  }

  async queryCaseLaw(question: string): Promise<ResearchFinding> {
    const q = question.toLowerCase();
    if (q.includes('cosmetics') || q.includes('eu')) {
      return {
        findings: [
          'Case C-321/14 (Sanchez v. Medicina Asturiana SA, CJEU) established critical precedents regarding the interpretation of Regulation 1223/2009, particularly around the definition of "cosmetic product" versus "medicinal product." The ruling clarified that functional claims (e.g., anti-aging, skin repair) must not cross into therapeutic territory, and manufacturers bear the burden of proof that their product does not meet the definition of a medicinal product.',
          'In the landmark case The European Commission v. France (Case C-592/14), the CJEU ruled that member states cannot impose additional pre-market approval requirements beyond those specified in Regulation 1223/2009, reinforcing the principle of maximum harmonization. This ruling has been instrumental in preventing regulatory fragmentation across the EU.',
          'Ingredient labeling requirements have been strictly enforced in recent member state rulings, with fines reaching €500,000+ for non-compliance. The German Federal Court (BGH) in case I ZR 36/19 held that the INCI naming convention is mandatory and that marketing names cannot substitute for chemical nomenclature on packaging.',
        ],
        confidenceDelta: 0.25,
        source: 'caselaw',
      };
    }
    if (q.includes('fda') || q.includes('drug')) {
      return {
        findings: [
          'In United States v. Caronia (2012, 2nd Circuit), the court ruled that the First Amendment protects truthful off-label promotion by pharmaceutical sales representatives, marking a significant shift in FDA enforcement policy. However, the FDA continues to monitor and enforce against misleading off-label marketing through warning letters, consent decrees, and qui tam actions under the False Claims Act.',
          'Recent False Claims Act settlements highlight the enormous financial exposure for inaccurate adverse event reporting. GlaxoSmithKline paid $3 billion (2012) and Pfizer paid $2.3 billion (2009) for off-label promotion and failure to report safety data. These cases established that pharmaceutical companies have an affirmative duty to proactively report known adverse events to the FDA within 15 calendar days for serious events.',
          'The Supreme Court decision in Mutual Pharmaceutical Co. v. Bartlett (2013) held that state-law design-defect claims against generic drug manufacturers are preempted by federal law, significantly limiting product liability exposure for generic manufacturers while maintaining full liability for brand-name drug companies under Wyeth v. Levine (2009).',
        ],
        confidenceDelta: 0.30,
        source: 'caselaw',
      };
    }
    return {
      findings: [
        'No specific precedents were found for this niche topic. Reliance on general contract law principles, including the Uniform Commercial Code (UCC) provisions on express and implied warranties, is advised. Organizations should ensure their product documentation and marketing materials do not create unintended warranty obligations.',
        'For novel product categories without established case law, courts typically apply analogous precedents from related industries. It is recommended to obtain a formal legal opinion reviewing the most relevant analogous cases before proceeding to market.',
      ],
      confidenceDelta: 0.10,
      source: 'caselaw',
    };
  }

  async querySpecialist(question: string): Promise<ResearchFinding> {
    const q = question.toLowerCase();
    if (q.includes('cosmetics') || q.includes('eu')) {
      return {
        findings: [
          'Expert opinion: The EU is expected to finalize restrictions on intentionally added microplastics (ECHA restriction proposal under REACH) by late 2025, with a phased compliance timeline extending to 2029. Cosmetics manufacturers should begin reformulating rinse-off products immediately and leave-on products within the next 18 months. PFAS restrictions under the universal PFAS restriction proposal will likely follow by 2027, affecting an estimated 40% of currently marketed cosmetic formulations.',
          'Recommendation: Conduct an immediate supply chain audit for non-compliant raw materials, focusing on polymer-based rheology modifiers, film-forming agents, and fluorinated surfactants. Companies sourcing ingredients from non-EU suppliers should obtain written compliance certifications and consider establishing alternative supplier relationships to mitigate supply disruption risk during the regulatory transition period.',
          'Market intelligence: Consumer demand for "clean beauty" products with transparent ingredient sourcing has grown 29% year-over-year in the EU market. Early compliance with upcoming restrictions presents a significant competitive advantage, as reformulated products can be marketed with enhanced sustainability claims under the EU Green Claims Directive.',
        ],
        confidenceDelta: 0.30,
        source: 'specialist',
      };
    }
    if (q.includes('fda') || q.includes('drug')) {
      return {
        findings: [
          'Expert opinion: Fast Track and Breakthrough Therapy designations are increasingly competitive, with only 30–40% of applications receiving approval. To improve success rates, applicants should focus on novel surrogate endpoints validated through biomarker qualification programs and present real-world evidence (RWE) alongside traditional clinical data. The FDA has signaled particular interest in decentralized clinical trial designs and digital health endpoints.',
          'Recommendation: Engage with the FDA early through pre-IND meetings and Type B meeting requests, ideally 12–18 months before planned NDA submission. Recent guidance documents emphasize the value of a well-characterized target product profile (TPP) and a clear regulatory strategy that addresses Chemistry, Manufacturing, and Controls (CMC) considerations from the outset. Companies pursuing complex generics or biosimilars should additionally request a pre-ANDA or pre-BLA meeting.',
          'Market intelligence: The FDA approved 55 novel drugs in 2023, maintaining a historically high approval rate. Oncology, rare diseases, and neurology continue to dominate the pipeline, but there is growing interest in AI/ML-derived drug candidates and RNA-based therapeutics. The Inflation Reduction Act\'s drug price negotiation provisions are reshaping launch pricing strategies, particularly for drugs with Medicare Part D exposure.',
        ],
        confidenceDelta: 0.20,
        source: 'specialist',
      };
    }
    return {
      findings: [
        'Expert opinion: For products entering uncharted regulatory territory, a proactive engagement strategy with relevant regulatory bodies is strongly recommended. This includes filing pre-submission requests, attending public advisory committee meetings, and monitoring relevant Federal Register notices and guidance document drafts. Proceed with caution and seek localized counsel before product launch to avoid costly post-market enforcement actions.',
        'Market intelligence: Cross-jurisdictional regulatory harmonization initiatives (e.g., ICH, IMDRF) are increasingly reducing barriers for products seeking simultaneous multi-market approval. Companies should evaluate whether mutual recognition agreements or collaborative review programs could accelerate their regulatory timeline.',
      ],
      confidenceDelta: 0.25,
      source: 'specialist',
    };
  }
}
