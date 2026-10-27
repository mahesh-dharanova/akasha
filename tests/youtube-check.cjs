const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const outputDirectory = mkdtempSync(join(tmpdir(), 'akasha-youtube-'));
execFileSync('tsc', [
  '--target', 'es2022', '--module', 'commonjs', '--lib', 'ES2022,DOM', '--skipLibCheck', '--noEmit', 'false',
  '--outDir', outputDirectory, 'src/youtube.ts',
], { stdio: 'inherit' });

const { extractYouTubeVideoId } = require(join(outputDirectory, 'youtube.js'));
const videoId = 'dQw4w9WgXcQ';
assert.equal(extractYouTubeVideoId(`https://www.youtube.com/watch?v=${videoId}&list=abc`), videoId);
assert.equal(extractYouTubeVideoId(`https://youtu.be/${videoId}?si=example`), videoId);
assert.equal(extractYouTubeVideoId(`https://www.youtube.com/shorts/${videoId}`), videoId);
assert.equal(extractYouTubeVideoId(`https://youtube.com/embed/${videoId}`), videoId);
assert.equal(extractYouTubeVideoId('https://example.com/watch?v=dQw4w9WgXcQ'), null);
assert.equal(extractYouTubeVideoId('not a URL'), null);

console.log('YouTube checks passed: supported URL formats and invalid-link rejection.');
