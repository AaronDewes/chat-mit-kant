export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    const body = await readBody(event);
    if (typeof body !== "string") {
        throw new Error("Invalid body");
    }
    const resp = await fetch("https://api.withdelphi.com/api/clone/generate_response", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Api-Key": useRuntimeConfig().apiKey,
        },
        body: JSON.stringify({
            "conversation_id": id,
            "user_message": `Bitte beantworte die folgende Frage auf Deutsch, benutze kein Englisch. Gehe in deiner Antwort nicht auf den Text vor den --- ein, sondern beantworte bitte nur die Frage. --- ${body}`
        })
    });
    return await resp.json() as {
        clone_response: {
            "conversation_id": string;
            "created_at": string;
            "text": string;
        }
    }
})
