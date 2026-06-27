const { GoogleGenerativeAI } = require("@google/generative-ai");
const sanitizeHtml = require("sanitize-html");

const apiKey = process.env.GEMINI_API_KEY;
const isDemoKey = !apiKey || apiKey === "your_google_gemini_key_here" || apiKey.trim() === "";

// Mock description generator for offline/demo fallback
function mockGenerateDescription(title, category, keywords) {
    const kwList = keywords ? keywords.split(",").map(k => k.trim()) : [];
    const kwString = kwList.length > 0 ? kwList.join(", ") : "modern design and high comfort";
    return `Welcome to this premium space! Located in a highly sought-after destination, this property is the perfect choice for your next stay.

The design emphasizes local architecture and comfortable living. You'll find yourself close to local landmarks, restaurants, and transport connections.

✨ Highlights of your stay:
• Features: ${kwString}
• Curated category styling: ${category || "General"}
• High-speed internet and traveler-friendly desk setup

(Demo description generated offline. Configure a valid GEMINI_API_KEY in your .env file to enable live AI generation!)`;
}

// AI description generator controller
module.exports.generateDescription = async (req, res) => {
    try {
        const { title, category, keywords } = req.body;
        
        // Input validation & sanitization
        if (!title) {
            return res.status(400).json({ success: false, error: "Listing title is required for AI generation" });
        }
        
        const cleanTitle = sanitizeHtml(title.trim());
        const cleanCategory = sanitizeHtml((category || "").trim());
        const cleanKeywords = sanitizeHtml((keywords || "").trim());
        
        let description = "";
        
        if (isDemoKey) {
            description = mockGenerateDescription(cleanTitle, cleanCategory, cleanKeywords);
        } else {
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                
                const prompt = `You are a professional copywriting assistant for high-end vacation rentals.
Write a captivating, premium listing description for a stay with:
Title: "${cleanTitle}"
Category: "${cleanCategory}"
Keywords/Key features: "${cleanKeywords}"

Requirements:
- Length: 2 to 3 paragraphs.
- Tone: Welcoming, highly appealing, professional.
- Focus: Highlight the stay's category and features.
- Output: ONLY the text of the description. Do NOT include markdown headers, titles, or intro phrases.`;

                const result = await model.generateContent(prompt);
                description = result.response.text().trim();
            } catch (apiErr) {
                console.error("Gemini API call failed, falling back to mock:", apiErr);
                description = mockGenerateDescription(cleanTitle, cleanCategory, cleanKeywords);
            }
        }
        
        return res.json({ success: true, description });
    } catch (err) {
        console.error("AI controller error:", err);
        return res.status(500).json({ success: false, error: "Internal server error during description generation" });
    }
};

// Helper function to summarize reviews (used by review controller in Phase 5)
module.exports.summarizeReviews = async (reviews) => {
    if (!reviews || reviews.length === 0) return "";
    
    const reviewsText = reviews
        .map((r, i) => `Review ${i + 1} (${r.rating} stars): "${r.comment}"`)
        .join("\n");
        
    if (isDemoKey) {
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = (totalRating / reviews.length).toFixed(1);
        return `Guests generally love this stay, rating it ${avgRating}/5 stars. They highlight the clean rooms, nice amenities, and the helpfulness of the host. (Demo summary)`;
    }
    
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `You are an AI assistant summarizing guest reviews for a vacation stay.
Below is a list of guest reviews for a listing:
${reviewsText}

Summarize these reviews in 2 or 3 clear sentences. Capture the overall sentiment, common praises, and any recurrent complaints.
Keep the output natural and helpful. Do NOT include headers, intro tags, or labels.`;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (err) {
        console.error("AI review summary call failed:", err);
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = (totalRating / reviews.length).toFixed(1);
        return `Based on ${reviews.length} reviews, this stay has a guest rating of ${avgRating}/5 stars. Guests appreciate the experience.`;
    }
};
