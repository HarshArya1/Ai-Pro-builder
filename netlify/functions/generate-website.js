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

    // Add timeout to the AI request
    const generateWithTimeout = () => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('AI generation timed out (25s)'));
        }, 25000); // 25 second timeout

        const optimizedPrompt = `
          USER REQUEST: ${userPrompt}
          
          Generate a complete website with:
          - HTML (must be a full document with doctype, html, head, body)
          - CSS (only the CSS rules, without <style> tags)
          - JavaScript (only the JS code, without <script> tags)
          
          Respond ONLY with valid JSON in this exact format:
          {
            "html": "...",
            "css": "...",
            "js": "..."
          }
        `;

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
    
    try {
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No JSON found in response');
      }
      
      const jsonString = text.substring(jsonStart, jsonEnd);
      const websiteData = JSON.parse(jsonString);

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
          responseText: text
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