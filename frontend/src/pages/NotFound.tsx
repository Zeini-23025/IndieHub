import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import AnimeGirl404 from '../assets/404_girl.png';

const NotFound = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const isRTL = language === 'ar';

    return (
        <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_50%)] animate-pulse"></div>
                <div className="scanline-overlay"></div>
            </div>

            <div className="max-w-2xl w-full flex flex-col items-center gap-10 z-10">

                {/* Main Glitch Header */}
                <div className="relative">
                    <h1 className="font-pixel-2xl text-[8rem] leading-none text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 crt-glow relative z-10">
                        404
                    </h1>
                    <h1 className="font-pixel-2xl text-[8rem] leading-none text-[#ef4444] absolute top-0 left-0 opacity-50 animate-glitch z-0" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)', transform: 'translate(-2px)' }}>
                        404
                    </h1>
                    <h1 className="font-pixel-2xl text-[8rem] leading-none text-[#6366f1] absolute top-0 left-0 opacity-50 animate-glitch z-0" style={{ clipPath: 'polygon(0 80%, 100% 20%, 100% 100%, 0 100%)', transform: 'translate(2px)', animationDirection: 'reverse' }}>
                        404
                    </h1>
                </div>

                {/* Image Container with Hover Effect */}
                <div className="relative group transition-all duration-500 hover:scale-[1.02]">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-40 group-hover:opacity-100 transition duration-500"></div>
                    <div className="relative pixel-border bg-[#1a1a1a] p-2 leading-none shadow-2xl">
                        <img
                            src={AnimeGirl404}
                            alt="404 Anime Girl"
                            className="w-72 h-72 object-cover pixel-blur rounded opacity-90 group-hover:opacity-100 transition-opacity"
                        />
                        {/* Chromatic aberration overlay on hover */}
                        <div className="absolute inset-0 bg-transparent mix-blend-color-dodge opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                            style={{ backgroundImage: 'linear-gradient(45deg, #ff00ff, #00ffff)' }}></div>
                    </div>
                </div>

                {/* Text Area */}
                <div className="space-y-6 max-w-lg w-full">
                    <div className="font-pixel-lg text-xl text-gray-300 tracking-wider">
                        <span className="text-accent-primary">&lt;</span> {t('notFound.sector')} <span className="text-accent-primary">/&gt;</span>
                    </div>

                    <div className={`border-l-2 ${isRTL ? 'border-r-2 border-l-0 pr-4' : 'border-l-2 pl-4'} border-accent-primary text-start`}>
                        {/* Reset typewriter animation when language changes by using key */}
                        <p key={`typewriter-${language}`} className="text-gray-400 leading-relaxed font-mono text-sm typewriter" style={{ direction: 'ltr' /* Force LTR animation logic but keep text alignment */ }}>
                            {isRTL ? t('notFound.coordinates') : t('notFound.coordinates')}
                        </p>
                        <p className="text-gray-500 leading-relaxed text-sm mt-2">
                            {t('notFound.void')}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/')}
                    className="btn-retro flex items-center gap-3 group mt-4 px-8 py-3 text-sm"
                >
                    {isRTL ? (
                        <>
                            <span>{t('notFound.return')}</span>
                            <span className="text-accent-primary group-hover:text-white transition-colors transform rotate-180">◀</span>
                        </>
                    ) : (
                        <>
                            <span className="text-accent-primary group-hover:text-white transition-colors">◀</span>
                            <span>{t('notFound.return')}</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default NotFound;
