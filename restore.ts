import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

try {
  const previousCode = execSync('git show HEAD:src/App.tsx', { encoding: 'utf-8' });
  writeFileSync('src/App.tsx', previousCode);
  console.log("Restored previous App.tsx");
} catch (e) {
  console.error("Failed to restore", e);
}
