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










export default app;