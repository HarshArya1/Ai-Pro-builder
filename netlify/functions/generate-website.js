import { GoogleGenerativeAI } from '@google/generative-ai';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const ai = new GoogleGenerativeAI(GOOGLE_API_KEY);

const ENHANCED_INSTRUCTIONS = `
You are an Pro expert AI agent specializing in automated frontend web development. 
Generate only the essential HTML, CSS, and JavaScript needed for the requested website.
The Website must be workable if user say generate a tic tac toe game then the website you generate of that game must work
must understand the website you made must be a good lokking great impressive Ui 
you can you react,react-routing,react-redux.
react-routing to made website multipages,redux for store a entity golobaly in that website,react for add more functionality
you can use animations for made page more atractive
must add dark model toogle by your side or give the name of web page if user not gave you or give header section according to user web page
ex- if suppose user say generate a e-commerse website or not say anything about header you by yourself add login,sign,contact us,Explore etc like according after understand the prompt of user what type website they want to genrate
 
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

    // Set a timeout for the AI generation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('AI generation timed out (8 seconds)'));
      }, 8000); // 8 second timeout (leaving 2 seconds for processing)
    });

    const generationPromise = model.generateContent(`
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
    `);

    const result = await Promise.race([generationPromise, timeoutPromise]);
    const response = result.response;
    const text = response.text();
    
    // Safely extract JSON
    try {
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
          preview: generatePreviewURL(websiteData)
        })
      };
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Failed to parse AI response',
          details: parseError.message
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