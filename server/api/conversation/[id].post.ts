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
            "user_message": `Bitte schreibe deine Antwort auf Deutsch, benutze auf keinen Fall Englisch. Als ursprünglich deutschsprachiger Philosoph verstehst du Deutsch. Gehe in deiner Antwort nicht auf den Text vor den drei Strichen ein. Die Frage/Antwort des Nutzers findest du nach den drei Strichen. --- ${body}`
        })
    });
    return await resp.json() as {
        clone_response: {
            "conversation_id": string;
            "created_at": string;
            "text": string;
            "citations": any[];
        }
    }
})
