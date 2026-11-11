export type StageStatus = "LIVE" | "UPCOMING" | "OFFLINE";

export interface LiveStage {
    id: number;
    name: string;
    location: string;
    videoId: string | null;
    status: StageStatus;
    startTime: string | null;
    sortOrder: number;
    isEnabled: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface StageFormData {
    name: string;
    location: string;
    videoId: string;
    status: StageStatus;
    startTime: string;
    sortOrder: number;
    isEnabled: boolean;
}