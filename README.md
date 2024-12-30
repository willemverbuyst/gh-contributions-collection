# README

> deno run --allow-net --allow-read --allow-env --allow-write main.ts

## How does this work?

1. When running this you will prompted to enter a year (in the terminal). Next you will be prompted to enter a gh-username. And more usernames if you want

2. It will generate a `contributions_<GH USERNAME>_<SELECTED YEAR>.yml` with the contributions for the selected year for each username

3. It will generate a `contributions_total_<SELECTED YEAR>.yml`, which has the sum of the contributions of all usernames for the selected year

## Prerequisites

A github token.

You can add

```
GITHUB_TOKEN=your-token
```

to a `.env`
