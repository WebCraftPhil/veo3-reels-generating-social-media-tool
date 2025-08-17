
import React, { useState, useCallback } from 'react';
import { generateCarouselPlan, generateImage } from '../services/geminiService';
import { CarouselSlide } from '../types';
import Loader from './common/Loader';
import ErrorDisplay from './common/ErrorDisplay';
import { SparklesIcon } from './icons/Icons';

const SlideCard: React.FC<{ slide: CarouselSlide }> = ({ slide }) => {
  return (
    <div className="flex-shrink-0 w-80 bg-slate-800 rounded-lg shadow-lg overflow-hidden snap-center">
      <div className="w-full h-80 bg-slate-700 flex items-center justify-center">
        {slide.imageLoading ? (
          <Loader size="md" text="Generating image..." />
        ) : slide.imageUrl ? (
          <img src={slide.imageUrl} alt={slide.caption} className="w-full h-full object-cover" />
        ) : (
          <div className="text-slate-500">Image will appear here</div>
        )}
      </div>
      <div className="p-4">
        <p className="text-gray-300 text-sm h-24 overflow-y-auto">{slide.caption}</p>
      </div>
    </div>
  );
};


const CarouselCreator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!topic) {
      setError('Please enter a topic to generate a carousel.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSlides([]);

    try {
      const plan = await generateCarouselPlan(topic);
      const initialSlides: CarouselSlide[] = plan.map((p, index) => ({
        id: `slide-${index}-${Date.now()}`,
        ...p,
        imageLoading: true,
      }));
      setSlides(initialSlides);

      // Generate images one by one to show progress
      for (const slide of initialSlides) {
        try {
          const imageUrl = await generateImage(slide.imagePrompt);
          setSlides(prevSlides => prevSlides.map(s => s.id === slide.id ? { ...s, imageUrl, imageLoading: false } : s));
        } catch (imgError) {
          console.error(`Failed to generate image for slide ${slide.id}:`, imgError);
          setSlides(prevSlides => prevSlides.map(s => s.id === slide.id ? { ...s, imageLoading: false } : s));
          // Optionally show an error on the card itself
        }
      }

    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [topic]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4">Create a Carousel</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., 'The benefits of a morning workout routine'"
            className="flex-grow bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
            disabled={isLoading}
          />
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 bg-sky-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            <SparklesIcon className="h-5 w-5" />
            <span>{isLoading ? 'Generating...' : 'Generate Carousel'}</span>
          </button>
        </div>
        {error && <ErrorDisplay message={error} />}
      </div>

      {(isLoading && slides.length === 0) && <Loader size="lg" text="Crafting your carousel plan..." />}

      {slides.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-white">Generated Carousel Preview</h3>
          <div className="flex gap-6 pb-4 overflow-x-auto snap-x snap-mandatory">
            {slides.map((slide) => (
              <SlideCard key={slide.id} slide={slide} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CarouselCreator;
