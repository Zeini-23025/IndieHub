import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Game, Screenshot } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { BACKEND_URL, screenshotsAPI } from '../services/api';

interface GameSectionProps {
    title: string;
    description?: string;
    games: Game[];
    viewAllLink?: string;
    dir?: 'ltr' | 'rtl';
}

const GameSection: React.FC<GameSectionProps> = ({ title, description, games, viewAllLink, dir }) => {
    const { language, t } = useLanguage();
    const [hoveredGame, setHoveredGame] = useState<number | null>(null);
    const [gameScreenshots, setGameScreenshots] = useState<Record<number, Screenshot[]>>({});

    if (games.length === 0) return null;

    const getImageUrl = (path?: string) => {
        if (!path) return '';
        if (path.startsWith('http')) {
            try {
                const url = new URL(path);
                return `${BACKEND_URL}${url.pathname}`;
            } catch (e) {
                return path;
            }
        }
        return `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    const handleMouseEnter = async (gameId: number) => {
        setHoveredGame(gameId);
        if (!gameScreenshots[gameId]) {
            try {
                const screenshots = await screenshotsAPI.getScreenshots(gameId);
                setGameScreenshots(prev => ({ ...prev, [gameId]: screenshots }));
            } catch (e) {
                console.error('Error fetching screenshots:', e);
            }
        }
    };

    return (
        <section className="mb-16">
            <div className="flex justify-between items-end mb-6 px-2">
                <div className="space-y-1">
                    <h2 className="font-pixel-xl text-accent-primary-bright crt-glow">
                        {title}
                    </h2>
                    {description && (
                        <p className="text-text-muted text-[10px] font-pixel uppercase tracking-widest opacity-70">
                            {description}
                        </p>
                    )}
                </div>
                {viewAllLink && (
                    <Link
                        to={viewAllLink}
                        className="text-accent-primary hover:text-accent-primary-bright font-pixel text-[10px] transition-all"
                    >
                        {t('home.viewAll')} →
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6" dir={dir}>
                {games.map((game) => {
                    const gameTitle = language === 'ar' ? game.title_ar : game.title;
                    const gameDesc = language === 'ar' ? game.description_ar : game.description;
                    const screenshots = gameScreenshots[game.id] || [];
                    const previewScreenshots = screenshots.filter(s => !s.is_base).slice(0, 2);
                    const isHovered = hoveredGame === game.id;

                    return (
                        <div
                            key={game.id}
                            className="game-card pixel-border group relative"
                            onMouseEnter={() => handleMouseEnter(game.id)}
                            onMouseLeave={() => setHoveredGame(null)}
                        >
                            <Link to={`/games/${game.id}`} className="block">
                                <div className="relative aspect-[3/4] bg-bg-tertiary overflow-hidden">
                                    {game.base_screenshot ? (
                                        <img
                                            src={getImageUrl(game.base_screenshot)}
                                            alt={gameTitle}
                                            className="w-full h-full object-cover pixel-blur transition-transform duration-300 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-6xl text-text-muted opacity-30">🎮</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 bg-bg-secondary border-t-2 border-border-color">
                                    <h3 className="font-pixel text-xs text-text-primary line-clamp-2 mb-2">
                                        {gameTitle}
                                    </h3>
                                </div>
                            </Link>

                            {isHovered && (
                                <div className="absolute inset-0 bg-bg-primary/98 border border-accent-primary rounded z-10 p-4 flex flex-col backdrop-blur-sm">
                                    <h3 className="font-pixel text-xs text-accent-primary-bright mb-3">
                                        {gameTitle}
                                    </h3>
                                    <p className="text-[11px] text-text-primary mb-4 line-clamp-5 flex-1 leading-relaxed font-medium" dir={dir}>
                                        {gameDesc}
                                    </p>

                                    {previewScreenshots.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                            {previewScreenshots.map((screenshot) => (
                                                <img
                                                    key={screenshot.id}
                                                    src={getImageUrl(screenshot.image_path)}
                                                    alt="Preview"
                                                    className="w-full h-16 object-cover rounded border border-border-color"
                                                />
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {game.categories.slice(0, 2).map((cat) => (
                                            <span
                                                key={cat.id}
                                                className="px-1.5 py-0.5 bg-accent-primary/20 border border-accent-primary/30 rounded text-[8px] font-pixel text-accent-primary-bright"
                                            >
                                                {language === 'ar' ? cat.name_ar : cat.name}
                                            </span>
                                        ))}
                                    </div>

                                    <Link to={`/games/${game.id}`}>
                                        <button className="w-full btn-retro text-[10px] py-2">
                                            {t('game.viewDetails').toUpperCase()}
                                        </button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default GameSection;
