import { readFileSync, writeFileSync } from "fs";

let content = readFileSync("src/App.tsx", "utf-8");

// Remove the extraneous handleAnalyzeEnvironment declaration from line 702 to 710 approx
const toRemove = `  const handleAnalyzeEnvironment = () => {
    setIsAnalyzingEnv(true);
    setTimeout(() => {
      setEnvironmentDesc(
        "探測結果：該位址周邊有輕微積水風險，主要聯外道路地勢平坦，但部分街區可能受豪雨影響。建議大雨時注意低窪處。"
      );
      setIsAnalyzingEnv(false);
    }, 1500);
  };`;

content = content.replace(toRemove, "");

// Replace the unmatched </main> with </div>
content = content.replace("</main>", "</div>");

// Remove duplicate Left Sidebar: Controls & Settings if any inside TopPart? No topPart should be clean.
// Wait, the "Emergency guides" code might have mismatched tags too. If it compiles, we are good.

writeFileSync("src/App.tsx", content);
console.log("Cleanup done!");
