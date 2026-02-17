const axios = require("axios");
const { execSync } = require("child_process");
const fs = require("fs");

async function run() {
  try {
    // -----------------------------
    // Read GitHub event payload
    // -----------------------------
    const event = JSON.parse(
      fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8")
    );

    if (!event.pull_request) {
      console.error("❌ This workflow must run on pull_request event.");
      process.exit(1);
    }

    const prNumber = event.pull_request.number;
    const base = event.pull_request.base.ref;
    const owner = event.repository.owner.login;
    const repo = event.repository.name;

    console.log("PR Number:", prNumber);
    console.log("Base Branch:", base);
    console.log("Repository:", `${owner}/${repo}`);

    // -----------------------------
    // Fetch base branch
    // -----------------------------
    execSync(`git fetch origin ${base}`, { stdio: "inherit" });

    // -----------------------------
    // Collect commit messages
    // -----------------------------
    const commits = execSync(
      `git log origin/${base}..HEAD --oneline`
    ).toString();

    // -----------------------------
    // Collect changed files
    // -----------------------------
    const files = execSync(
      `git diff --name-only origin/${base}...HEAD -- . ':!package-lock.json' ':!*.min.js'`
    ).toString();

    // -----------------------------
    // Collect diff
    // -----------------------------
    let diff = execSync(
      `git diff origin/${base}...HEAD -- . ':!package-lock.json' ':!*.min.js'`
    ).toString();

    // Protect against large payloads (Gemini limits)
    const MAX_DIFF_LENGTH = 20000;
    if (diff.length > MAX_DIFF_LENGTH) {
      diff = diff.substring(0, MAX_DIFF_LENGTH);
      diff += "\n\n[Diff truncated due to size limit]";
    }

    // -----------------------------
    // Build Gemini prompt
    // -----------------------------
    const prompt = `
You are a senior software engineer.

Generate a professional pull request description.

Return markdown with the following sections:

## Summary
## Problem Statement
## Changes Made
## Technical Details
## Testing Done
## Risks / Impact

Be concise but clear.
Do not hallucinate functionality not present in the diff.

Commit Messages:
${commits}

Changed Files:
${files}

Git Diff:
${diff}
`;

    console.log("Calling Gemini API...");

    // -----------------------------
    // Call Gemini
    // -----------------------------
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const prBody =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "AI PR generation failed.";

    console.log("Updating PR description...");

    // -----------------------------
    // Update GitHub PR
    // -----------------------------
    await axios.patch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
      { body: prBody },
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json"
        }
      }
    );

    console.log("✅ PR updated successfully!");
  } catch (error) {
    console.error("❌ Error generating PR description:");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error(error.message);
    }

    process.exit(1);
  }
}

run();
