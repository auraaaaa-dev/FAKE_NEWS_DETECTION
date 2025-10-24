// frontend/api.js
const backendURL = import.meta.env.VITE_BACKEND_URL; // set in Vercel / .env.local

export async function detectFakeNews(text) {
  try {
    const response = await fetch(`${backendURL}/api/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return data.result;
  } catch (err) {
    console.error("API call failed:", err);
    return "Error: Unable to detect fake news right now.";
  }
}
