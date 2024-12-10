import "jsr:@std/dotenv/load";
import { fetchContributionsForYear } from "./functions/gh-contributions.ts";
import { getUserInput } from "./functions/input.ts";
import { createTotal } from "./functions/total.ts";

async function main() {
  const { year, usernames } = getUserInput();

  for (const user of usernames) {
    await fetchContributionsForYear(user, year);
  }

  createTotal(usernames, year);
}

main().catch((error) => console.error("Error:", error));
