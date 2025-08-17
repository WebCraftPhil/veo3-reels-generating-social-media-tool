import { GoogleGenAI, Type } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const textModel = 'gemini-2.5-flash';
const imageModel = 'imagen-3.0-generate-002';
const videoModel = 'veo-2.0-generate-001';

export const generateCarouselPlan = async (topic: string): Promise<{ imagePrompt: string; caption: string; }[]> => {
    try {
        const prompt = `Create a carousel plan for a social media post about "${topic}". The carousel should have between 3 and 5 slides. For each slide, provide a detailed prompt for an image generation model and a short, engaging caption. The image prompts should be vivid and create a cohesive visual story. Return the result as a JSON array.`;

        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            imagePrompt: {
                                type: Type.STRING,
                                description: 'A detailed prompt for an image generation model.',
                            },
                            caption: {
                                type: Type.STRING,
                                description: 'A short, engaging caption for the slide.',
                            },
                        },
                        required: ["imagePrompt", "caption"]
                    },
                },
            },
        });
        
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse;

    } catch (error) {
        console.error("Error generating carousel plan:", error);
        throw new Error("Failed to generate carousel plan. Please try again.");
    }
};

export const generateImagePostContent = async (topic: string): Promise<{ imagePrompt: string; caption: string; }> => {
    try {
        const prompt = `Generate content for a single social media image post about "${topic}". Provide a detailed prompt for an image generation model and a suitable caption. The image prompt should be creative and descriptive. The caption should be engaging and include relevant hashtags. Return a JSON object.`;

        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        imagePrompt: {
                            type: Type.STRING,
                            description: 'A detailed prompt for an image generation model.',
                        },
                        caption: {
                            type: Type.STRING,
                            description: 'An engaging caption for the post with hashtags.',
                        },
                    },
                    required: ["imagePrompt", "caption"]
                },
            },
        });

        const jsonResponse = JSON.parse(response.text);
        return jsonResponse;
    } catch (error) {
        console.error("Error generating image post content:", error);
        throw new Error("Failed to generate post content. Please try again.");
    }
};

export const generateReelScript = async (topic: string): Promise<{ title: string, script: string }> => {
    try {
        const prompt = `Create a short video reel script about "${topic}". The script should be for a video under 60 seconds. Give it a catchy title. Break it down into 3-5 scenes. For each scene, describe the visual, the voiceover or audio, and any on-screen text. Format the output clearly with markdown for headings and bold text.`;

        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
        });
        
        // Let's ask another AI call to structure it.
        const structurePrompt = `Take the following script and format it into a JSON object with a "title" and a "script" field. The script should be the full text content.\n\nScript:\n${response.text}`;

        const structuredResponse = await ai.models.generateContent({
            model: textModel,
            contents: structurePrompt,
             config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: {
                            type: Type.STRING,
                            description: 'The title of the reel script.',
                        },
                        script: {
                            type: Type.STRING,
                            description: 'The full formatted script content.',
                        },
                    },
                    required: ["title", "script"]
                },
            },
        });

        return JSON.parse(structuredResponse.text);

    } catch (error) {
        console.error("Error generating reel script:", error);
        throw new Error("Failed to generate reel script. Please try again.");
    }
};

export const generateImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: imageModel,
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1',
            },
        });
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate image.");
    }
};

export const generateVideoPromptsFromScript = async (script: string): Promise<string[]> => {
    try {
        const prompt = `Based on the following reel script, generate a concise, visually descriptive prompt for an AI video generation model for each scene. Each prompt should describe a single, continuous shot that is visually interesting. Return a JSON array of strings, where each string is a prompt.

        Script:
        ${script}`;

        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING,
                        description: "A prompt for an AI video generation model.",
                    }
                },
            },
        });

        const jsonResponse = JSON.parse(response.text);
        return jsonResponse;

    } catch (error) {
        console.error("Error generating video prompts:", error);
        throw new Error("Failed to generate video prompts from script.");
    }
};

export const generateVideo = async (prompt: string): Promise<string> => {
    try {
        let operation = await ai.models.generateVideos({
            model: videoModel,
            prompt: prompt,
            config: {
                numberOfVideos: 1
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation completed, but no download link was found.");
        }
        
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!response.ok) {
            throw new Error(`Failed to download video: ${response.statusText}`);
        }
        const videoBlob = await response.blob();
        
        const videoDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(videoBlob);
        });
        return videoDataUrl;

    } catch (error) {
        console.error("Error generating video:", error);
        throw new Error("Failed to generate video. This is an experimental feature and may take several minutes.");
    }
};