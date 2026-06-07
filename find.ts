import { readFileSync } from "fs";

const content = readFileSync("src/App.tsx", "utf-8");
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export default function App()')) {
    console.log(`Line ${i+1}: App component starts`);
  }
  if (lines[i].includes('handleAnalyzeEnvironment')) {
    console.log(`Line ${i+1}: handleAnalyzeEnvironment`);
  }
}
