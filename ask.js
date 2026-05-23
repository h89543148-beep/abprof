exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ reply: "Test working" })
  };
};
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { prompt } = JSON.parse(event.body);
    if (!prompt) {
      return { statusCode: 400, body: "Missing prompt" };
    }

    const OPENCODE_API_KEY = process.env.OPENCODE_API_KEY;
    if (!OPENCODE_API_KEY) {
      return { statusCode: 500, body: "API key missing" };
    }

    const response = await fetch("https://api.opencode.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENCODE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "No reply";

    return {
      statusCode: 200,
      body: JSON.stringify({ reply })
    };
  } catch (err) {
    return { statusCode: 500, body: "Server error" };
  }
};