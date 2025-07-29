import { GoogleGenerativeAI } from '@google/generative-ai';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const ai = new GoogleGenerativeAI(GOOGLE_API_KEY);

// Enhanced AI agent instructions
const ENHANCED_INSTRUCTIONS = `
You are an expert AI agent specializing in automated frontend web development. Follow this workflow:

<-- CORE MISSION -->
1. Create complete, functional, and visually stunning websites
2. Generate HTML, CSS, and JavaScript files
3. Ensure all features are fully functional
4. Create responsive designs with modern UI/UX

<-- OUTPUT FORMAT -->
Return JSON with:
{
  "html": "HTML content",
  "css": "CSS content",
  "js": "JavaScript content"
}
`;

export const handler = async (event) => {
  const body = JSON.parse(event.body);
  const userPrompt = body.prompt;
  
  if (!userPrompt) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Prompt is required' })
    };
  }

  try {
    const model = ai.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: ENHANCED_INSTRUCTIONS,
    });

    const result = await model.generateContent(`
      USER PROMPT: ${userPrompt}
      
      Generate a complete website with:
      - HTML file (index.html)
      - CSS file (style.css)
      - JavaScript file (script.js)
      
      Output ONLY JSON in this format:
      {
        "html": "<!DOCTYPE html>...",
        "css": "body { ... }",
        "js": "function() { ... }"
      }
    `);

    const response = result.response;
    const text = response.text();
    
    // Extract JSON from AI response
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    const jsonString = text.substring(jsonStart, jsonEnd);
    
    const websiteData = JSON.parse(jsonString);

    return {
      statusCode: 200,
      body: JSON.stringify({
        html: websiteData.html,
        css: websiteData.css,
        js: websiteData.js,
        preview: generatePreviewURL(websiteData.html)
      })
    };
  } catch (error) {
    console.error("Generation error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Website generation failed',
        details: error.message
      })
    };
  }
};

function generatePreviewURL(websiteData) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${websiteData.css}</style>
    </head>
    <body>
      ${websiteData.html}
      <script>${websiteData.js}</script>
    </body>
    </html>
  `;
  
  return `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
}