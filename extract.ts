import { readFileSync, writeFileSync } from "fs";

const content = readFileSync("src/App.tsx", "utf-8");
const lines = content.split('\n');

const firstApp = lines.slice(0, 840);
console.log("Last 20 lines of firstApp:");
console.log(firstApp.slice(-20).join('\n'));

