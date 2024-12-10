import { ensureFile } from "https://deno.land/std@0.224.0/fs/mod.ts";
import "jsr:@std/dotenv/load";
import { parse, stringify } from "jsr:@std/yaml";

export async function sumContributions(usernames: string[], year: number) {
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

export async function createTotal(usernames: string[], year: number) {
  const totalContributions = await sumContributions(usernames, year);

  await ensureFile(`contributions_total_${year}.yml`);

  const totalYaml = stringify(totalContributions);
  await Deno.writeTextFile(`contributions_total_${year}.yml`, totalYaml);

  console.log(
    `Total contributions for all users in ${year} written to contributions_total_${year}.yml`
  );
}
