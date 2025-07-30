import { GoogleGenerativeAI } from '@google/generative-ai';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const ai = new GoogleGenerativeAI(GOOGLE_API_KEY);

const ENHANCED_INSTRUCTIONS = `
You are an expert AI agent specializing in automated frontend web development. 
Generate only the essential HTML, CSS, and JavaScript needed for the requested website.
Give the code line by line not all code came in one line
Made Webpage Amazing UI so that user just love it, our goal to happy the user by our work
so just make awesomw fully workable web page and you use react,react routing(for add multipage website functionality),
react redux for add functionality so that user just love it
Respond with JSON in this exact format:
{
  "html": "<!DOCTYPE html>...",
  "css": "body { ... }",
  "js": "function() { ... }"
}
Keep the response concise and focused on the core functionality.
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
      model: "gemini-1.5-flash",
      systemInstruction: ENHANCED_INSTRUCTIONS,
    });

    // Optimized prompt for faster responses
    const optimizedPrompt = `
      USER REQUEST: ${userPrompt}
      
      Generate a complete website with:
      - HTML (index.html)
      - CSS (style.css)
      - JavaScript (script.js)
      
      Respond ONLY with valid JSON in this format:
      {
        "html": "...",
        "css": "...",
        "js": "..."
      }
      
      Important: 
      - Keep CSS under 1000 characters
      - Keep JavaScript under 500 characters
      - Use minimal but functional code
      - Avoid large libraries
    `;

    const result = await model.generateContent(optimizedPrompt);
    const response = result.response;
    const text = response.text();
    
    // Safely extract JSON with better error handling
    try {
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No JSON found in response');
      }
      
      const jsonString = text.substring(jsonStart, jsonEnd);
      const websiteData = JSON.parse(jsonString);

      return {
        statusCode: 200,
        body: JSON.stringify({
          html: websiteData.html,
          css: websiteData.css,
          js: websiteData.js
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
        error: 'Website generation failed',
        details: error.message,
        suggestion: 'Please try a simpler request or try again later'
      })
    };
  }
};