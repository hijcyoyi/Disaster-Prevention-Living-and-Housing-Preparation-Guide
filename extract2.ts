import { readFileSync, writeFileSync } from "fs";

const content = readFileSync("src/App.tsx", "utf-8");
const lines = content.split('\n');

const app1Start = 66;
const app2Start = 840;

const logStructure = (startIdx) => {
  let depth = 0;
  let returnLine = -1;
  let endLine = -1;
  
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('{')) depth += (line.match(/\{/g) || []).length;
    if (line.includes('}')) depth -= (line.match(/\}/g) || []).length;
    
    if (line.includes('return (') && depth === 1 && returnLine === -1) {
      returnLine = i;
    }
    
    if (depth === 0 && i > startIdx) {
      endLine = i;
      break;
    }
  }
  return { returnLine, endLine };
};

console.log("App 1:", logStructure(app1Start));
console.log("App 2:", logStructure(app2Start));
