import dotenv from "dotenv";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { MDStory } from "./types";

import {
  closeAllIssues,
  createIssue,
  createIssueAddToProject,
  createLabelIfNotExists,
  deleteAllLabels,
  fetchAllIssues,
  getProjectInfo,
  getRepositoryId,
  initClient,
} from "./github/client";
import { getMDStory } from "./parse";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const epicsDir = join(__dirname, "../data/epics");
const storiesDir = join(__dirname, "../data/stories");
// eslint-disable-next-line style/arrow-parens
const epicFiles = readdirSync(epicsDir).filter((file) => file.endsWith(".md"));
// eslint-disable-next-line style/arrow-parens
const storyFiles = readdirSync(storiesDir).filter((file) =>
  file.endsWith(".md"),
);

dotenv.config();

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const token = process.env.GITHUB_TOKEN;

if (!owner || !repo || !token) {
  throw new Error(
    "GITHUB_OWNER, GITHUB_REPO and GITHUB_TOKEN must be set in .env",
  );
}

initClient(token);

// run this section if the --delete flag is passed
if (process.argv.includes("--delete")) {
  // delete all the issues created
  // 1. fetch all the issues in the project
  const projectIssues = await fetchAllIssues(owner, repo);

  // 2. delete(close) all the issues.
  await closeAllIssues(owner, repo, projectIssues, token);
  // 3. delete all the labels created
  await deleteAllLabels(owner, repo, token);

  console.log("All issues and labels deleted successfully.");

  process.exit(0);
}

const projectInfo = await getProjectInfo({ owner, repo });
if (!projectInfo) {
  throw new Error("Could not find project information");
}
const repositoryId = await getRepositoryId({ owner, repo });

const epics: Record<
  string,
  {
    epic: MDStory & {
      stories: MDStory[];
    };
    issueId: string;
  }
> = {};
epicFiles.forEach((file) => {
  const content = readFileSync(join(epicsDir, file), "utf-8");
  const { frontmatter, description } = getMDStory(content);
  // eslint-disable-next-line ts/no-non-null-asserted-optional-chain
  const epicNumber = file.match(/^(\d+)-/)?.[1]!;

  epics[epicNumber] = {
    epic: {
      frontmatter,
      description,
      stories: [],
    },
    issueId: "",
  };
});

const labels = [
  ...new Set([
    // eslint-disable-next-line style/arrow-parens
    ...Object.values(epics).map((epic) => epic.epic.frontmatter.label),
    "Epic",
  ]),
];
const labelsByName = new Map<string, string>();
for (const label of labels) {
  const labelInfo = await createLabelIfNotExists({
    repositoryId,
    label: {
      name: label,
    },
  });
  labelsByName.set(label, labelInfo.id);
}

type MDStoryWithEpic = MDStory & {
  title: string;
  priority: number;
  epic: {
    labelId: string;
    issueId: string;
  };
};

for (const epicStory of Object.values(epics)) {
  const labelId = labelsByName.get("Epic");

  if (!labelId) {
    throw new Error(`Label "Epic" not found`);
  }

  const issueId = await createIssue({
    repositoryId,
    projectInfo,
    owner,
    repo,
    issue: {
      title: epicStory.epic.frontmatter.title!,
      body: epicStory.epic.frontmatter.role
        ? `As a ${epicStory.epic.frontmatter.role}, I want to ${epicStory.epic.frontmatter.action} so that ${epicStory.epic.frontmatter.benefit}.`
        : "",
    },
    labelId,
  });

  epicStory.issueId = issueId!;
}

const priorityOrder = JSON.parse(
  readFileSync(join(__dirname, "../data/priority.json"), "utf-8"),
) as string[];

const storiesWithEpic: MDStoryWithEpic[] = storyFiles.map((file) => {
  const content = readFileSync(join(storiesDir, file), "utf-8");
  const { frontmatter, description } = getMDStory(content);
  const [epicNumber, storyNumber] = file.split("-").slice(0, 2);

  const storyId = `${epicNumber}-${storyNumber}`;
  const priorityIndex = priorityOrder.indexOf(storyId);

  if (priorityIndex === -1) {
    throw new Error(`Story ${file} not found in priority order`);
  }

  const priority = priorityIndex + 1;

  const title = frontmatter.role
    ? `As a ${frontmatter.role}, I want to ${frontmatter.action}`
    : frontmatter.title;

  if (!title) {
    throw new Error(`Title not set for ${file}`);
  }

  const story: MDStoryWithEpic = {
    title,
    frontmatter,
    description,
    priority,
    epic: {
      labelId: labelsByName.get(frontmatter.label as string) as string,
      issueId: epics[epicNumber].issueId,
    },
  };

  return story;
});

storiesWithEpic.sort((a, b) => a.priority - b.priority);

for (const story of storiesWithEpic) {
  let body = story.frontmatter.role
    ? `As a ${story.frontmatter.role}, I want to ${story.frontmatter.action} so that ${story.frontmatter.benefit}.\n\n`
    : "";
  body += story.description;

  await createIssueAddToProject({
    repositoryId,
    projectInfo,
    owner,
    repo,
    issue: {
      parentIssueId: story.epic.issueId,
      title: story.title,
      body,
    },
    labelId: story.epic.labelId,
  });
}
