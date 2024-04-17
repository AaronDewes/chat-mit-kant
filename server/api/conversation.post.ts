export default defineEventHandler(async (event) => {
    const resp = await fetch("https://api.withdelphi.com/api/conversation/new", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Api-Key": useRuntimeConfig().apiKey,
        },
        body: JSON.stringify({
            "slug": "immanuel-kant"
        })
    });
    setResponseStatus(event, 201);
    return await resp.json() as {
        new: {
            "conversation_id": string;
            "created_at": string;
            "messages": Message[];
        },
        "conversation_type": "anonymous" | "personalized";
    }
})
