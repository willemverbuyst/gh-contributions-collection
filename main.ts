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
  query ($username: String!) {
    user(login: $username) {
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        restrictedContributionsCount
      }
    }
  }
`;

const variables = {
  username: GITHUB_USERNAME,
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

  const contributions = data.data.user.contributionsCollection;
  console.log("Contributions Summary:");
  console.log(`Commits: ${contributions.totalCommitContributions}`);
  console.log(`Pull Requests: ${contributions.totalPullRequestContributions}`);
  console.log(`Issues: ${contributions.totalIssueContributions}`);
  console.log(
    `Restricted Contributions: ${contributions.restrictedContributionsCount}`
  );
}

// Run the function
fetchContributions().catch((error) => console.error("Error:", error));
