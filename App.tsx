
import React, { useState } from 'react';
import { ContentType } from './types';
import { LogoIcon } from './components/icons/Icons';
import CarouselCreator from './components/CarouselCreator';
import ImagePostCreator from './components/ImagePostCreator';
import ReelCreator from './components/ReelCreator';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ContentType>(ContentType.Carousel);

  const renderContent = () => {
    switch (activeTab) {
      case ContentType.Carousel:
        return <CarouselCreator />;
      case ContentType.ImagePost:
        return <ImagePostCreator />;
      case ContentType.Reel:
        return <ReelCreator />;
      default:
        return <CarouselCreator />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-gray-200 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-5xl flex flex-col sm:flex-row justify-between items-center mb-8">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <LogoIcon className="h-10 w-10 text-sky-400" />
          <h1 className="text-3xl font-bold tracking-tight text-white">SocialGenius AI</h1>
        </div>
        <nav className="w-full sm:w-auto bg-slate-800 p-1.5 rounded-lg shadow-md">
          <ul className="flex justify-center items-center gap-2">
            {(Object.values(ContentType) as Array<ContentType>).map((tab) => (
              <li key={tab} className="flex-1">
                <button
                  onClick={() => setActiveTab(tab)}
                  className={`w-full px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 ${
                    activeTab === tab
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-gray-300 hover:bg-slate-700'
                  }`}
                >
                  {tab}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="w-full max-w-5xl flex-grow">
        {renderContent()}
      </main>
      <footer className="w-full max-w-5xl text-center mt-8 text-slate-500 text-sm">
        <p>Powered by Google Gemini</p>
      </footer>
    </div>
  );
};

export default App;
