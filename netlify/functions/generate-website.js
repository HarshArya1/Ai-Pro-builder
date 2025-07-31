import { GoogleGenerativeAI } from '@google/generative-ai';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const ai = new GoogleGenerativeAI(GOOGLE_API_KEY);

const ENHANCED_INSTRUCTIONS = `
You are an expert AI agent specializing in automated frontend web development. 
Generate only the essential HTML, CSS, and JavaScript needed for the requested website.

Respond with JSON in this exact format:
{
  "html": "<!DOCTYPE html>...",
  "css": "body { ... }",
  "js": "function() { ... }"
}

Key requirements:
1. HTML must include: <!DOCTYPE html>, <html>, <head> with viewport and charset, and <body>
2. CSS must be complete and responsive
3. JavaScript must be functional and concise
4. Use vanilla JS only - no React or frameworks
5. Ensure all code is properly escaped for JSON
6. Keep CSS under 2000 characters
7. Keep JavaScript under 1000 characters
8. Include responsive design (mobile first)
9. Add basic accessibility features (alt text, ARIA roles)
10. Ensure no console errors in generated code
`;

export const handler = async (event) => {
    // Validate request method
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch (e) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid JSON format' })
        };
    }

    const userPrompt = body.prompt;
    
    if (!userPrompt) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Prompt is required' })
        };
    }

    try {
        const model = ai.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: ENHANCED_INSTRUCTIONS,
        });

        // Optimized prompt with strict JSON requirement
        const optimizedPrompt = `
            USER REQUEST: ${userPrompt}
            
            Generate a complete website with:
            - HTML (full document structure)
            - CSS (complete stylesheet)
            - JavaScript (vanilla JS only)
            
            Respond ONLY with valid JSON in this exact format:
            {
                "html": "...",
                "css": "...",
                "js": "..."
            }
            
            Important: 
            - Escape all special characters for JSON
            - Ensure HTML includes doctype and full structure
            - Keep CSS under 2000 characters
            - Keep JavaScript under 1000 characters
            - Use only vanilla JavaScript
            - Include responsive design
            - Add basic accessibility features
        `;

        // Add timeout to the AI request
        const generateWithTimeout = async () => {
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('AI generation timed out (25s)'));
                }, 25000); // 25 second timeout

                model.generateContent(optimizedPrompt)
                    .then(result => {
                        clearTimeout(timeout);
                        resolve(result);
                    })
                    .catch(err => {
                        clearTimeout(timeout);
                        reject(err);
                    });
            });
        };

        const result = await generateWithTimeout();
        const response = result.response;
        const text = response.text();
        
        // Enhanced JSON extraction
        try {
            // Clean the response text
            const cleanText = text
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();
            
            // Find JSON boundaries
            const jsonStart = cleanText.indexOf('{');
            const jsonEnd = cleanText.lastIndexOf('}') + 1;
            
            if (jsonStart === -1 || jsonEnd === -1) {
                throw new Error('No JSON found in AI response');
            }
            
            const jsonString = cleanText.substring(jsonStart, jsonEnd);
            const websiteData = JSON.parse(jsonString);

            // Validate response structure
            if (!websiteData.html || !websiteData.css) {
                throw new Error('AI response missing HTML or CSS');
            }

            // Ensure basic HTML structure
            let finalHTML = websiteData.html;
            if (!finalHTML.includes('<!DOCTYPE html>')) {
                finalHTML = `<!DOCTYPE html>\n${finalHTML}`;
            }
            if (!finalHTML.includes('<head>')) {
                finalHTML = finalHTML.replace('<html>', '<html>\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>AI Generated Website</title>\n</head>');
            }

            return {
                statusCode: 200,
                body: JSON.stringify({
                    html: finalHTML,
                    css: websiteData.css,
                    js: websiteData.js || ''
                })
            };
        } catch (parseError) {
            console.error("JSON parse error:", parseError);
            return {
                statusCode: 500,
                body: JSON.stringify({ 
                    error: 'Failed to parse AI response',
                    details: parseError.message,
                    suggestion: 'Please try a different prompt',
                    responseSnippet: text ? text.substring(0, 100) + "..." : "No response"
                })
            };
        }
    } catch (error) {
        console.error("Generation error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: error.message.includes('timed out') 
                    ? 'Request timed out. Please try a simpler prompt.' 
                    : 'Website generation failed',
                details: error.message,
                suggestion: 'Please try a simpler request or try again later'
            })
        };
    }
};