const questionBank = [
  {
    id: "question_code_review_001",
    type: "code_review",
    title: "Review a risky null-handling change",
    prompt:
      "Review the diff and explain the most important issues, risks, and next steps before merging it.",
    diff: `diff --git a/src/payments/checkout.js b/src/payments/checkout.js
index 4d2ac10..a19c982 100644
--- a/src/payments/checkout.js
+++ b/src/payments/checkout.js
@@ -12,11 +12,11 @@ export async function buildCheckoutSummary(cart, coupon) {
   const subtotal = cart.items.reduce((sum, item) => sum + item.price, 0);
   const discount = coupon ? await getCouponDiscount(coupon.code) : 0;

-  const total = Math.max(subtotal - discount, 0);
+  const total = subtotal - discount;

   return {
     subtotal,
     discount,
-    total,
+    total: total.toFixed(2),
   };
 }`,
    rubric: {
      mustCover: [
        "Removing the lower bound can produce negative totals when the discount exceeds the subtotal.",
        "toFixed() returns a string, changing the response contract from number to string.",
        "The change needs regression tests for zero-total and over-discount edge cases."
      ],
      strongSignals: [
        "Mentions downstream breakage if callers do arithmetic on the total field.",
        "Suggests a schema or type check to catch contract drift."
      ],
      weakPatterns: [
        "Only notes that toFixed changes precision without mentioning the type change.",
        "Approves or dismisses the change without addressing both issues."
      ]
    }
  },
  {
    id: "question_code_review_002",
    type: "code_review",
    title: "Review a silent error swallow in async handler",
    prompt:
      "Review the diff and identify the most critical risks before this is merged to production.",
    diff: `diff --git a/src/api/orders.js b/src/api/orders.js
index 8b1e3c2..d74f091 100644
--- a/src/api/orders.js
+++ b/src/api/orders.js
@@ -18,12 +18,10 @@ router.post('/orders', async (req, res) => {
   try {
     const order = await createOrder(req.body);
-    await sendOrderConfirmationEmail(order);
-    res.status(201).json({ ok: true, orderId: order.id });
+    sendOrderConfirmationEmail(order).catch(() => {});
+    res.status(201).json({ ok: true, orderId: order.id });
   } catch (error) {
-    logger.error('Order creation failed', { error });
-    res.status(500).json({ error: 'Order creation failed' });
+    res.status(500).json({ error: error.message });
   }
 });`,
    rubric: {
      mustCover: [
        "The email error is silently swallowed — failures are invisible in logs and monitoring.",
        "Exposing error.message in the 500 response leaks internal implementation details to clients.",
        "Fire-and-forget email means there is no retry, no dead-letter queue, and no alerting."
      ],
      strongSignals: [
        "Recommends structured logging instead of raw error.message in the response.",
        "Proposes a background job or queue for email delivery instead of fire-and-forget.",
        "Notes that silent catch blocks are an observability antipattern."
      ],
      weakPatterns: [
        "Focuses only on the UX of the email without noting the security leak.",
        "Approves the fire-and-forget pattern without noting failure visibility."
      ]
    }
  }
];

export function getDefaultPracticeQuestion() {
  return structuredClone(questionBank[0]);
}

export function getRandomPracticeQuestion() {
  const index = Math.floor(Math.random() * questionBank.length);
  return structuredClone(questionBank[index]);
}

export function getPracticeQuestionById(questionId) {
  return structuredClone(questionBank.find((q) => q.id === questionId) || null);
}

export function getAllPracticeQuestions() {
  return structuredClone(questionBank);
}
