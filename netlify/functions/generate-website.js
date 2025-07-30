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

Example structure:
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title</title>
    <style>/* CSS goes here */</style>
</head>
<body>
    <!-- HTML content -->
    <script>/* JavaScript goes here */</script>
</body>
</html>
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
            
            Important: 
            - The website must be fully functional and visually appealing.
            - Use modern CSS (flexbox, grid) for layout.
            - Include responsive design (mobile first).
            - Add basic accessibility features (alt text, ARIA roles).
            - Ensure the website has no errors in the console.
            - Keep CSS under 2000 characters.
            - Keep JavaScript under 1000 characters.
            - Use minimal but functional code.
        `;

        const result = await model.generateContent(optimizedPrompt);
        const response = result.response;
        const text = response.text();
        
        // Safely extract JSON
        try {
            // Try to find JSON in the response
            const jsonStart = text.indexOf('{');
            const jsonEnd = text.lastIndexOf('}') + 1;
            
            if (jsonStart === -1 || jsonEnd === -1) {
                throw new Error('No JSON found in response');
            }
            
            const jsonString = text.substring(jsonStart, jsonEnd);
            const websiteData = JSON.parse(jsonString);

            // Validate required fields
            if (!websiteData.html || !websiteData.css) {
                throw new Error('AI response missing HTML or CSS');
            }

            return {
                statusCode: 200,
                body: JSON.stringify({
                    html: websiteData.html,
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
                error: 'Website generation failed',
                details: error.message,
                suggestion: 'Please try a simpler request or try again later'
            })
        };
    }
};