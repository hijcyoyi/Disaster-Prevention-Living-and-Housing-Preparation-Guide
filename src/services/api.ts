import type { FamilyProfile, AIAnalysisResult } from '../types';

/**
 * 取得發送 API 請求時所需的標頭設定，若使用者有設定自訂 Key 則會自動帶入
 */
function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  const customKey = localStorage.getItem("custom_gemini_key");
  if (customKey && customKey.trim()) {
    headers["x-api-key"] = customKey.trim();
  }
  
  return headers;
}

/**
 * 評估指定位置與家庭特徵的災害風險
 */
export async function analyzeRisk(
  location: string,
  familyProfile: FamilyProfile,
  environmentDesc: string,
  missingItems: string[]
): Promise<AIAnalysisResult> {
  const res = await fetch("/api/gemini/analyze-risk", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ location, familyProfile, environmentDesc, missingItems })
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `分析失敗 (HTTP ${res.status})`);
  }
  
  return res.json();
}

/**
 * 傳送對話訊息給 AI 防災顧問
 */
export async function sendChatMessage(params: {
  message: string;
  familyProfile: FamilyProfile;
  location: string;
  environmentDesc: string;
  currentRisk: string;
}): Promise<{ reply: string }> {
  const res = await fetch("/api/gemini/chat", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(params)
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.reply || errorData.error || `連線錯誤 (HTTP ${res.status})`);
  }
  
  return res.json();
}

/**
 * 由地址自動分析居住環境
 */
export async function analyzeEnvironment(location: string): Promise<{ environmentDesc: string }> {
  const res = await fetch("/api/gemini/analyze-environment", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ location })
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `環境分析失敗 (HTTP ${res.status})`);
  }
  
  return res.json();
}
