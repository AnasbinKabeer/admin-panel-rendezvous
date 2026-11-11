import type {
    LiveStage,
    StageFormData,
    StageStatus,
} from "../app/types/live";

const BASE_URL = "/api/admin/live";

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
        cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        if (response.status === 401 || response.status === 403) {
            window.location.href = "/login";
        }

        throw new Error(
            result.message || "Something went wrong"
        );
    }

    return result;
}

export const liveApi = {
    getStages: async (): Promise<LiveStage[]> => {
        const result = await request<{ data: LiveStage[] }>(
            "/stages"
        );

        return result.data;
    },

    createStage: async (data: StageFormData) => {
        return request("/stages", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    updateStage: async (
        id: number,
        data: StageFormData
    ) => {
        return request(`/stages/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },

    updateStatus: async (
        id: number,
        status: StageStatus
    ) => {
        return request(`/stages/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
        });
    },

    reorderStages: async (stages: LiveStage[]) => {
        return request("/stages/reorder", {
            method: "PATCH",
            body: JSON.stringify({
                stages: stages.map((stage, index) => ({
                    id: stage.id,
                    sortOrder: index + 1,
                })),
            }),
        });
    },

    deleteStage: async (id: number) => {
        return request(`/stages/${id}`, {
            method: "DELETE",
        });
    },
};