import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const ROOT = 'src/lib/apps';
const EXCLUDE = ':(exclude,glob)**/CHANGELOG.md';
const FIELD = '\x1f';
const RECORD = '\x1e';

function commitsFor(paths) {
	const output = execFileSync(
		'git',
		[
			'log',
			'--reverse',
			'--date=short',
			`--format=%h${FIELD}%ad${FIELD}%s${FIELD}%b${RECORD}`,
			'--',
			...paths,
			EXCLUDE
		],
		{ encoding: 'utf8' }
	);
	return output
		.split(RECORD)
		.map((entry) => entry.trim())
		.filter(Boolean)
		.map((entry) => {
			const [hash, date, subject, body = ''] = entry.split(FIELD);
			return { hash, date, subject, body };
		});
}

function bodyLines(body) {
	const lines = [];
	for (const line of body.split('\n')) {
		if (/^co-authored-by:/i.test(line.trim())) continue;
		const last = lines[lines.length - 1];
		if (!line.trim()) {
			if (lines.length && last !== '') lines.push('');
		} else if (/^\s/.test(line) && lines.length && last !== '')
			lines[lines.length - 1] += ` ${line.trim()}`;
		else lines.push(line.trim());
	}
	while (lines[lines.length - 1] === '') lines.pop();
	return lines;
}

function entryText(version, commit) {
	const lines = bodyLines(commit.body);
	return [
		`## ${version} · ${commit.date} · ${commit.hash}`,
		'',
		commit.subject,
		...(lines.length ? ['', ...lines] : [])
	].join('\n');
}

let added = 0;
for (const folder of readdirSync(ROOT, { withFileTypes: true })) {
	const dir = `${ROOT}/${folder.name}`;
	if (!folder.isDirectory() || !existsSync(`${dir}/version.json`)) continue;
	const info = JSON.parse(readFileSync(`${dir}/version.json`, 'utf8'));
	const file = `${dir}/CHANGELOG.md`;
	const heading = `# ${info.name} change log`;
	const existing = existsSync(file) ? readFileSync(file, 'utf8') : `${heading}\n`;
	const known = new Set(
		[...existing.matchAll(/^## .* · ([0-9a-f]{7,})$/gm)].map((match) => match[1])
	);
	const fresh = commitsFor(info.paths)
		.map((commit, index) => ({ commit, version: `v${info.version}.${index + 1}` }))
		.filter(({ commit }) => !known.has(commit.hash))
		.reverse();
	if (!fresh.length) continue;
	const rest = existing.startsWith(heading) ? existing.slice(heading.length).trimStart() : existing;
	const entries = fresh.map(({ commit, version }) => entryText(version, commit)).join('\n\n');
	writeFileSync(file, `${heading}\n\n${entries}\n${rest ? `\n${rest}` : ''}`);
	added += fresh.length;
	console.log(`${info.name}: ${fresh.length} new entr${fresh.length === 1 ? 'y' : 'ies'}`);
}
if (!added) console.log('Change logs are up to date');
