export interface FamilyProfile {
  hasToddler: boolean;
  hasElderly: boolean;
  hasChronicIllness: boolean;
  hasMobilityIssues: boolean;
}

export interface DisasterFactor {
  name: string;
  riskLevel: string;
}

export interface DisasterRisk {
  level: "Low" | "Medium" | "High";
  summary: string;
  factors: DisasterFactor[];
}

export interface SuspensionIndicator {
  level: "低" | "中" | "高";
  reasons: string[];
}

export interface ActionableTimeline {
  immediate: string[];
  next24h: string[];
}

export interface AIAnalysisResult {
  disasterRisk: DisasterRisk;
  suspensionIndicator: SuspensionIndicator;
  familyCare: string[];
  bagRecommendations: string[];
  actionableTimeline: ActionableTimeline;
  shelterGuidance?: ShelterGuidance;
}

export interface ShelterGuidance {
  nearestOptions: string[];
  safetyCriteria: string[];
}


export interface SupplyItem {
  id: string;
  category: string;
  name: string;
  hasIt: boolean;
}
