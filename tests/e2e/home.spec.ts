import { expect, test } from "@playwright/test";

test("home identifies the first build without suggesting a playable game", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Counterball · Korre");
  await expect(
    page.getByRole("heading", { name: "Counterball" }),
  ).toBeVisible();
  await expect(page.getByText("The game is not playable yet.")).toBeVisible();

  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await expect(skipLink).toBeAttached();
  await skipLink.focus();
  await expect(skipLink).toBeFocused();
});
