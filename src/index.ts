import { Hono } from "hono";
import { cors } from "hono/cors";

import OpenAI from "openai";

type Bindings = {
	OPEN_AI_API: string,
	AI: Ai
}
const app = new Hono<{ Bindings: Bindings }>()

app.use('*', (c, next) => {
	const corsMiddleware = cors({
		origin: "*",
		allowHeaders: ['Content-Type', 'Authorization'],
		allowMethods: ['POST', 'GET', 'OPTIONS'],
		exposeHeaders: ['Content-Length'],
		maxAge: 600,
		credentials: true,
	})
	return corsMiddleware(c, next)
})


app.post("/translatedoc", async (c) => {
	const { documentData, targetLang } = await c.req.json();

	const summaryRes = await c.env.AI.run("@cf/facebook/bart-large-cnn", {
		input_text: documentData,
		max_length: 1000
	})

	const response = await c.env.AI.run(
		"@cf/meta/m2m100-1.2b",
		{
			text: summaryRes.summary,
			source_lang: "english",
			target_lang: targetLang,
		}
	);

	return new Response(JSON.stringify(response));



})


app.post("/chatwithdoc", async (c) => {
	try {
		const openai = new OpenAI({
			apiKey: c.env.OPEN_AI_API,
		});

		const { documentData, question } = await c.req.json();

		const chatCompletion = await openai.chat.completions.create({
			messages: [
				{
					role: "system",
					content:
						"You are an assistant helping the user chat with a document. The document content is:\n\n" +
						documentData
				},
				{
					role: "user",
					content: "My Question is: " + question,
				},
			],
			model: "gpt-4o-mini",
			store: true,
			temperature: 0.5,
		});

		const response = chatCompletion.choices[0].message.content;

		return c.json({ message: response });
	} catch (error: any) {
		console.error("ChatWithDoc error:", error);
		return c.json({ error: "Internal Server Error", detail: error.message }, 500);
	}
});







export default app;