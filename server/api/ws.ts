import { MSG_PREFIX } from "~/utils/consts";

export default defineWebSocketHandler({
  open(peer) {
    console.log("[ws] open", peer);
  },

  async message(peer, message) {
    console.log("[ws] message", peer, message);
    const { id, body } = JSON.parse(message.text());
    if (typeof body !== "string" || typeof id !== "string") {
      throw new Error("Invalid body");
    }
    const resp = await fetch(
      "https://api.withdelphi.com/api/clone/generate_response",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": useRuntimeConfig().apiKey,
        },
        body: JSON.stringify({
          conversation_id: id,
          user_message: `${MSG_PREFIX}${body}`,
          stream: true,
        }),
      }
    );
    // Continously stream the response to the client
    const reader = resp.body!.getReader();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      // Split the response into chunks, each chunk starts with data:
      // There can be multiple chunks in a single response
      const text = new TextDecoder("iso-8859-2").decode(value);
      buffer += text;
      // Split the buffer into chunks by the data: prefix, only keep the last one in there as it might be incomplete
      const chunks = buffer.split("data:");
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (chunk) {
          // If chunk starts with ping - ignore it
          if (chunk.startsWith("ping -") || chunk.startsWith(": ping -")  || chunk.startsWith(" : ping -")) {
            continue;
          }
          // Parse the chunk as JSON
          try {
            const parsed = JSON.parse(chunk);
            peer.send(parsed.current_token);
            if (i === chunks.length - 1) {
              buffer = "";
            }
          } catch (e) {
            console.log("Failed to parse chunk as JSON", chunk);
            console.error(e);
            if (i === chunks.length - 1) {
              buffer = chunk;
            }
          }
        }
      }
    }
  },

  close(peer, event) {
    console.log("[ws] close", peer, event);
  },

  error(peer, error) {
    console.log("[ws] error", peer, error);
  },
});
