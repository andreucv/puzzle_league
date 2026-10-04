import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { input, confirm } from '@inquirer/prompts';

/**
 * Interactive release ritual (see docs/RELEASE_NOTES_PROCESS.md, Stage 2b + Stage 3).
 *
 * Usage (on `test`, with the test → main PR open):
 *   pnpm release:ritual
 *
 * Steps:
 *   1. Preflight: on `test`, clean tree, up to date with origin/test.
 *   2. `pnpm release:dry` preview, then `pnpm release` (bump + CHANGELOG, commit, no tag).
 *      Skipped when HEAD is already the `chore(release): X.Y.Z` commit for package.json's version.
 *   3. Prompt the "What's New" copy (en / es / ca) and write it as a released entry
 *      into src/lib/translations/<locale>/whats-new.json, then commit it.
 *   4. Push `test`, fast-forward `main` to `test` and push `main` (each step confirmed).
 */

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const LOCALES = ['en', 'es', 'ca'] as const;
type Locale = (typeof LOCALES)[number];

interface WhatsNewEntry {
    version: string;
    status: 'draft' | 'released';
    date: string | null;
    title: string;
    summary: string;
    highlights: string[];
}

interface WhatsNewFile {
    heading: string;
    draftBadge: string;
    dismiss: string;
    releases: WhatsNewEntry[];
}

const sh = (cmd: string) => execSync(cmd, { cwd: ROOT, encoding: 'utf-8' }).trim();
const run = (cmd: string) => {
    console.log(`\n$ ${cmd}`);
    execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
};

const whatsNewPath = (locale: Locale) =>
    path.resolve(ROOT, `src/lib/translations/${locale}/whats-new.json`);
const readWhatsNew = (locale: Locale): WhatsNewFile =>
    JSON.parse(fs.readFileSync(whatsNewPath(locale), 'utf-8'));
const readVersion = (): string =>
    JSON.parse(fs.readFileSync(path.resolve(ROOT, 'package.json'), 'utf-8')).version;

function preflight() {
    const branch = sh('git rev-parse --abbrev-ref HEAD');
    if (branch !== 'test') throw new Error(`Releases are cut on \`test\`, but you are on \`${branch}\`.`);
    if (sh('git status --porcelain')) throw new Error('Working tree is not clean. Commit or stash first.');
    run('git fetch origin test main');
    const behind = sh('git rev-list --count HEAD..origin/test');
    if (behind !== '0') throw new Error(`\`test\` is ${behind} commit(s) behind origin/test. Pull first.`);
}

async function cutRelease() {
    const version = readVersion();
    const alreadyCut = sh('git log -1 --format=%s') === `chore(release): ${version}`;
    if (alreadyCut) {
        const skip = await confirm({
            message: `HEAD is already "chore(release): ${version}". Skip the bump and continue with What's New?`,
            default: true,
        });
        if (skip) return;
    }

    run('pnpm release:dry');
    if (!(await confirm({ message: 'Cut this release (bump + CHANGELOG commit)?', default: true }))) {
        throw new Error('Aborted before cutting the release.');
    }
    run('pnpm release');
}

/** The CHANGELOG.md section for `version`, shown as reference while writing the copy. */
function changelogSection(version: string): string {
    const lines = fs.readFileSync(path.resolve(ROOT, 'CHANGELOG.md'), 'utf-8').split('\n');
    const start = lines.findIndex((l) => l.startsWith(`## [${version}]`));
    if (start === -1) return '(no CHANGELOG section found)';
    const end = lines.findIndex((l, i) => i > start && l.startsWith('## ['));
    return lines.slice(start, end === -1 ? undefined : end).join('\n').trim();
}

const required = (v: string) => v.trim().length > 0 || 'Required';

async function promptCopy(locale: Locale, reference?: WhatsNewEntry, draft?: WhatsNewEntry) {
    console.log(`\n── What's New copy: ${locale.toUpperCase()} ──`);
    if (reference) {
        console.log(`  Reference (en):\n    title:   ${reference.title}\n    summary: ${reference.summary}`);
        reference.highlights.forEach((h) => console.log(`    • ${h}`));
    }
    const title = (await input({ message: 'Title:', default: draft?.title, validate: required })).trim();
    const summary = (await input({ message: 'Summary:', default: draft?.summary, validate: required })).trim();

    const highlights: string[] = [];
    console.log('  Highlights (leave empty to finish):');
    for (let i = 0; ; i++) {
        const h = (await input({ message: `  Highlight ${i + 1}:`, default: draft?.highlights[i] })).trim();
        if (!h) break;
        highlights.push(h);
    }
    return { title, summary, highlights };
}

async function writeWhatsNew() {
    const version = readVersion();
    const files = Object.fromEntries(LOCALES.map((l) => [l, readWhatsNew(l)])) as Record<Locale, WhatsNewFile>;
    if (files.en.releases.some((r) => r.version === version)) {
        console.log(`\nWhat's New already has an entry for ${version}; skipping copy.`);
        return;
    }

    console.log(`\n── CHANGELOG ${version} ──\n${changelogSection(version)}`);

    // If a draft holds real copy written during development, it can be promoted (replaced in place).
    // Otherwise the draft (e.g. the placeholder template) is kept and the release goes right after it.
    const drafts = Object.fromEntries(
        LOCALES.map((l) => [l, files[l].releases.find((r) => r.status === 'draft')])
    ) as Record<Locale, WhatsNewEntry | undefined>;
    let promoteDraft = false;
    if (drafts.en) {
        console.log(`\nCurrent draft (en): "${drafts.en.title}"`);
        promoteDraft = await confirm({
            message: 'Promote the current draft entry (use its copy as defaults and replace it)?',
            default: false,
        });
    }

    const date = new Date().toISOString().slice(0, 10);
    const entries = {} as Record<Locale, WhatsNewEntry>;
    for (const locale of LOCALES) {
        const copy = await promptCopy(locale, locale === 'en' ? undefined : entries.en, promoteDraft ? drafts[locale] : undefined);
        entries[locale] = { version, status: 'released', date, ...copy };
    }

    console.log('\n── Entries to write ──');
    console.log(JSON.stringify(entries, null, 2));
    if (!(await confirm({ message: `Write and commit What's New for ${version}?`, default: true }))) {
        throw new Error('Aborted before writing What\'s New. The release commit is already on `test` (not pushed).');
    }

    for (const locale of LOCALES) {
        const releases = files[locale].releases;
        const draftIndex = releases.findIndex((r) => r.status === 'draft');
        if (promoteDraft && draftIndex !== -1) {
            releases[draftIndex] = entries[locale];
        } else {
            const firstReleased = releases.findIndex((r) => r.status !== 'draft');
            releases.splice(firstReleased === -1 ? releases.length : firstReleased, 0, entries[locale]);
        }
        fs.writeFileSync(whatsNewPath(locale), JSON.stringify(files[locale], null, 2) + '\n');
    }

    run(`git add ${LOCALES.map((l) => `src/lib/translations/${l}/whats-new.json`).join(' ')}`);
    run(`git commit -m "chore: ${version} whats new"`);
}

async function ship() {
    const version = readVersion();
    if (!(await confirm({ message: 'Push `test` (preview build = final QA of the release)?', default: true }))) return;
    run('git push origin test');

    console.log('\nQA the preview build before shipping to production.');
    if (!(await confirm({ message: `Fast-forward \`main\` to \`test\` and push (ships ${version} to production)?`, default: false }))) {
        console.log('\nWhen ready: git checkout main && git merge --ff-only test && git push origin main');
        return;
    }
    run('git checkout main');
    try {
        run('git merge --ff-only test');
        run('git push origin main');
    } finally {
        run('git checkout test');
    }
    console.log(`\n✔ ${version} shipped. CI will tag v${version} and publish the GitHub Release.`);
}

async function main() {
    preflight();
    await cutRelease();
    await writeWhatsNew();
    await ship();
}

main().catch((err) => {
    if (err instanceof Error && err.name === 'ExitPromptError') {
        console.log('\nCancelled.');
    } else {
        console.error(`\n✖ ${err instanceof Error ? err.message : err}`);
    }
    process.exit(1);
});
