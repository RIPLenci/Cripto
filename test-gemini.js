import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: "dummy_key" });
try {
  const parts = [];
  parts.push({ inlineData: { mimeType: "image/jpeg", data: "asd" } });
  parts.push("hello");
  const aiRes = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: parts,
  });
  console.log(aiRes);
} catch (err) {
  console.log("Error:", err.message || err);
}
