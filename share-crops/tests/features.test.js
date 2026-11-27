// End-to-end feature tests against the production build, served at /share-crops/ like GitHub Pages.
const test = require("node:test");
const assert = require("node:assert/strict");
const { startServer, launch, openApp, joinAsGuest, atHash, tab } = require("./helpers");

let srv, browser;
test.before(async () => { srv = await startServer(); browser = await launch(); });
test.after(async () => { await browser.close(); srv.server.close(); });

async function closeCtx(page) {
  assert.deepEqual(page.errors, [], "no page errors");
  await page.context().close();
}

test("signed-out visitors land on sign-in, and deep links wait behind it", async () => {
  const page = await openApp(browser, srv.base, { hash: "#/offers" });
  await atHash(page, "login");
  await page.getByRole("button", { name: "Try it as a guest" }).waitFor();
  await page.getByText("Everything stays in this browser").waitFor();
  await closeCtx(page);
});

test("guest joins Las Cimas and sees the seeded market with trending items", async () => {
  const page = await openApp(browser, srv.base);
  await joinAsGuest(page);
  await page.getByText(/Most requested in Las Cimas/i).waitFor();
  assert.ok(await page.locator(".listing-card").count() >= 8, "Las Cimas listings shown");
  await page.getByPlaceholder(/Search produce/i).fill("fig");
  await page.waitForFunction(() => document.querySelectorAll(".listing-card").length === 1);
  assert.match(await page.locator(".listing-card").first().innerText(), /Figs/);
  await closeCtx(page);
});

test("full trade as a buyer: offer, seller accepts, chat reply, complete, rate, get rated back", async () => {
  const page = await openApp(browser, srv.base);
  await joinAsGuest(page);
  await page.locator(".listing-card", { hasText: "Heirloom Tomatoes" }).first().click();
  await atHash(page, "listing/");
  await page.getByRole("button", { name: "Make Offer" }).click();
  await page.locator(".modal-sheet input, .modal-sheet textarea").first().fill("A jar of pickles");
  await page.getByRole("button", { name: "Submit Offer" }).click();
  await page.getByText("Offer sent").waitFor();

  await page.getByRole("button", { name: /back/i }).click();
  await tab(page, "Offers");
  await page.getByText("PENDING", { exact: false }).first().waitFor();
  // The simulated seller accepts about 4 seconds later, without a reload.
  await page.getByRole("button", { name: "Mark as Completed" }).waitFor({ timeout: 10_000 });

  await tab(page, "Messages");
  await page.getByText(/Accepted! A jar of pickles/).click();
  await atHash(page, "messages/");
  const box = page.getByPlaceholder(/Message/);
  await box.fill("When can I pick up?");
  await box.press("Enter");
  await page.getByText(/porch|after 5/i).waitFor({ timeout: 8_000 });

  await page.getByRole("button", { name: "Back" }).click();
  await tab(page, "Offers");
  await page.getByRole("button", { name: "Mark as Completed" }).click();
  await page.getByRole("button", { name: "Rate Exchange" }).click();
  await page.locator(".modal-sheet button[aria-label*='5'], .modal-sheet .tomato-btn, .modal-sheet button").filter({ hasNotText: /cancel|submit/i }).last().click();
  await page.getByPlaceholder(/Share your experience/).fill("Great tomatoes!");
  await page.locator(".modal-sheet button.btn-primary").click();
  await page.locator(".modal-sheet").waitFor({ state: "detached" });

  // The seller rates the guest back a few seconds after completion.
  await tab(page, "Profile");
  await page.getByText(/Smooth trade|Friendly and on time|Great produce/).waitFor({ timeout: 10_000 });
  // Ownership moved to the buyer, like the production complete_offer() function.
  await page.getByText("Heirloom Tomatoes").first().waitFor();
  await closeCtx(page);
});

test("full trade as a seller: list produce, get an offer from a neighbor, accept it", async () => {
  const page = await openApp(browser, srv.base);
  await joinAsGuest(page);
  await page.getByRole("button", { name: /List/ }).first().click();
  await page.getByPlaceholder("e.g., Fresh Tomatoes").fill("Zucchini");
  await page.getByPlaceholder("10 lbs").fill("5 lbs");
  await page.getByRole("button", { name: /Draft it for me/ }).click();
  await page.waitForFunction(() => /zucchini/i.test(document.querySelector(".modal-sheet textarea")?.value || ""));
  await page.locator(".modal-sheet input[type=file]").setInputFiles({
    name: "zucchini.png", mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR42mNk+M9QzwAEjDAGNzYGAD1UBP0w5fUIAAAAAElFTkSuQmCC", "base64")
  });
  await page.locator(".modal-sheet img").first().waitFor();
  await page.locator(".modal-sheet button.btn-primary").last().click();
  await page.getByText("Listing created").waitFor();
  await page.locator(".listing-card", { hasText: "Zucchini" }).first().waitFor();

  await tab(page, "Offers");
  await page.getByRole("button", { name: /Incoming/ }).click();
  await page.getByRole("button", { name: "Accept" }).waitFor({ timeout: 12_000 });
  await page.getByRole("button", { name: "Accept" }).click();
  await page.getByText("Offer accepted").waitFor();
  await closeCtx(page);
});

test("the server's rules still hold: no offers on your own listing", async () => {
  const page = await openApp(browser, srv.base);
  await joinAsGuest(page);
  // Your own listing shows no Make Offer button.
  await page.getByRole("button", { name: /List/ }).first().click();
  await page.getByPlaceholder("e.g., Fresh Tomatoes").fill("Kale");
  await page.getByPlaceholder("10 lbs").fill("2 bunches");
  await page.getByPlaceholder("Tell others about it…").fill("Curly kale, cut today.");
  await page.locator(".modal-sheet button.btn-primary").last().click();
  await page.locator(".listing-card", { hasText: "Kale" }).first().click();
  await atHash(page, "listing/");
  await page.getByText("Curly kale, cut today.").waitFor();
  assert.equal(await page.getByRole("button", { name: "Make Offer" }).count(), 0);
  await closeCtx(page);
});

test("data survives a reload and the session stays signed in", async () => {
  const page = await openApp(browser, srv.base);
  await joinAsGuest(page);
  await page.reload();
  await atHash(page, "marketplace");
  await page.locator(".listing-card").first().waitFor();
  await closeCtx(page);
});

test("email sign-up, log out, log back in, and a wrong password is refused", async () => {
  const page = await openApp(browser, srv.base);
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.getByLabel("Name").fill("Pat Grower");
  await page.getByLabel("Email").fill("pat@example.com");
  await page.getByLabel("Password").fill("weak");
  await page.getByRole("button", { name: "Create Account" }).click();
  await page.getByRole("alert").filter({ hasText: /at least 8/ }).waitFor();
  await page.getByLabel("Password").fill("Garden#2026");
  await page.getByRole("button", { name: "Create Account" }).click();
  await atHash(page, "community-setup");
  await page.getByRole("button", { name: "Log out" }).click();
  await atHash(page, "login");

  await page.getByLabel("Email").fill("pat@example.com");
  await page.getByLabel("Password").fill("Wrong#2026x");
  await page.getByRole("button", { name: "Log In" }).click();
  await page.getByRole("alert").filter({ hasText: "Incorrect email or password." }).waitFor();
  await page.getByLabel("Password").fill("Garden#2026");
  await page.getByRole("button", { name: "Log In" }).click();
  await atHash(page, "community-setup");
  const stored = await page.evaluate(() => localStorage.getItem("sharecrops_demo_db_v1"));
  assert.ok(!stored.includes("Garden#2026"), "password is not stored in plain text");
  await closeCtx(page);
});

test("creating a community makes you its first member", async () => {
  const page = await openApp(browser, srv.base);
  await page.getByRole("button", { name: "Try it as a guest" }).click();
  await atHash(page, "community-setup");
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByPlaceholder("e.g., Eastside Growers").fill("Windsor Park Swap");
  await page.getByPlaceholder("98112").fill("78723");
  await page.locator(".btn-block.btn-primary").click();
  await atHash(page, "marketplace");
  await page.getByText(/Windsor Park Swap/).first().waitFor();
  await closeCtx(page);
});

test("reset demo data restores the sample neighborhood", async () => {
  const page = await openApp(browser, srv.base);
  await joinAsGuest(page);
  await tab(page, "Profile");
  page.once("dialog", d => d.accept());
  await page.getByRole("button", { name: "Reset demo data" }).click();
  await atHash(page, "login");
  const users = await page.evaluate(() => {
    const raw = localStorage.getItem("sharecrops_demo_db_v1");
    return raw ? JSON.parse(raw).users.filter(u => !u.bot).length : 0;
  });
  assert.equal(users, 0);
  await page.getByRole("button", { name: "Try it as a guest" }).waitFor();
  await closeCtx(page);
});
