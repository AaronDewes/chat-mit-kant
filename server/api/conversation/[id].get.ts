export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    const resp = await fetch(`https://api.withdelphi.com/api/conversation/history?id=${id}`, {
        headers: {
            "Content-Type": "application/json",
            "X-Api-Key": useRuntimeConfig().apiKey,
        }
    });
    setResponseStatus(event, 200);
    return await resp.json() as {
        history: Message[];
    };
})
