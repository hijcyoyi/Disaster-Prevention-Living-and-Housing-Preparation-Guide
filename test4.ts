import { GoogleGenAI, Type } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const res = await ai.models.generateContent({ 
      model: "gemini-2.5-flash", 
      contents: "請搜尋目前（2026年6月）台灣地區的天氣與颱風警報，並且務必直接回傳一個合法的 JSON，格式為 { \"summary\": \"天氣總結\" }，不要包含其他文字。", 
      config: { 
        tools: [{googleSearch:{}}]
      } 
    });
    console.log("Success:", res.text);
  } catch(e) { console.log("Failed:", e.message) }
}
test();
