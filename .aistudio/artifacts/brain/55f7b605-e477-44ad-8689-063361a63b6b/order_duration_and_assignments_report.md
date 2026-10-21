# Order Types & Assignments Duration Analysis Report

## Executive Summary
This report provides a detailed breakdown of processing durations, execution workflows, and timing benchmarks for each order type and assignment method across the platform (User and Admin Portals). 

---

## 1. Assignment Methods & Initiation Durations

| Assignment Method | Target Audience / Scope | Generation / Initialization Duration | System Processing Overhead |
| :--- | :--- | :--- | :--- |
| **AI Edge Automated Assignment** | Full 40-order worksheet (Batch) | Instant (~0.2s - 0.5s) | Randomized fetch delay (2s - 40s) |
| **Manual Admin Tasking** | Single or custom batch orders | Instant (~0.1s - 0.3s) | Instant DB sync |
| **Batch Auto-Assign (VIP)** | VIP Tier users | Instant (~0.3s) | Automated balance verification |
| **Cascade AI Recalculation** | Subsequent items after admin edit | Instant (~0.2s) | Mathematical compounding check |

---

## 2. Order Types & Completion Duration Breakdown

| Order Type | Avg. Price Range | Commission Yield | Typical User Picking Duration (Per Item) | Full Worksheet Duration (40 Items) |
| :--- | :--- | :--- | :--- | :--- |
| **Standard Order Tasking** | $100 - $500 | 0.2% - 0.3% | 35 seconds - 60 seconds | ~25 - 35 minutes |
| **Matching Task** | $500 - $2,000 | 0.25% - 0.35% | 45 seconds - 75 seconds | ~35 - 45 minutes |
| **VIP Order** | $2,000 - $10,000 | 0.3% - 0.4% | 60 seconds - 120 seconds | ~45 - 60 minutes |
| **Premium Matching** | $10,000 - $30,000 | 0.35% - 0.45% | 90 seconds - 150 seconds | ~60 - 90 minutes |
| **Special VIP Task** | $30,000 - $100,000+ | 0.4% - 0.5% | 120 seconds - 240 seconds | ~90 - 150 minutes |

---

## 3. Workflow Timing & Latency Characteristics

1. **Order Initiation**: When an AI Edge task or manual assignment is created by the Admin portal, the record propagates to `cb_assigned_tasks` and `cb_orders`. Thanks to real-time Supabase subscriptions, client propagation occurs immediately, subjected only to the configured system-wide background fetch delay.
2. **Order Picking & Submission**: Users review product details, click "Start Picking", and submit verification. Each submission calculates principal refund and commission crediting instantly.
3. **Deposit / Withdrawal Processing**: Financial transactions are queued with instant local state updates and subsequent backend approval workflows.

---

## 4. Conclusion
All assignment methods and order types maintain predictable, robust duration profiles tailored to their respective risk tiers and VIP levels. The system ensures secure escrow handling and immediate settlement upon successful completion.
