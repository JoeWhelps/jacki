// Service for interacting with Hugging Face Inference API
// Using DeepSeek-V3.2 model for topic summarization
//
// NOTE: To use this service, you need to set up a Hugging Face API key:
// 1. Get your API key from https://huggingface.co/settings/tokens
// 2. Add it to your .env file as: REACT_APP_HF_TOKEN=your_key_here
//    (or HF_TOKEN=your_key_here for non-React environments)
// 3. Make sure to restart your dev server after adding the token

import { InferenceClient } from "@huggingface/inference";

// Support multiple environment variable names for the Hugging Face token
const HF_TOKEN = 
  process.env.REACT_APP_HF_TOKEN || 
  process.env.REACT_APP_HUGGING_FACE_API_KEY ||
  process.env.HUGGING_FACE_API_KEY ||
  process.env.HF_TOKEN || 
  "";

// Debug: Log if token is found (but don't log the actual token for security)
if (!HF_TOKEN) {
  console.warn("Hugging Face token not found. Using public API with rate limits.");
} else {
  // Validate token format (HF tokens typically start with "hf_")
  const isValidFormat = HF_TOKEN.startsWith("hf_");
  console.debug(
    "Hugging Face token found, length:", 
    HF_TOKEN.length, 
    isValidFormat ? "(valid format)" : "(unexpected format - should start with 'hf_')"
  );
}

/**
 * Search a topic and get an AI-generated summary and link
 * @param {string} topic - The topic to search/summarize (e.g., "Ancient Rome")
 * @returns {Promise<{summary: string, link: string}>} - AI-generated summary and link
 */
export async function searchTopic(topic) {
  if (!topic || !topic.trim()) {
    throw new Error("Topic cannot be empty");
  }

  // Prepare the prompt: Ask for summary and best link
  const prompt = `Summarize ${topic} in 2500 characters or less. Fill the space with comprehensive, detailed information. Also provide the best possible link for further information about this subject. 

Important requirements:
1. Search the internet to find the most reputable and common source (prefer Wikipedia or other authoritative sources)
2. Verify that the link is active and accessible
3. Use the most reliable and well-known source available

Format your response as:
Summary: [your summary here]
Link: [the verified, active URL here]`;

  try {
    // Create client with token - pass undefined if token is empty string
    // Note: InferenceClient handles CORS properly, unlike direct fetch calls
    const token = HF_TOKEN && HF_TOKEN.trim() !== "" ? HF_TOKEN : undefined;
    
    if (!token) {
      throw new Error(
        "Hugging Face API token not found. Please:\n" +
        "1. Create a .env file in the root directory\n" +
        "2. Add: REACT_APP_HF_TOKEN=hf_your_token_here\n" +
        "3. Restart your dev server (npm start)"
      );
    }

    const client = new InferenceClient(token);

    const chatCompletion = await client.chatCompletion({
      model: "deepseek-ai/DeepSeek-V3.2",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract the message content from the response
    const message = chatCompletion.choices[0]?.message;
    
    if (!message || !message.content) {
      throw new Error("No content received from Hugging Face API");
    }

    const content = message.content.trim();
    
    // Parse the response to extract summary and link
    let summary = "";
    let link = "";
    
    // Try to extract Summary: and Link: from the response
    const summaryMatch = content.match(/Summary:\s*(.+?)(?:\n|Link:|$)/is);
    const linkMatch = content.match(/Link:\s*(.+?)(?:\n|$)/is);
    
    if (summaryMatch) {
      summary = summaryMatch[1].trim();
    } else {
      // Fallback: if no "Summary:" label, take first 300 chars
      summary = content.substring(0, 300).trim();
    }
    
    if (linkMatch) {
      link = linkMatch[1].trim();
      // Clean up the link (remove any trailing punctuation or extra text)
      link = link.replace(/[.,;:!?]+$/, '').trim();
    }
    
    return { summary, link };
  } catch (error) {
    console.error("Error calling Hugging Face API:", error);
    
    // Provide more helpful error messages
    if (error.message) {
      // Handle auto-router error specifically
      if (error.message.includes("auto-router")) {
        throw new Error(
          "API authentication issue. The token may not be recognized as a valid Hugging Face token.\n" +
          "Please verify:\n" +
          "1. Your REACT_APP_HF_TOKEN in .env file is correct (should start with 'hf_')\n" +
          "2. You've restarted your dev server after adding the token\n" +
          "3. The token has 'read' permissions in your Hugging Face account\n" +
          "4. The token is from https://huggingface.co/settings/tokens (not from a third-party service)\n" +
          `Original error: ${error.message}`
        );
      }
      throw error;
    }
    
    throw new Error(`Failed to get AI summary: ${error.toString()}`);
  }
}

