/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

/* System prompt for the chatbot */
const systemPrompt = `
You are a helpful assistant specializing in L’Oréal products, skincare routines, and beauty recommendations. 
Only answer questions related to L’Oréal's offerings and beauty-related topics. 
If a question is unrelated, politely respond with: "I'm sorry, I can only assist with questions about L’Oréal products, routines, and beauty-related topics."
`;

/* Conversation history to track context */
let conversationHistory = [{ role: "system", content: systemPrompt }];

/* Function to append messages to the chat window */
function appendMessage(content, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("msg", sender); // 'user' or 'ai'
  messageDiv.textContent = content;
  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight; // Auto-scroll to the latest message
}

/* Function to display the user's latest question above the AI's response */
function displayLatestQuestion(question) {
  // Remove any existing latest question
  const existingLatestQuestion = document.querySelector(".latest-question");
  if (existingLatestQuestion) {
    existingLatestQuestion.remove();
  }

  // Create and display the new latest question
  const latestQuestionDiv = document.createElement("div");
  latestQuestionDiv.classList.add("msg", "user", "latest-question");
  latestQuestionDiv.textContent = `You asked: "${question}"`;
  chatWindow.appendChild(latestQuestionDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight; // Auto-scroll to the latest message
}

/* Replace OpenAI API URL with your Cloudflare Worker endpoint */
const CLOUDFLARE_WORKER_URL =
  "https://loreal-chatbot.kdeppenschmidt.workers.dev/";

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get user input
  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  // Display user message in the chat window
  appendMessage(userMessage, "user");

  // Add user message to conversation history
  conversationHistory.push({ role: "user", content: userMessage });

  // Clear the input field
  userInput.value = "";

  // Display the user's latest question above the AI's response
  displayLatestQuestion(userMessage);

  // Display a loading message while waiting for the API response
  const loadingMessage = document.createElement("div");
  loadingMessage.classList.add("msg", "ai");
  loadingMessage.textContent = "Typing...";
  chatWindow.appendChild(loadingMessage);

  try {
    // Send request to the Cloudflare Worker endpoint
    const response = await fetch(CLOUDFLARE_WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: conversationHistory, // Send the entire conversation history
      }),
    });

    // Check if the response is OK
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Parse the response
    const data = await response.json();

    // Ensure the response contains the expected data
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const aiMessage = data.choices[0].message.content;

      // Add AI response to conversation history
      conversationHistory.push({ role: "assistant", content: aiMessage });

      // Replace the loading message with the AI's response
      loadingMessage.textContent = aiMessage;
    } else {
      throw new Error("Unexpected response format from API.");
    }
  } catch (error) {
    // Handle errors and display an error message
    loadingMessage.textContent =
      "Sorry, something went wrong. Please try again.";
    console.error("Error:", error);
  }
});
