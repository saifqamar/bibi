import { ApiRequestError } from "@bibi/api-client";

export function errorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) return error.message;
  if (error instanceof TypeError) return "Cannot reach the server. Check your connection.";
  return "Something went wrong. Please try again.";
}
