/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { env } from "./env";

export interface BackendHealthStatus {
  connected: boolean;
  status?: string;
  environment?: string;
  responseTime?: number;
  error?: string;
}

/**
 * Vérifie la connexion au backend HCS-U7
 */
export async function checkBackendHealth(): Promise<BackendHealthStatus> {
  const backendUrl = env.HCS_U7_BACKEND_URL;

  if (!backendUrl) {
    return {
      connected: false,
      error: "HCS_U7_BACKEND_URL is not configured",
    };
  }

  const startTime = Date.now();

  try {
    const response = await fetch(`${backendUrl}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Timeout de 5 secondes
      signal: AbortSignal.timeout(5000),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        connected: false,
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    return {
      connected: true,
      status: data.status || "ok",
      environment: data.env || "unknown",
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return {
      connected: false,
      responseTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
