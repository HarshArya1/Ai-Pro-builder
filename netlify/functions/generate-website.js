
import { GoogleGenerativeAI } from '@google/generative-ai';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const ai = new GoogleGenerativeAI(GOOGLE_API_KEY);

const ENHANCED_INSTRUCTIONS = `
You are an expert AI agent specializing in automated frontend web development. 
Generate only the essential HTML, CSS, and JavaScript needed for the requested website.

Instructions:
- Respond with JSON in this exact format: { "html": "...", "css": "...", "js": "..." }
- The HTML must be a complete document starting with <!DOCTYPE html> and including the head and body.
- The CSS must be a complete stylesheet that styles the entire page. Use modern, responsive design.
- The JavaScript must be minimal and only for essential interactivity. Use vanilla JS, no frameworks.
- The entire website must be self-contained and functional when combined.
- Ensure the website is fully responsive and works on mobile devices.
- Include fallbacks for older browsers where necessary.
- Use semantic HTML5 elements for better accessibility.
- Optimize CSS for performance (avoid overly complex selectors).
- Add comments to explain complex parts of the code.

Important: 
- The CSS should be a string of CSS rules (without style tags).
- The JS should be a string of JavaScript code (without script tags).
- Ensure the website has no layout shifts and loads quickly.
- Include common UI patterns like navigation, hero section, content sections, and footer.
- Use modern CSS features like Flexbox and Grid for layout.
- Add subtle animations for better user experience.
- Ensure color contrast meets accessibility standards.

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
      - Keep CSS under 1500 characters
      - Keep JavaScript under 800 characters
      - Use only vanilla JavaScript
    `;

    const result = await model.generateContent(optimizedPrompt);
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
          suggestion: 'Please try a different prompt'
        })
      };
    }
  } catch (error) {
    console.error("Generation error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Website generation failed',
        details: error.message,
        suggestion: 'Please try a simpler request'
      })
    };
  }
};