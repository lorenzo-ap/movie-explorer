import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const target = fileURLToPath(new URL('../src/environments/environment.ts', import.meta.url));
const token = process.env.TMDB_TOKEN;

if (token) {
  const content = `export const environment = {
  tmdbApiUrl: 'https://api.themoviedb.org/3',
  tmdbImageUrl: 'https://image.tmdb.org/t/p',
  tmdbToken: ${JSON.stringify(token)},
};
`;
  writeFileSync(target, content);
  console.log('environment.ts generated');
} else if (existsSync(target)) {
  console.log('TMDB_TOKEN is not set, keeping existing environment.ts');
} else {
  console.error('TMDB_TOKEN is not set and src/environments/environment.ts does not exist');
  process.exit(1);
}
