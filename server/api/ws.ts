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
          user_message: `Bitte schreibe deine Antwort auf Deutsch, benutze auf keinen Fall Englisch. Als ursprünglich deutschsprachiger Philosoph verstehst du Deutsch. Gehe in deiner Antwort nicht auf den Text vor den drei Strichen ein. Die Frage/Antwort des Nutzers findest du nach den drei Strichen. --- ${body}`,
          stream: true,
        }),
      }
    );
    // Continously stream the response to the client
    const reader = resp.body!.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      // Split the response into chunks, each chunk starts with data:
      // There can be multiple chunks in a single response
      const text = new TextDecoder("iso-8859-2").decode(value);
      const chunks = text.split("data:");
      // Send each chunk without the data: prefix
      for (const chunk of chunks) {
        if (chunk) {
          // If chunk starts with ping - ignore it
          if (chunk.startsWith("ping -")) {
            continue;
          }
          // Parse the chunk as JSON
          try {
            const parsed = JSON.parse(chunk);
            peer.send(parsed.current_token);
          } catch (e) {
            console.log("Failed to parse chunk as JSON", chunk);
            console.error(e);
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
