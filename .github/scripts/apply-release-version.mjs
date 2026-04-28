import { readFileSync, writeFileSync } from 'node:fs';

const version = process.env.APP_VERSION;
const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

if (!version || !semverPattern.test(version)) {
  throw new Error(
    'APP_VERSION must be a semantic version such as 0.1.1, 1.0.0-beta.1, or 1.0.0+build.1.',
  );
}

function updateJson(path, update) {
  const json = JSON.parse(readFileSync(path, 'utf8'));
  update(json);
  writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`);
}

function replaceText(path, pattern, replacement) {
  const current = readFileSync(path, 'utf8');

  if (!pattern.test(current)) {
    throw new Error(`No version field was found in ${path}.`);
  }

  writeFileSync(path, current.replace(pattern, replacement));
}

updateJson('package.json', (json) => {
  json.version = version;
});

updateJson('package-lock.json', (json) => {
  json.version = version;

  if (json.packages?.['']) {
    json.packages[''].version = version;
  }
});

updateJson('src-tauri/tauri.conf.json', (json) => {
  json.version = version;
});

replaceText('src-tauri/Cargo.toml', /^version = "[^"]+"/m, `version = "${version}"`);

replaceText(
  'src-tauri/Cargo.lock',
  /(\[\[package\]\]\nname = "mathplorer"\nversion = ")[^"]+(")/,
  `$1${version}$2`,
);
