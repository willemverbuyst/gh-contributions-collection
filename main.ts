import "jsr:@std/dotenv/load";
import { stringify } from "jsr:@std/yaml";

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

async function main() {
  const username = getUsernameFromUser();
  const year = getYearFromUser();
  await fetchContributionsForYear(username, year);
}

main().catch((error) => console.error("Error:", error));
