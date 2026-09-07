"use client";

import { useState } from "react";
import { ArrowRightIcon, CheckIcon, FileCode2Icon, GitPullRequestIcon, LightbulbIcon } from "lucide-react";
import styles from "@/app/landing.module.css";

export function LandingPreview() {
  const [view, setView] = useState<"scenario" | "feedback">("scenario");

  return (
    <div id="product-preview" className={styles.productPreview}>
      <div className={styles.previewToolbar}><span><GitPullRequestIcon aria-hidden="true" />Code review</span><span className={styles.exampleBadge}>EXAMPLE PREVIEW</span></div>
      <div className={styles.previewSwitch} role="group" aria-label="Example preview view">
        <button type="button" aria-pressed={view === "scenario"} aria-controls="example-content" onClick={() => setView("scenario")}><span>01</span> The scenario</button>
        <button type="button" aria-pressed={view === "feedback"} aria-controls="example-content" onClick={() => setView("feedback")}><span>02</span> The feedback</button>
      </div>
      <div id="example-content" className={styles.previewContent} aria-live="polite" aria-atomic="true">
        {view === "scenario" ? (
          <div className={styles.scenarioView}>
            <h2>Would you approve this?</h2>
            <p>The endpoint returns an order by ID.<br />The tests pass. What could go wrong?</p>
            <div className={styles.codeWindow}>
              <div className={styles.codeTitle}><span><FileCode2Icon aria-hidden="true" />api/orders.ts</span><span>+3 &minus;1</span></div>
              <pre tabIndex={0} aria-label="Example code diff: an order lookup now uses only the order ID, without checking the owner"><code>
                <span className={styles.codeLine}><i aria-hidden="true">14</i><span>async function getOrder(id, user) {"{"}</span></span>
                <span className={`${styles.codeLine} ${styles.removedLine}`}><i aria-hidden="true">15</i><span>- return db.orders.find(id, user.id);</span></span>
                <span className={`${styles.codeLine} ${styles.addedLine}`}><i aria-hidden="true">15</i><span>+ const order = await db.orders.find(id);</span></span>
                <span className={`${styles.codeLine} ${styles.addedLine}`}><i aria-hidden="true">16</i><span>+ if (!order) throw new NotFound();</span></span>
                <span className={`${styles.codeLine} ${styles.addedLine}`}><i aria-hidden="true">17</i><span>+ return order;</span></span>
                <span className={styles.codeLine}><i aria-hidden="true">18</i><span>{"}"}</span></span>
              </code></pre>
            </div>
            <div className={styles.promptNote}><LightbulbIcon aria-hidden="true" /><span>Look beyond correctness.<br /><strong>Who should be allowed to see this order?</strong></span></div>
            <button type="button" className={styles.revealButton} onClick={() => setView("feedback")}>Reveal example feedback <ArrowRightIcon aria-hidden="true" /></button>
          </div>
        ) : (
          <div className={styles.feedbackView}>
            <h2>A working endpoint. A missing boundary.</h2>
            <p>Example feedback on a review that spots the access risk but leaves the fix unspecified.</p>
            <div className={styles.criteriaHeader}><span>CRITERION COVERAGE</span><strong>2 of 3 covered</strong></div>
            <ul className={styles.criteriaList}>
              <li><CheckIcon aria-hidden="true" /><span>Spotted the missing ownership check</span><strong>Covered</strong></li>
              <li><CheckIcon aria-hidden="true" /><span>Explained the cross-user data risk</span><strong>Covered</strong></li>
              <li className={styles.missingCriterion}><span aria-hidden="true">!</span><span>Proposed a concrete fix and test</span><strong>Missing</strong></li>
            </ul>
            <div className={styles.nextStep}><span>YOUR NEXT STEP</span><p>Scope the lookup to the current user. Add a test proving one user cannot read another user&apos;s order.</p></div>
            <button type="button" className={styles.revealButton} onClick={() => setView("scenario")}>Revisit the scenario <ArrowRightIcon aria-hidden="true" /></button>
          </div>
        )}
      </div>
    </div>
  );
}
