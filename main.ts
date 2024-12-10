import "jsr:@std/dotenv/load";

const GITHUB_GRAPHQL_API = "https://api.github.com/graphql";
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
const GITHUB_USERNAME = Deno.env.get("GITHUB_USERNAME");

if (!GITHUB_TOKEN || !GITHUB_USERNAME) {
  console.error(
    "Please define GITHUB_TOKEN and GITHUB_USERNAME in your .env file."
  );
  Deno.exit(1);
}

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

// Define the date range for 2024
const variables = {
  username: GITHUB_USERNAME,
  from: "2024-01-01T00:00:00Z",
  to: "2024-12-31T23:59:59Z",
};

async function fetchContributions() {
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

  const weeks =
    data.data.user.contributionsCollection.contributionCalendar.weeks;
  const dailyContributions = weeks.flatMap(
    (week: { contributionDays: { contributionCount: number; date: string } }) =>
      week.contributionDays
  );

  console.log("Contributions per Day in 2024:");
  dailyContributions.forEach(
    (day: { contributionCount: number; date: string }) => {
      console.log(`${day.date}: ${day.contributionCount} contributions`);
    }
  );
}

fetchContributions().catch((error) => console.error("Error:", error));
