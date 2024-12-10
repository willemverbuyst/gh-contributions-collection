import { ensureFile } from "https://deno.land/std@0.224.0/fs/mod.ts";
import "jsr:@std/dotenv/load";
import { parse, stringify } from "jsr:@std/yaml";

const GITHUB_GRAPHQL_API = "https://api.github.com/graphql";
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");

if (!GITHUB_TOKEN) {
  console.error("Please define GITHUB_TOKEN in your .env file.");
  Deno.exit(1);
}

function getYearFromUser(): number {
  const yearInput = prompt(
    "Enter the year you want to query contributions for:"
  );

  if (!yearInput) {
    console.error("Year input is required.");
    Deno.exit(1);
  }

  const year = parseInt(yearInput, 10);
  const currentYear = new Date().getFullYear();

  // Validate if it's a number and within a reasonable range
  if (isNaN(year) || year < 2000 || year > currentYear) {
    console.error(
      `Invalid year. Please enter a year between 2000 and ${currentYear}.`
    );
    Deno.exit(1);
  }

  return year;
}

function getUsernameFromUser(): string {
  const username = prompt("Enter the GitHub username:");

  if (!username || username.trim() === "") {
    console.error("GitHub username is required.");
    Deno.exit(1);
  }

  return username.trim();
}

async function fetchContributionsForYear(username: string, year: number) {
  const from = `${year}-01-01T00:00:00Z`;
  const to = `${year}-12-31T23:59:59Z`;

  const variables = {
    username,
    from,
    to,
  };

  const query = `
    query ($username: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $username) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch(GITHUB_GRAPHQL_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GITHUB_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    console.error(
      "Failed to fetch data:",
      response.status,
      response.statusText
    );
    return;
  }

  const data = await response.json();
  if (data.errors) {
    console.error("GraphQL errors:", data.errors);
    return;
  }

  type Week = { contributionDays: { contributionCount: number; date: string } };
  type Day = { contributionCount: number; date: string };

  const weeks =
    data.data.user.contributionsCollection.contributionCalendar.weeks;
  const dailyContributions = weeks.flatMap(
    (week: Week) => week.contributionDays
  );

  const contributionsYaml = dailyContributions.reduce(
    (acc: Record<string, number>, day: Day) => {
      acc[day.date] = day.contributionCount;
      return acc;
    },
    {}
  );

  const yamlData = stringify(contributionsYaml);

  const outputFilePath = `contributions_${username}_${year}.yml`;
  await Deno.writeTextFile(outputFilePath, yamlData);

  console.log(`Contributions data written to ${outputFilePath}`);
}

function getYesNoAnswer(promptMessage: string): boolean {
  const answer = prompt(promptMessage)?.toLowerCase().trim();

  if (answer === "y" || answer === "yes") {
    return true;
  } else if (answer === "n" || answer === "no") {
    return false;
  } else {
    console.error("Invalid input, please enter 'y' or 'n'.");
    Deno.exit(1);
  }
}

async function sumContributions(usernames: string[], year: number) {
  const totalContributions: Record<string, number> = {};

  for (const username of usernames) {
    const filePath = `contributions_${username}_${year}.yml`;

    try {
      const fileContent = await Deno.readTextFile(filePath);
      const contributions = parse(fileContent) as Record<string, number>;

      for (const date in contributions) {
        if (totalContributions[date]) {
          totalContributions[date] += contributions[date];
        } else {
          totalContributions[date] = contributions[date];
        }
      }
    } catch (err) {
      console.error(`Error reading file ${filePath}:`, err);
    }
  }

  return totalContributions;
}

async function main() {
  const year = getYearFromUser();

  const usernames: string[] = [];

  const addAnotherUserPromt = "Do you want to add another username? (yes/no)";
  const username = getUsernameFromUser();
  usernames.push(username);

  let addAnotherUser = getYesNoAnswer(addAnotherUserPromt);

  while (addAnotherUser) {
    const secondUsername = getUsernameFromUser();
    usernames.push(secondUsername);
    addAnotherUser = getYesNoAnswer(addAnotherUserPromt);
  }

  for (const user of usernames) {
    await fetchContributionsForYear(user, year);
  }

  // Now, sum up the contributions for all users and write to a total file
  const totalContributions = await sumContributions(usernames, year);

  // Ensure the output file exists
  await ensureFile(`contributions_total_${year}.yml`);

  // Write summed contributions to a new YAML file
  const totalYaml = stringify(totalContributions);
  await Deno.writeTextFile(`contributions_total_${year}.yml`, totalYaml);

  console.log(
    `Total contributions for all users in ${year} written to contributions_total_${year}.yml`
  );
}

main().catch((error) => console.error("Error:", error));
