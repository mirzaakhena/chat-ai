/**
 * Parses tool result from various formats into a consistent Record<string, any>
 * Handles:
 * - undefined/null results
 * - String results (with JSON parsing attempt)
 * - Object results (with nested output extraction)
 * - Primitive types (number, boolean, etc)
 */
export function parseToolResult(result: unknown): Record<string, any> {
  // Handle undefined/null
  if (result === undefined || result === null) {
    return { result: "No data returned" };
  }

  // Handle string (try parsing as JSON)
  if (typeof result === "string") {
    try {
      return JSON.parse(result);
    } catch {
      // If not JSON, wrap in object
      return { result };
    }
  }

  // Handle object
  if (typeof result === "object") {
    // CRITICAL: AI SDK wraps tool results in nested structure
    // Extract the actual output from result.output
    const resultObj = result as Record<string, any>;

    if (resultObj.output) {
      return resultObj.output;
    }

    if (resultObj.result) {
      // Fallback: some tools might have result.result
      return resultObj.result;
    }

    // Use the entire result object
    return resultObj;
  }

  // Handle other primitive types (number, boolean, etc)
  return { result };
}

/**
 * Parses tool error into a consistent error object
 */
export function parseToolError(
  error: unknown,
  toolCallId?: string
): Record<string, any> {
  const errorObj = (error || {}) as Record<string, any>;
  const hasContent = Object.keys(errorObj).length > 0;

  if (hasContent) {
    return errorObj;
  }

  return {
    error: "Tool execution failed",
    message: "The tool encountered an error during execution. Check server logs for details.",
    ...(toolCallId && { toolCallId }),
  };
}
