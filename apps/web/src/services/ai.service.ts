export async function streamAiResponse(payload: { prompt: string; model?: string }, onToken: (token: string) => void) {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/ai/chat`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      if (line.startsWith("data:")) {
        onToken(line.replace("data:", "").trim());
      }
    }
  }
}
