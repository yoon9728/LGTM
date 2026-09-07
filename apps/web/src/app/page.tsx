import type { Metadata } from "next";
import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  BracesIcon,
  CheckIcon,
  ChevronDownIcon,
  CodeXmlIcon,
  DatabaseIcon,
  GitPullRequestIcon,
  LayersIcon,
  ScaleIcon,
  ScanSearchIcon,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserButton } from "@/components/user-button";
import { MobileNav } from "@/components/mobile-nav";
import { LandingPreview } from "@/components/landing-preview";
import styles from "./landing.module.css";

const displayFont = Space_Grotesk({ subsets: ["latin"], variable: "--font-landing" });

export const metadata: Metadata = {
  title: "LGTM | Stop reading AI code. Start leading it.",
  description:
    "Practice code review, system design, debugging, data analysis, practical coding, and CFA scenarios. Explain your thinking, get specific feedback, and find your next step.",
};

const practiceAreas = [
  { icon: GitPullRequestIcon, number: "01", label: "Code review", category: "code_review", description: "Find the risk hiding in a seemingly harmless diff.", detail: "Read. Question. Review." },
  { icon: LayersIcon, number: "02", label: "System design", category: "system_design", description: "Make the tradeoffs. Then make the case for them.", detail: "Design for the real world." },
  { icon: ScanSearchIcon, number: "03", label: "Debugging", category: "debugging", description: "Follow the evidence from symptom to root cause.", detail: "Less guessing. More reasoning." },
  { icon: DatabaseIcon, number: "04", label: "Data analysis", category: "data_analysis", description: "Turn queries, pipelines, and data into sound decisions.", detail: "Go beyond the numbers." },
  { icon: CodeXmlIcon, number: "05", label: "Practical coding", category: "practical_coding", description: "Build a working solution, not just a clever one.", detail: "Implementation meets judgment." },
  { icon: ScaleIcon, number: "06", label: "CFA practice", category: "cfa", description: "Apply financial concepts through scenarios and MCQs.", detail: "Put your knowledge to work." },
];

const steps = [
  { number: "01", title: "Pick your challenge.", description: "Choose a practice area and a scenario. Start with the skill you want to sharpen, not a syllabus to finish." },
  { number: "02", title: "Show your thinking.", description: "Review a diff, explain a design, write code, or work through a question. Make your reasoning visible." },
  { number: "03", title: "Find your next step.", description: "Get feedback on your response. See what held up, what needs work, and where to focus next." },
];

const faqs = [
  { question: "Can I try it without an account?", answer: "Yes. Guest practice gives you access to a selection of scenarios, subject to a daily session limit. Create an account to access the broader question library and keep your practice history in one place." },
  { question: "Is this for interviews or everyday work?", answer: "Both. LGTM focuses on explaining decisions, identifying risks, and reasoning through tradeoffs. Use it to prepare for technical interviews or to practice the kinds of decisions you encounter on the job." },
  { question: "How does the feedback work?", answer: "Written responses are evaluated by AI against scenario-specific criteria, with feedback on your reasoning and coverage. CFA multiple-choice questions use answer-key scoring. AI feedback can be imperfect, so use it as a learning aid, not a definitive assessment of your ability." },
  { question: "Do I need to be a senior engineer?", answer: "No. Pick a topic and difficulty that fit where you are now. The goal is to improve how you approach a problem, not to prove that you already know everything. Data analysis and CFA practice also extend beyond software engineering." },
];

function Brand() {
  return (
    <Link href="/" className={styles.brand} aria-label="LGTM home">
      <span className={styles.brandMark} aria-hidden="true"><BracesIcon /><CheckIcon /></span>
      LGTM<span className={styles.beta}>BETA</span>
    </Link>
  );
}

export default function LandingPage() {
  return (
    <div className={`${styles.landing} ${displayFont.variable}`}>
      <a href="#main-content" className={styles.skipLink}>Skip to content</a>
      <header className={styles.header}>
        <div className={`${styles.container} ${styles.headerInner}`}>
          <Brand />
          <nav className={styles.desktopNav} aria-label="Main navigation">
            <a href="#practice-areas">Practice areas</a>
            <a href="#how-it-works">How it works</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className={styles.headerActions}>
            <ThemeToggle />
            <UserButton />
            <Link href="/practice" className={`${styles.primaryButton} ${styles.headerCta}`}>Start practicing <ArrowUpRightIcon aria-hidden="true" /></Link>
            <MobileNav />
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={`${styles.container} ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}><span className={styles.statusDot} />LESS MEMORIZING. MORE UNDERSTANDING.</p>
              <h1 id="hero-title">Stop reading AI code.<br />Start <span className={styles.highlight}>leading</span> it.</h1>
              <p className={styles.heroDescription}>Knowing the answer is one thing. Knowing <strong>why</strong> is another. Practice real-world scenarios and get feedback that helps you think one step further.</p>
              <div className={styles.heroActions}>
                <Link href="/practice" className={styles.primaryButton}>Start practicing <ArrowUpRightIcon aria-hidden="true" /></Link>
                <a href="#product-preview" className={styles.textButton}>Explore an example <ArrowDownIcon aria-hidden="true" /></a>
              </div>
              <p className={styles.guestNote}><CheckIcon aria-hidden="true" /> Try guest practice. No account needed.</p>
              <div className={styles.heroFootnote}><span className={styles.miniLine} />A practice space for your next &ldquo;here&apos;s why.&rdquo;</div>
            </div>
            <div className={styles.previewStage}>
              <div className={styles.stageLabel}><span>ONE SMALL DIFF. ONE BIG QUESTION.</span><ArrowDownLeftIcon aria-hidden="true" /></div>
              <LandingPreview />
              <div className={styles.previewCaption}><span className={styles.statusDot} />A sample, not a live evaluation. Try both views.</div>
            </div>
          </div>
          <div className={`${styles.container} ${styles.proofStrip}`}>
            <div><span className={styles.proofNumber}>06</span><span>practice areas.<br /><strong>One sharper you.</strong></span></div>
            <p>Real-world scenarios</p><span aria-hidden="true">+</span><p>Your own reasoning</p><span aria-hidden="true">+</span><p>Specific feedback</p>
          </div>
        </section>

        <section id="practice-areas" className={`${styles.container} ${styles.section}`} aria-labelledby="areas-title">
          <div className={styles.sectionHeading}>
            <div><p className={styles.eyebrow}>FIND YOUR PRACTICE</p><h2 id="areas-title">Different challenges.<br />Same muscle: judgment.</h2></div>
            <p>From your next pull request to your next financial case. Choose where you want to get better.</p>
          </div>
          <div className={styles.areaGrid}>
            {practiceAreas.map(({ icon: Icon, ...area }) => (
              <Link key={area.category} href={`/practice/${area.category}`} className={styles.areaLink}>
                <div className={styles.areaTop}><Icon aria-hidden="true" /><span>{area.number} /</span></div>
                <h3>{area.label}<ArrowUpRightIcon aria-hidden="true" /></h3>
                <p>{area.description}</p>
                <span className={styles.areaDetail}>{area.detail}</span>
              </Link>
            ))}
          </div>
        </section>

        <section id="how-it-works" className={styles.processSection} aria-labelledby="process-title">
          <div className={`${styles.container} ${styles.section}`}>
            <div className={styles.sectionHeading}>
              <div><p className={styles.eyebrow}>A SIMPLE PRACTICE LOOP</p><h2 id="process-title">Think it through.<br />Then go a little deeper.</h2></div>
              <Link href="/practice" className={styles.textButton}>Find your first challenge <ArrowRightIcon aria-hidden="true" /></Link>
            </div>
            <div className={styles.steps}>
              {steps.map((step) => (
                <div className={styles.step} key={step.number}>
                  <span className={styles.stepNumber}>{step.number}<ArrowRightIcon aria-hidden="true" /></span>
                  <h3>{step.title}</h3><p>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.container} ${styles.feedbackSection}`} aria-labelledby="feedback-title">
          <div className={styles.feedbackVisual}>
            <div className={styles.visualHeading}><span>THE FEEDBACK LOOP</span><span aria-hidden="true">[ + ]</span></div>
            <p className={styles.visualStatement}>Not just<br /><span>&ldquo;looks good.&rdquo;</span></p>
            <div className={styles.feedbackRows}>
              <div><span className={styles.caughtDot} /><strong>What you caught</strong><CheckIcon aria-hidden="true" /></div>
              <div><span className={styles.missedDot} /><strong>What you missed</strong><span aria-hidden="true">+</span></div>
              <div><span className={styles.nextDot} /><strong>What to try next</strong><ArrowUpRightIcon aria-hidden="true" /></div>
            </div>
            <span className={styles.visualCaption}>A clearer next step beats a number alone.</span>
          </div>
          <div className={styles.feedbackCopy}>
            <p className={styles.eyebrow}>MAKE EVERY ATTEMPT COUNT</p>
            <h2 id="feedback-title">The useful part<br />is what comes next.</h2>
            <p>A score can tell you where you landed. Specific feedback helps you decide where to go.</p>
            <ul className={styles.benefits}>
              <li><CheckIcon aria-hidden="true" /><span><strong>See the gaps in your reasoning.</strong> Scenario-level criteria make the feedback easier to act on.</span></li>
              <li><CheckIcon aria-hidden="true" /><span><strong>Build on what you got right.</strong> Recognize your strengths, not just your mistakes.</span></li>
              <li><CheckIcon aria-hidden="true" /><span><strong>Keep your practice in perspective.</strong> Sign in to revisit your history and explore your dashboard.</span></li>
            </ul>
            <Link href="/practice" className={styles.textButton}>Put your thinking to the test <ArrowRightIcon aria-hidden="true" /></Link>
          </div>
        </section>

        <section id="faq" className={`${styles.container} ${styles.faqSection}`} aria-labelledby="faq-title">
          <div><p className={styles.eyebrow}>BEFORE YOU JUMP IN</p><h2 id="faq-title">Good questions.</h2><p className={styles.faqIntro}>A few things worth knowing before your first scenario.</p></div>
          <div className={styles.faqList}>
            {faqs.map((faq) => (
              <details key={faq.question} className={styles.faqItem}>
                <summary>{faq.question}<ChevronDownIcon aria-hidden="true" /></summary><p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.closingSection} aria-labelledby="closing-title">
          <div className={`${styles.container} ${styles.closingInner}`}>
            <div><p className={styles.eyebrow}>LESS SCROLLING. MORE SOLVING.</p><h2 id="closing-title">Your next good decision<br />starts with practice.</h2><p>Pick one scenario. See where your thinking takes you.</p></div>
            <div className={styles.closingAction}><Link href="/practice" className={styles.primaryButton}>Find your first challenge <ArrowUpRightIcon aria-hidden="true" /></Link><span>Guest practice available. No account needed.</span></div>
          </div>
        </section>
      </main>

      <footer className={`${styles.container} ${styles.footer}`}>
        <div><Brand /><span>Practice the thinking behind the work.</span></div>
        <nav aria-label="Footer navigation"><Link href="/practice">Practice</Link><a href="#faq">FAQ</a><span>&copy; 2026 LGTM</span></nav>
      </footer>
    </div>
  );
}
