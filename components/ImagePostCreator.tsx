
import React, { useState, useCallback } from 'react';
import { generateImagePostContent, generateImage } from '../services/geminiService';
import { ImagePost } from '../types';
import Loader from './common/Loader';
import ErrorDisplay from './common/ErrorDisplay';
import { SparklesIcon } from './icons/Icons';

const ImagePostPreview: React.FC<{ post: ImagePost }> = ({ post }) => {
  return (
    <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden max-w-lg mx-auto">
      <div className="w-full aspect-square bg-slate-700 flex items-center justify-center">
        {post.imageUrl ? (
          <img src={post.imageUrl} alt={post.caption} className="w-full h-full object-cover" />
        ) : (
          <Loader size="md" text="Generating image..." />
        )}
      </div>
      <div className="p-5">
        <p className="text-gray-300 whitespace-pre-wrap">{post.caption}</p>
      </div>
    </div>
  );
};

const ImagePostCreator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [post, setPost] = useState<ImagePost | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!topic) {
      setError('Please enter a topic for your post.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setPost(null);

    try {
      const content = await generateImagePostContent(topic);
      setPost({ ...content, imageUrl: undefined });
      
      const imageUrl = await generateImage(content.imagePrompt);
      setPost({ ...content, imageUrl });

    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [topic]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4">Create an Image Post</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., 'A cozy coffee shop on a rainy day'"
            className="flex-grow bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
            disabled={isLoading}
          />
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 bg-sky-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            <SparklesIcon className="h-5 w-5" />
            <span>{isLoading ? 'Generating...' : 'Generate Post'}</span>
          </button>
        </div>
        {error && <ErrorDisplay message={error} />}
      </div>

      {isLoading && <Loader size="lg" text="Dreaming up your post..." />}

      {post && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-white text-center">Generated Post Preview</h3>
          <ImagePostPreview post={post} />
        </div>
      )}
    </div>
  );
};

export default ImagePostCreator;
