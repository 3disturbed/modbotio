import express from 'express';
import fs from 'fs';
import bodyParser from 'body-parser';
import validateJSON from './utils/validateJSON.js';
import cors from 'cors';
import dotenv from 'dotenv';
import AI from './AI.js';

const app = express();
const PORT = 3421;

// Load environment variables
dotenv.config();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Load prompt template
const promptTemplate = fs.readFileSync("prompt.txt", "utf-8");

// Helper function to extract JSON from LLM responses
function extractJSON(response) {
    const jsonStart = response.indexOf("{");
    const jsonEnd = response.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("No valid JSON found in response.");
    }
    const jsonString = response.substring(jsonStart, jsonEnd + 1);
    return JSON.parse(jsonString);
}

// Initialize AI instance with config from .env
const ai = new AI({
    endpoint: process.env.AI_ENDPOINT,
    apiKey: process.env.AI_API_KEY,
    model: process.env.AI_MODEL,
});

// Endpoint
app.post("/submit-text", async (req, res) => {
    console.log("Received request:", req.body);
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: "Text input is required." });
    }

    // Create the LLM prompt
    const prompt = promptTemplate.replace("{user_input}", text);

    try {
        // Send prompt using AI class
        const llmResponse = await ai.sendPrompt(prompt);

        // Extract JSON from the response
        const responseData = llmResponse.response;
        const extractedJSON = extractJSON(responseData);
        extractedJSON.text = text;
        // Validate JSON structure
        if (!validateJSON(extractedJSON)) {
            return res.status(400).json({
                error: "Returned JSON does not match the expected structure.",
                response: extractedJSON,
            });
        }

        // Return JSON response
        res.json(extractedJSON);

    } catch (error) {
        console.error(error.message || error.response?.data);
        res.status(500).json({
            error: "An error occurred while processing the request.",
            details: error.message || error.response?.data,
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
