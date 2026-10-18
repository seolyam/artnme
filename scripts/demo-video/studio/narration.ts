/**
 * Voiceover for the 3D Studio guide shown to customers, one line per step.
 * Written for people who have never used a design app: short sentences, plain
 * words, and every button named exactly as it appears on screen.
 */
export const NARRATION = {
  intro:
    "Hi! Welcome to the Art 'n Me 3D Studio. You don't need any design skills to use it. In three easy steps, you'll see exactly how your shirt will look before we print it.",
  open: "On our website, click 3D Studio at the top of the page.",
  tour:
    "Your shirt is on the left, and the three steps are on the right: Color, Design, and Review. Just follow them in order. On a phone, the shirt is on top and the steps are below it.",
  color1: "Step one: choose the color of your shirt. Tap a color, and the shirt changes right away.",
  color2: "We'll go with navy blue. When you like the color, tap Next.",
  upload1:
    "Step two: add your design. To put your own logo or picture on the shirt, tap Add image layers, then choose the picture from your phone or computer.",
  upload2: "Your picture appears on the front of the shirt right away.",
  place:
    "To change where it goes, use the Quick placement buttons. Left chest makes a small logo, like on a polo shirt. Full front makes it big. Center chest puts it in the middle.",
  size: "To make it bigger or smaller, slide the Width bar. The height follows along, so your picture never gets stretched.",
  nudge: "For small changes, tap the arrows to move it up, down, left, or right.",
  text1:
    "Now let's add some words, like a family name, a team name, or a year. Type your text in the box, then pick an ink color.",
  text2: "Tap Add, and your text appears on the shirt.",
  back1: "Let's put the name on the back. While the text is selected, tap Upper back under Quick placement.",
  back2: "To see the back of the shirt, tap Back at the top.",
  spin: "You can also drag the shirt with your finger or mouse to turn it all the way around, and scroll or pinch to zoom in and out.",
  layers:
    "Everything you add is listed under Your layers. Tap a layer to select it and change it again. Tap the eye to hide it, or the trash can to remove it.",
  next2: "Happy with your design? Tap Next: review and export.",
  review: "Step three: check your design. Here you can see your shirt color and how many prints you added.",
  download:
    "Tap Download 4-angle mockup. This saves one picture that shows the front, the back, and both sides of your shirt.",
  mockup: "Here's the picture you just saved. You can also send it to your family or friends to get their opinion.",
  saved:
    "Your design is saved on your device automatically. If you leave and come back later, it will still be here. To make a new design from scratch, tap Start over.",
  quote1: "When you're ready to order, tap Send to quote.",
  quote2:
    "Type your name and phone number. The T-shirt is already picked for you, so just enter how many pieces you need, and write the sizes in Project details.",
  quote3: "Then tap Attach your design, and choose the mockup picture you downloaded.",
  quote4:
    "Finally, tap Submit inquiry. We'll message you with the price and a proof, usually within one to two hours.",
  outro:
    "That's it! Pick a color, add your design, and send it to us. If you get stuck, just message us on Facebook, and we'll be happy to help.",
} as const;

export type StepId = keyof typeof NARRATION;
