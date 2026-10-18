/**
 * Voiceover for the staff portal training video, one line per step.
 * `record.ts` shows each line as a caption while the matching action plays,
 * and `tts.ps1` turns each line into a WAV clip.
 */
export const NARRATION = {
  intro:
    "Welcome to the Art 'n Me staff portal. In the next few minutes you'll learn how to handle a job, from the moment a customer walks in until they pick up their order.",
  login:
    "Open the staff portal and sign in with the email and password your manager gave you. Never share your login. Every payment and status change is saved under your name.",
  dash1:
    "This is the Command Center, your home screen. The cards across the top show active jobs, what's due today, overdue jobs, unpaid balances, and orders ready for pickup. Click any card to see those orders.",
  dash2:
    "Needs attention lists the jobs to handle first. Today's drawer shows how much has been collected today, and My jobs counts the work assigned to you.",
  new1: "When a customer walks in, click New order.",
  new2:
    "Step one: who is it for? Search by name or phone number. For a first-time customer, choose Add a new customer, then type their name and mobile number.",
  new3:
    "Step two: what are we making? Pick the product, then enter the quantity, the sizes, and the price for each piece. Write the design details here so the artist knows exactly what to make.",
  new4: "Next, set the due date. The quick buttons fill it in for you, and pickup time defaults to 5 PM.",
  new5:
    "If the customer leaves a downpayment, tap Half or Full, or type the amount, and choose how they paid. Then click Create order.",
  order1:
    "This is the order page. The bar at the top shows where the job is: Pending, Designing, Printing, Ready, and Done. The downpayment is already recorded under Payments.",
  note:
    "Use Activity and notes for anything the team should know, like special requests from the customer. Notes are for staff only. Customers never see them.",
  status1:
    "When you start on the design, click Move to Designing. Every change is logged with your name and the time.",
  proof:
    "Upload the design proof under Files and proofs. Choose Design proof, then pick the file. The newest proof is always marked, so the whole team works from the same version.",
  message:
    "To contact the customer, use Message customer. Pick a ready-made message, like Proof, then copy it and paste it into Messenger or a text message. It already has the customer's name and order number.",
  approve: "When the customer says the proof is okay, click Customer approved this, so everyone knows it's safe to print.",
  pay1:
    "When the customer pays again, click Record payment. You'll see the total, what's paid, and what's still owed. The portal won't let you record more than the balance, which catches typing mistakes.",
  pay2: "Enter the correct amount, choose Cash, GCash, or another method, and record it.",
  status2:
    "When printing starts, move the job to Printing. When it's finished, use the More actions menu, or the board, to move it to Ready for pickup.",
  release:
    "When the customer comes to pick it up, click Collect and release. It records the remaining balance and completes the order in one step.",
  track:
    "Every order has a tracking page for the customer. Copy the link from the Job panel and send it to them. They see the status, due date, and balance, but none of your internal notes.",
  board1:
    "The Orders board shows every active job in columns by status. Use the button on each card to move a job along without opening it.",
  board2:
    "Filter the board by My jobs, Unassigned, Overdue, or Due today, or search by order number, title, or customer name.",
  search:
    "Need to find something fast? Press Control K on any page and type an order number, a customer name, or a phone number. Press Enter to open it.",
  cust:
    "Customers keeps everyone's contact details and order history. Open a customer to see all their orders and what they still owe.",
  prices:
    "The Price list holds your standard prices. Your manager sets them, and they show up as one-tap buttons when you add an item to an order.",
  reports:
    "Reports shows today's collections by payment method and by staff member. Check it at closing time to make sure the cash in the drawer matches.",
  outro:
    "That's it! Record every payment the moment you receive it, move each job as soon as the work changes, and keep notes on the order, not in your head. Thank you!",
} as const;

export type StepId = keyof typeof NARRATION;
