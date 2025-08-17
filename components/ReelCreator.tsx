import React, { useState, useCallback, useEffect } from 'react';
import { generateReelScript, generateVideoPromptsFromScript, generateVideo } from '../services/geminiService';
import { ReelScript, ReelScene } from '../types';
import Loader from './common/Loader';
import ErrorDisplay from './common/ErrorDisplay';
import { SparklesIcon, LegalLeafletLogo, DownloadIcon } from './icons/Icons';

const ReelScriptPreview: React.FC<{ content: ReelScript }> = ({ content }) => {
  const formattedScript = content.script
    .replace(/###\s*(.*)/g, '<h3 class="text-lg font-semibold text-sky-400 mt-4 mb-2">$1</h3>')
    .replace(/##\s*(.*)/g, '<h2 class="text-xl font-bold text-sky-300 mt-6 mb-3">$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-4 text-white">{content.title}</h2>
      <div
        className="prose prose-invert prose-sm sm:prose-base max-w-none space-y-4 text-gray-300"
        dangerouslySetInnerHTML={{ __html: formattedScript }}
      />
    </div>
  );
};

const ReelCreator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [script, setScript] = useState<ReelScript | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [videoScenes, setVideoScenes] = useState<ReelScene[]>([]);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoGenerationMessage, setVideoGenerationMessage] = useState('');

  useEffect(() => {
    if (script) {
      const cacheKey = `reel-cache::${script.title}::${script.script}`;
      try {
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
          setVideoScenes(JSON.parse(cachedData));
        } else {
          setVideoScenes([]);
        }
      } catch (e) {
        console.error("Failed to read from cache", e);
        setVideoScenes([]);
      }
    }
  }, [script]);

  const handleGenerateScript = useCallback(async () => {
    if (!topic) {
      setError('Please enter an idea for your reel.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setScript(null);
    setVideoScenes([]);
    setVideoError(null);

    try {
      const result = await generateReelScript(topic);
      setScript(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [topic]);

    const handleGenerateVideo = useCallback(async () => {
    if (!script) return;

    setIsVideoGenerating(true);
    setVideoError(null);

    try {
        let scenesToProcess: ReelScene[] = [...videoScenes];
        
        // Step 1: Generate prompts only if they don't exist
        if (scenesToProcess.length === 0) {
            setVideoGenerationMessage('Analyzing script to create video scenes...');
            const prompts = await generateVideoPromptsFromScript(script.script);
            scenesToProcess = prompts.map(p => ({ prompt: p, isLoading: false }));
            setVideoGenerationMessage(`Found ${prompts.length} scenes. Preparing to generate...`);
        }

        // Step 2: Mark scenes that need generation as "isLoading"
        const scenesWithLoadingState = scenesToProcess.map(scene => 
            !scene.videoUrl ? { ...scene, isLoading: true, error: undefined } : scene
        );
        setVideoScenes(scenesWithLoadingState);
        
        let currentScenes = [...scenesWithLoadingState];

        // Step 3: Loop and generate videos only for scenes that need it
        for (let i = 0; i < currentScenes.length; i++) {
            const scene = currentScenes[i];
            if (!scene.videoUrl && scene.isLoading) {
                setVideoGenerationMessage(`Generating video for scene ${i + 1} of ${currentScenes.length}. This can take a few minutes...`);
                try {
                    const videoUrl = await generateVideo(scene.prompt);
                    currentScenes = currentScenes.map((s, index) => 
                        index === i ? { ...s, videoUrl, isLoading: false } : s
                    );
                    setVideoScenes(currentScenes);
                } catch (e) {
                    console.error(`Failed to generate video for scene ${i + 1}:`, e);
                    currentScenes = currentScenes.map((s, index) => 
                        index === i ? { ...s, isLoading: false, error: (e as Error).message } : s
                    );
                    setVideoScenes(currentScenes);
                }
            }
        }
        
        // Step 4: Caching and finalization
        setVideoGenerationMessage('');
        const generatedCount = currentScenes.filter(s => s.videoUrl).length;
        if (generatedCount > 0) {
             const cacheKey = `reel-cache::${script.title}::${script.script}`;
            try {
                sessionStorage.setItem(cacheKey, JSON.stringify(currentScenes));
            } catch (e) {
                console.error("Failed to save to cache", e);
                setVideoError("Could not save videos to cache. Your browser's session storage may be full.");
            }
        }
        
        const failedCount = currentScenes.filter(s => s.error).length;
        if(generatedCount === 0 && failedCount > 0) {
            setVideoError('Could not generate any videos. Please try again or refine your script.');
        }

    } catch (e) {
        setVideoError((e as Error).message);
    } finally {
        setIsVideoGenerating(false);
    }
}, [script, videoScenes]);

  const handleDownload = (videoUrl: string, sceneIndex: number) => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `socialgenius-scene-${sceneIndex + 1}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const scenesThatNeedGeneration = videoScenes.filter(s => !s.videoUrl).length;
  const totalScenesCount = videoScenes.length;
  const showGenerateVideoButton = script && (totalScenesCount === 0 || scenesThatNeedGeneration > 0);

  let generateButtonText = 'Generate Video from Script';
  if (isVideoGenerating) {
    generateButtonText = 'Generating Video...';
  } else if (totalScenesCount > 0 && scenesThatNeedGeneration > 0) {
    if (scenesThatNeedGeneration < totalScenesCount) {
        generateButtonText = `Generate Remaining ${scenesThatNeedGeneration} Clip(s)`;
    } else {
        generateButtonText = `Retry Video Generation`;
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4">Create a Reel Script</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., 'A 3-step guide to making the perfect iced coffee'"
            className="flex-grow bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
            disabled={isLoading || isVideoGenerating}
          />
          <button
            onClick={handleGenerateScript}
            disabled={isLoading || isVideoGenerating}
            className="flex items-center justify-center gap-2 bg-sky-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            <SparklesIcon className="h-5 w-5" />
            <span>{isLoading ? 'Generating...' : 'Generate Script'}</span>
          </button>
        </div>
        {error && <ErrorDisplay message={error} />}
      </div>

      {isLoading && <Loader size="lg" text="Writing your viral script..." />}

      {script && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white text-center">Generated Reel Script</h3>
            <ReelScriptPreview content={script} />
          </div>
          
          {showGenerateVideoButton && (
            <div className="text-center">
                <button
                onClick={handleGenerateVideo}
                disabled={isLoading || isVideoGenerating}
                className="flex items-center mx-auto justify-center gap-2 bg-green-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                <SparklesIcon className="h-5 w-5" />
                <span>{generateButtonText}</span>
                </button>
            </div>
          )}
        </div>
      )}

      {(isVideoGenerating && videoScenes.every(s => s.isLoading)) && <Loader size="lg" text={videoGenerationMessage} />}
      
      {videoError && <ErrorDisplay message={videoError} />}

      {videoScenes.length > 0 && (
        <div className="mt-2">
            <h3 className="text-lg font-semibold mb-4 text-white text-center">Generated Video Clips</h3>
            
            <div className="space-y-4 max-w-2xl mx-auto">
                {videoScenes.map((scene, index) => (
                    <div key={index} className="bg-slate-800 rounded-lg shadow-lg p-4">
                        <p className="text-sm text-slate-400 mb-2 italic">Scene {index + 1}: "{scene.prompt}"</p>
                        <div className="relative w-full aspect-video bg-slate-700 rounded-md overflow-hidden flex items-center justify-center text-slate-400">
                            {scene.isLoading && <Loader size="md" text={videoGenerationMessage || `Generating scene ${index + 1}...`} />}
                            {scene.error && <ErrorDisplay message={scene.error} />}
                            {scene.videoUrl && (
                                <>
                                    <video src={scene.videoUrl} controls autoPlay loop muted className="w-full h-full object-cover" aria-label={`Video for scene ${index + 1}`} />
                                    <div className="absolute bottom-2 right-2 opacity-70 pointer-events-none">
                                        <LegalLeafletLogo className="h-6" />
                                    </div>
                                    <button
                                        onClick={() => handleDownload(scene.videoUrl!, index)}
                                        className="absolute top-2 right-2 bg-slate-900/50 p-2 rounded-full text-white hover:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors"
                                        aria-label={`Download scene ${index + 1}`}
                                        title="Download clip"
                                    >
                                        <DownloadIcon className="h-5 w-5" />
                                    </button>
                                </>
                            )}
                            {!scene.isLoading && !scene.videoUrl && !scene.error && <span>Video generation was unsuccessful for this scene.</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default ReelCreator;