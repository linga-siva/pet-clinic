const axios = require("axios");
const { execSync } = require("child_process");

async function run() {
  try {
    const prNumber = process.env.GITHUB_REF.split("/").pop();
    const base = process.env.GITHUB_BASE_REF;

    console.log("PR Number:", prNumber);
    console.log("Base Branch:", base);

    // Get commit messages
    const commits = execSync(
      `git log origin/${base}..HEAD --oneline`
    ).toString();

    // Get changed files (ignore lock + minified files)
    const files = execSync(
      `git diff --name-only origin/${base}...HEAD -- . ':!package-lock.json' ':!*.min.js'`
    ).toString();

    // Get diff (filtered)
    let diff = execSync(
      `git diff origin/${base}...HEAD -- . ':!package-lock.json' ':!*.min.js'`
    ).toString();

    // Protect against huge diffs (Gemini free tier safety)
    const MAX_DIFF_LENGTH = 20000;
    if (diff.length > MAX_DIFF_LENGTH) {
      diff = diff.substring(0, MAX_DIFF_LENGTH);
      diff += "\n\n[Diff truncated due to size limit]";
    }

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

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      }
    );

    const prBody =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "AI PR generation failed.";

    console.log("Updating PR description...");

    await axios.patch(
      `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/pulls/${prNumber}`,
      { body: prBody },
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json"
        }
      }
    );

    console.log("PR updated successfully ✅");
  } catch (error) {
    console.error("Error generating PR description:");
    console.error(
      error.response?.data || error.message || error
    );
    process.exit(1);
  }
}

run();

