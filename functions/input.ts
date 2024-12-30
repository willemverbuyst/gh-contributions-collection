export function getYearFromUser(): number {
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

export function getUsernameFromUser(): string {
  const username = prompt("Enter the GitHub username:");

  if (!username || username.trim() === "") {
    console.error("GitHub username is required.");
    Deno.exit(1);
  }

  return username.trim();
}

export function getYesNoAnswer(promptMessage: string): boolean {
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

export function getUserInput(): { year: number; usernames: string[] } {
  const year = getYearFromUser();

  const usernames: string[] = [];

  const addAnotherUserPrompt = "Do you want to add another username? (yes/no)";
  const username = getUsernameFromUser();
  usernames.push(username);

  let addAnotherUser = getYesNoAnswer(addAnotherUserPrompt);

  while (addAnotherUser) {
    const secondUsername = getUsernameFromUser();
    usernames.push(secondUsername);
    addAnotherUser = getYesNoAnswer(addAnotherUserPrompt);
  }

  return { year, usernames };
}
