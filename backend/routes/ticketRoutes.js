const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// Set up Multer to store the uploaded image temporarily in memory
const upload = multer({ storage: multer.memoryStorage() });

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST endpoint to receive the image and parse it
router.post('/parse', upload.single('ticketImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded.' });
        }

        // Convert the image buffer into the format Gemini requires
        const imagePart = {
            inlineData: {
                data: req.file.buffer.toString('base64'),
                mimeType: req.file.mimetype,
            },
        };

        // We use gemini-1.5-flash as it is extremely fast for multimodal image tasks
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Instruct the AI on exactly what we want back
        const prompt = `
            Analyze this Indian Railway (IRCTC) train ticket image. 
            Extract the following details and return them STRICTLY as a JSON object:
            {
                "pnr": "string",
                "trainName": "string",
                "date": "string (YYYY-MM-DD)",
                "source": "string",
                "destination": "string",
                "seat": "string"
            }
            Do not include any markdown formatting, backticks, or conversational text. Return ONLY the raw JSON.
        `;

        // Send the image and prompt to Google's servers
        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        
        // Clean up the text just in case the AI added markdown blocks, then parse to a JS Object
        const cleanJson = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
        const ticketData = JSON.parse(cleanJson);
        
        res.status(200).json(ticketData);

    } catch (error) {
        console.error('Error analyzing ticket:', error);
        res.status(500).json({ message: 'Failed to process ticket image', error: error.message });
    }
});

module.exports = router;