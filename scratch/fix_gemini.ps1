$path = "c:\Users\Nikhil\Downloads\multi-agent-truth-engine\server.ts"
$content = Get-Content $path -Raw

# Fix model name
$content = $content -replace 'gemini-flash-1.5', 'gemini-1.5-flash'

# Fix the Gemini API call block
$oldBlock = '      const geminiModel = configuredModel.includes\(''gemini''\) \? configuredModel.split\(''\/''\).pop\(\) \|\| ''gemini-1.5-flash'' : ''gemini-1.5-flash'';\s+
      const response = await client.models.generateContent\(\{
        model: geminiModel,
        contents: prompt,
        config: \{
          systemInstruction,
          responseMimeType: ''application\/json'',
          temperature: 0.2,
        \},
      \}\);'

# Let's try a simpler regex to find the problematic block
$regex = '(?s)const client = dynamicGeminiKey === geminiKey \? genAI : new GoogleGenAI\(\{ apiKey: dynamicGeminiKey \}\);.*?const res = parseJsonResponse\(response\.text \|\| ''\{\}''\);'

$newBlock = 'const client = dynamicGeminiKey === geminiKey ? genAI : new GoogleGenAI({ apiKey: dynamicGeminiKey });
      
      let geminiModelName = configuredModel.includes("gemini") ? configuredModel.split("/").pop() || "gemini-1.5-flash" : "gemini-1.5-flash";
      if (geminiModelName === "gemini-flash-1.5") geminiModelName = "gemini-1.5-flash";

      const executeGemini = async (mName) => {
        const model = client.getGenerativeModel({ 
          model: mName,
          generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
          systemInstruction: systemInstruction,
        });
        const result = await model.generateContent(prompt);
        return result.response;
      };

      let response;
      try {
        response = await executeGemini(geminiModelName);
      } catch (geminiErr) {
        console.warn(`Gemini model ${geminiModelName} failed, falling back to gemini-1.5-flash...`);
        response = await executeGemini("gemini-1.5-flash");
      }

      const res = parseJsonResponse(response.text() || "{}");'

$content = $content -replace [regex]::Escape('const client = dynamicGeminiKey === geminiKey ? genAI : new GoogleGenAI({ apiKey: dynamicGeminiKey });'), $newBlock

# Also fix the parseJsonResponse call which is now redundant or needs update
$content = $content -replace 'const res = parseJsonResponse\(response\.text \|\| ''\{\}''\);', ''

Set-Content $path $content
