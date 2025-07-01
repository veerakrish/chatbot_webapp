require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const http = require('http');
const url = require('url');

// Access your API key from .env file
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash"});

// Create HTTP server
const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Handle POST request for AI response
    if (req.method === 'POST' && req.url === '/ask') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const { prompt } = JSON.parse(body);
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ response: text }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
    // Serve HTML for root path
    else if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>AI Chat Interface</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                    #chat-container { margin-top: 20px; }
                    #response { margin-top: 20px; white-space: pre-wrap; }
                    textarea { width: 100%; height: 100px; margin-bottom: 10px; }
                    button { padding: 10px 20px; }
                </style>
            </head>
            <body>
                <h1>AI Chat Interface</h1>
                <div id="chat-container">
                    <textarea id="prompt" placeholder="Enter your question here..."></textarea>
                    <br>
                    <button onclick="askAI()">Ask AI</button>
                    <div id="response"></div>
                </div>
                <script>
                async function askAI() {
                    const promptText = document.getElementById('prompt').value;
                    const responseDiv = document.getElementById('response');
                    responseDiv.textContent = 'Thinking...';

                    try {
                        const response = await fetch('/ask', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ prompt: promptText })
                        });
                        const data = await response.json();
                        responseDiv.textContent = data.response;
                    } catch (error) {
                        responseDiv.textContent = 'Error: ' + error.message;
                    }
                }
                </script>
            </body>
            </html>
        `);
    }
    else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
