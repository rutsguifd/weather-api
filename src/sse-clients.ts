import type { Response } from "express";
export const sseClients: Record<number, Set<Response>> = {};
