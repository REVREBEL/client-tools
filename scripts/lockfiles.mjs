import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const appsRoot = path.join(root, "apps");
const mode = process.argv[2];

if (!["sync", "check"].includes(mode)) {
  console.error("Usage: node scripts/lockfiles.mjs <sync|check>");
  process.exit(2);
}

function run(command, args, cwd = root) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  execFileSync(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
  });
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function discoverNpmApps() {
  return readdirSync(appsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = path.join(appsRoot, entry.name);
      const manifestPath = path.join(dir, "package.json");
      if (!existsSync(manifestPath)) return null;

      const manifest = readJson(manifestPath);
      if (!String(manifest.packageManager ?? "").startsWith("npm@")) return null;

      return {
        dir,
        relativeDir: path.relative(root, dir),
        manifest,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.relativeDir.localeCompare(b.relativeDir));
}

function dependencySpecs(manifest) {
  return {
    ...(manifest.dependencies ?? {}),
    ...(manifest.devDependencies ?? {}),
    ...(manifest.optionalDependencies ?? {}),
  };
}

function validateManifestAgainstNpmLock(app) {
  const lockPath = path.join(app.dir, "package-lock.json");
  if (!existsSync(lockPath)) {
    throw new Error(
      `${app.relativeDir}: package-lock.json is missing. Run "pnpm locks:sync".`,
    );
  }

  const lock = readJson(lockPath);
  const lockRoot = lock.packages?.[""];
  if (!lockRoot) {
    throw new Error(`${app.relativeDir}: package-lock.json has no root package metadata.`);
  }

  for (const section of ["dependencies", "devDependencies", "optionalDependencies"]) {
    const manifestSection = app.manifest[section] ?? {};
    const lockSection = lockRoot[section] ?? {};

    const manifestKeys = Object.keys(manifestSection).sort();
    const lockKeys = Object.keys(lockSection).sort();

    if (JSON.stringify(manifestKeys) !== JSON.stringify(lockKeys)) {
      throw new Error(
        `${app.relativeDir}: ${section} keys differ between package.json and package-lock.json.`,
      );
    }

    for (const name of manifestKeys) {
      if (manifestSection[name] !== lockSection[name]) {
        throw new Error(
          `${app.relativeDir}: ${name} spec differs: package.json=${manifestSection[name]} package-lock.json=${lockSection[name]}`,
        );
      }
    }
  }
}

function pnpmDirectVersions(app) {
  const output = execFileSync(
    "pnpm",
    ["--filter", app.manifest.name, "list", "--json", "--depth", "0"],
    { cwd: root, encoding: "utf8", env: process.env },
  );
  const rows = JSON.parse(output);
  const row = rows[0] ?? {};
  return {
    ...(row.dependencies ?? {}),
    ...(row.devDependencies ?? {}),
    ...(row.optionalDependencies ?? {}),
  };
}

function validateDirectResolvedVersions(app) {
  const lock = readJson(path.join(app.dir, "package-lock.json"));
  const pnpmVersions = pnpmDirectVersions(app);

  for (const name of Object.keys(dependencySpecs(app.manifest)).sort()) {
    const pnpmEntry = pnpmVersions[name];
    const npmEntry = lock.packages?.[`node_modules/${name}`];

    if (!pnpmEntry?.version || !npmEntry?.version) {
      throw new Error(
        `${app.relativeDir}: cannot compare resolved version for ${name} between pnpm and npm.`,
      );
    }

    if (pnpmEntry.version !== npmEntry.version) {
      throw new Error(
        `${app.relativeDir}: ${name} resolves differently: pnpm=${pnpmEntry.version} npm=${npmEntry.version}. Run "pnpm deps:sync".`,
      );
    }
  }
}

const apps = discoverNpmApps();

if (apps.length === 0) {
  throw new Error("No npm-managed apps found under apps/.");
}

console.log(`npm-managed app boundaries: ${apps.map((app) => app.relativeDir).join(", ")}`);

if (mode === "sync") {
  // pnpm is the canonical resolver for the monorepo. Refresh its lock first,
  // then materialize that exact direct-dependency resolution into each npm
  // package boundary that Webflow installs independently.
  run("pnpm", ["install", "--lockfile-only"]);
  run("pnpm", ["install", "--frozen-lockfile", "--ignore-scripts"]);

  for (const app of apps) {
    console.log(`\nRefreshing ${app.relativeDir}/package-lock.json from pnpm resolutions`);

    const pnpmVersions = pnpmDirectVersions(app);
    const exactDirectSpecs = Object.keys(dependencySpecs(app.manifest))
      .sort()
      .map((name) => {
        const resolved = pnpmVersions[name]?.version;
        if (!resolved) {
          throw new Error(
            `${app.relativeDir}: pnpm did not report a resolved version for ${name}.`,
          );
        }
        return `${name}@${resolved}`;
      });

    const manifestPath = path.join(app.dir, "package.json");
    const npmLockPath = path.join(app.dir, "package-lock.json");
    const originalManifestText = readFileSync(manifestPath, "utf8");
    const exactManifest = structuredClone(app.manifest);

    for (const section of ["dependencies", "devDependencies", "optionalDependencies"]) {
      if (!exactManifest[section]) continue;
      for (const name of Object.keys(exactManifest[section])) {
        const resolved = pnpmVersions[name]?.version;
        if (!resolved) {
          throw new Error(
            `${app.relativeDir}: pnpm did not report a resolved version for ${name}.`,
          );
        }
        exactManifest[section][name] = resolved;
      }
    }

    rmSync(npmLockPath, { force: true });

    try {
      writeFileSync(manifestPath, `${JSON.stringify(exactManifest, null, 2)}\n`);

      run(
        "npm",
        [
          "install",
          "--package-lock-only",
          "--ignore-scripts",
          "--no-audit",
          "--no-fund",
        ],
        app.dir,
      );
    } finally {
      writeFileSync(manifestPath, originalManifestText);
    }

    const npmLock = readJson(npmLockPath);
    const npmLockRoot = npmLock.packages?.[""];
    if (!npmLockRoot) {
      throw new Error(`${app.relativeDir}: regenerated npm lock has no root metadata.`);
    }

    for (const section of ["dependencies", "devDependencies", "optionalDependencies"]) {
      if (app.manifest[section]) {
        npmLockRoot[section] = app.manifest[section];
      } else {
        delete npmLockRoot[section];
      }
    }

    writeFileSync(npmLockPath, `${JSON.stringify(npmLock, null, 2)}\n`);

    validateManifestAgainstNpmLock(app);
    validateDirectResolvedVersions(app);
  }

  console.log("\n✓ npm lockfiles regenerated from pnpm's direct dependency resolutions.");
  process.exit(0);
}

run("pnpm", ["install", "--frozen-lockfile", "--ignore-scripts"]);

for (const app of apps) {
  console.log(`\nValidating ${app.relativeDir}`);
  validateManifestAgainstNpmLock(app);

  run(
    "npm",
    [
      "ci",
      "--dry-run",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
    ],
    app.dir,
  );

  validateDirectResolvedVersions(app);
}

console.log("\n✓ pnpm workspace lock, npm app locks, and direct dependency versions are aligned.");
