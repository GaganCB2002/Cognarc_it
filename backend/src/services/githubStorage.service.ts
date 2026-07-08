import { Octokit } from "@octokit/rest";

interface GitHubStorageConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  documentsPath: string;
}

const config: GitHubStorageConfig = {
  token: process.env.GITHUB_STORAGE_TOKEN || "",
  owner: process.env.GITHUB_STORAGE_OWNER || "",
  repo: process.env.GITHUB_STORAGE_REPO || "",
  branch: process.env.GITHUB_STORAGE_BRANCH || "main",
  documentsPath: process.env.GITHUB_STORAGE_PATH || "documents",
};

function getOctokit(): Octokit {
  if (!config.token) {
    throw new Error("GITHUB_STORAGE_TOKEN is not configured. Set it in your .env file.");
  }
  if (!config.owner || !config.repo) {
    throw new Error("GITHUB_STORAGE_OWNER and GITHUB_STORAGE_REPO must be configured.");
  }
  return new Octokit({ auth: config.token });
}

function getGitHubPath(storageKey: string): string {
  return `${config.documentsPath}/${storageKey}`;
}

async function ensureDocumentsFolder(): Promise<void> {
  const octokit = getOctokit();
  try {
    await octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: config.documentsPath,
      ref: config.branch,
    });
  } catch (err: any) {
    if (err.status === 404) {
      try {
        const { data: refData } = await octokit.git.getRef({
          owner: config.owner,
          repo: config.repo,
          ref: `heads/${config.branch}`,
        });

        const { data: baseTree } = await octokit.git.getTree({
          owner: config.owner,
          repo: config.repo,
          tree_sha: refData.object.sha,
        });

        const { data: blob } = await octokit.git.createBlob({
          owner: config.owner,
          repo: config.repo,
          content: Buffer.from("").toString("base64"),
          encoding: "base64",
        });

        const { data: tree } = await octokit.git.createTree({
          owner: config.owner,
          repo: config.repo,
          base_tree: refData.object.sha,
          tree: [
            {
              path: `${config.documentsPath}/.gitkeep`,
              mode: "100644",
              type: "blob",
              sha: blob.sha,
            },
          ],
        });

        const { data: commit } = await octokit.git.createCommit({
          owner: config.owner,
          repo: config.repo,
          message: "chore: initialize documents storage folder",
          tree: tree.sha,
          parents: [refData.object.sha],
        });

        await octokit.git.updateRef({
          owner: config.owner,
          repo: config.repo,
          ref: `heads/${config.branch}`,
          sha: commit.sha,
        });
      } catch (createErr) {
        console.error("Failed to create documents folder:", createErr);
      }
    } else {
      throw err;
    }
  }
}

export async function saveFile(storageKey: string, buffer: Buffer): Promise<string> {
  const octokit = getOctokit();
  const gitHubPath = getGitHubPath(storageKey);

  await ensureDocumentsFolder();

  const content = buffer.toString("base64");

  try {
    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner: config.owner,
      repo: config.repo,
      path: gitHubPath,
      message: `feat: upload file ${storageKey.split("/").pop()}`,
      content,
      branch: config.branch,
    });

    const rawUrl = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${gitHubPath}`;
    return rawUrl;
  } catch (err: any) {
    console.error("GitHub storage save error:", err);
    throw new Error(`Failed to save file to GitHub: ${err.message}`);
  }
}

export async function getFile(storageKey: string): Promise<Buffer | null> {
  const octokit = getOctokit();
  const gitHubPath = getGitHubPath(storageKey);

  try {
    const { data } = await octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: gitHubPath,
      ref: config.branch,
    });

    if ("content" in data && data.content) {
      const decoded = Buffer.from(data.content, "base64");
      return decoded;
    }
    return null;
  } catch (err: any) {
    if (err.status === 404) return null;
    console.error("GitHub storage get error:", err);
    return null;
  }
}

export async function deleteFile(storageKey: string): Promise<void> {
  const octokit = getOctokit();
  const gitHubPath = getGitHubPath(storageKey);

  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: gitHubPath,
      ref: config.branch,
    });

    if ("sha" in fileData && fileData.sha) {
      await octokit.repos.deleteFile({
        owner: config.owner,
        repo: config.repo,
        path: gitHubPath,
        message: `feat: delete file ${storageKey.split("/").pop()}`,
        sha: fileData.sha,
        branch: config.branch,
      });
    }
  } catch (err: any) {
    if (err.status !== 404) {
      console.error("GitHub storage delete error:", err);
    }
  }
}

export async function fileExists(storageKey: string): Promise<boolean> {
  const octokit = getOctokit();
  const gitHubPath = getGitHubPath(storageKey);

  try {
    await octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: gitHubPath,
      ref: config.branch,
    });
    return true;
  } catch {
    return false;
  }
}

export function getPublicUrl(storageKey: string): string {
  const gitHubPath = getGitHubPath(storageKey);
  return `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${gitHubPath}`;
}

export function getDocumentsPath(): string {
  return config.documentsPath;
}
