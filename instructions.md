This analysis report is rock-solid. It provides a precise blueprint of the internal portal, clearly identifying both low-hanging fruit and critical structural bottlenecks.

For a busy printing business like **Art 'n Me**, staff need a dashboard that is **bulletproof, fast, and impossible to mess up accidentally**.

Here is a prioritized breakdown of the critical findings, along with strategic recommendations on how to execute these fixes systematically without breaking existing features.

---

## 🚨 Priority 1: Critical Security & Server Performance Fixes

*Tackle these immediately to prevent server crashes and security gaps as order volume grows.*

### 1. Fix the $O(N)$ In-Memory Server Crashes

* **The Problem:** `getOrderStats()` and `getCustomersWithOrderCount()` pull **every single row** from Postgres into Node.js memory to perform JS `.filter()` and `.reduce()` operations. At 50 orders, this goes unnoticed. At 500+ orders, opening `/dashboard` will freeze the server or throw memory limit errors.
* **The Fix:** Push all aggregates to Postgres via SQL:
* Replace `getOrderStats()` with a single Drizzle query using `sql\`COUNT(*) FILTER (WHERE ...)``and`SUM()`.
* Replace customer revenue calculation with a `LEFT JOIN customers ON orders` with a SQL `GROUP BY`.



### 2. Plug the Edge Security Hole (`proxy.ts` + Layout Guard)

* **The Problem:** Currently, `proxy.ts` refreshes auth tokens but doesn't hard-redirect unauthenticated users away from `/dashboard/*`. Furthermore, `dashboard/layout.tsx` doesn't run `requireAuth()`. This means unauthenticated visitors get served the full dashboard layout shell before individual page actions throw an auth error.
* **The Fix:**
* Add explicit route matching in `proxy.ts`: if no active Supabase session exists and the URL starts with `/dashboard`, issue a `NextResponse.redirect("/login")` right at the edge.
* Add `requireAuth()` directly at the top of `(admin)/dashboard/layout.tsx` as a fallback defense-in-depth layout guard.



### 3. Replace String Money with Numeric/Cents

* **The Problem:** Storing financial amounts as `text` strings and running `parseFloat()` across every single component causes floating-point precision errors (e.g., `$10.00` becoming `10.0000000002` or NaN formatting bugs).
* **The Fix:** Migrate Postgres columns for `totalAmount` and `depositAmount` to `numeric(10, 2)` or store integers representing total cents.

---

## 🛠️ Priority 2: Staff Workflow & Data Integrity

*Essential for daily print shop operations and preventing accidental data loss.*

| Area | Current Flaw | Required Solution |
| --- | --- | --- |
| **Order Edits** | Deletes all `order_items` and re-inserts them on every edit. | Implement a proper diff/upsert transaction to preserve `item.id` references. |
| **Data Loss** | Hard `DELETE` on orders. | Switch to soft-deletes (`deletedAt` timestamp). Staff should never permanently erase financial history. |
| **Staff Accountability** | Mutations don't record *who* made the change. | Add `createdBy` and `updatedBy` columns to `orders`, populated with `user.id` during actions. |
| **Missing Customer View** | `getCustomerById` exists, but there is no `/dashboard/customers/[id]` page. | Build a dedicated customer detail page displaying their full order history, total spent, and quick-contact options. |

---

## 📈 Priority 3: Operator Usability & Scale

*Features that make daily staff tasks significantly faster.*

1. **Server-Side Pagination & Search:** Shift Kanban/Table filtering from client-side array operations to SQL `limit/offset` or cursor pagination so the board loads instantly even with thousands of archived jobs.
2. **Detailed Form Error Surfaces:** Extract Zod validation issue arrays (`parsed.error.flatten()`) in server actions and send field-specific messages back to client forms instead of generic "Invalid data" toasts.
3. **Optimistic Status Transitions:** When staff click "Advance to Next Status" on a Kanban card, move the card immediately on screen, rolling back only if the server action throws an error.

---

## 🗺️ Suggested Execution Plan

To execute these updates cleanly without breaking the portal, divide the work into four focused, isolated tasks for OpenCode:

1. **Phase 1 (Database & Security):** Refactor `proxy.ts`, add the layout auth guard, and convert `getOrderStats()` / `getCustomersWithOrderCount()` to pure SQL Drizzle queries.
2. **Phase 2 (Order Engine Hardening):** Fix string money types, switch hard deletes to soft deletes (`deletedAt`), and implement `createdBy`/`updatedBy` staff tracking.
3. **Phase 3 (Customer Portal & UX):** Create the missing `/dashboard/customers/[id]` route and surface detailed Zod field errors in forms.
4. **Phase 4 (Performance & Pagination):** Implement server-side search/pagination for the orders and customer tables.

