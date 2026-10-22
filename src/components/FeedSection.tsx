import React, { useState } from 'react';
import { ProductItem } from '../types';
import { Rss, Search, ExternalLink, Sparkles, Send, Filter, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface FeedSectionProps {
  products: ProductItem[];
  feedUrl: string;
  setFeedUrl: (url: string) => void;
  onRefreshFeed: () => void;
  isLoading: boolean;
  onSelectProduct: (product: ProductItem) => void;
  selectedProduct: ProductItem | null;
  publishedProductIds: Set<string>;
  onDirectPublish: (product: ProductItem) => void;
  isPublishingId: string | null;
}

export const FeedSection: React.FC<FeedSectionProps> = ({
  products,
  feedUrl,
  setFeedUrl,
  onRefreshFeed,
  isLoading,
  onSelectProduct,
  selectedProduct,
  publishedProductIds,
  onDirectPublish,
  isPublishingId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean) as string[])
  );

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Feed Source Controller */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Rss className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">XML / RSS Affiliate Product Feed</h2>
            </div>
            <p className="text-xs text-slate-400">
              Parses e-commerce feeds (2Performant, Profitshare, Google Merchant XML, RSS 2.0) into Telegram-ready deal units.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFeedUrl('');
                onRefreshFeed();
              }}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition"
            >
              Demo Deals Feed
            </button>
            <button
              type="button"
              onClick={() => {
                setFeedUrl('https://raw.githubusercontent.com/bughy29-sketch/telegram-affiliate/main/sample_feed.xml');
              }}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition"
            >
              Sample XML Feed
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onRefreshFeed();
          }}
          className="mt-4 flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
              placeholder="Enter product XML/RSS feed URL (e.g. https://domain.com/feed.xml or leave blank for demo)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs px-5 py-2.5 rounded-xl transition shadow disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Preluare produse...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Fetch Feed</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deals by title or specs..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <button
            onClick={() => setSelectedCategory('all')}
            className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-slate-700 text-white font-medium'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Categories ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-slate-700 text-white font-medium'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">Niciun produs găsit</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Verifică linkul XML furnizat sau resetează căutarea. Poți comuta oricând pe produsele demonstrative.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const isSelected = selectedProduct?.id === product.id;
            const isPublished = publishedProductIds.has(product.id);
            const isPublishing = isPublishingId === product.id;

            return (
              <div
                key={product.id}
                className={`flex flex-col bg-slate-900 border rounded-2xl overflow-hidden transition-all group ${
                  isSelected
                    ? 'border-sky-500 ring-1 ring-sky-500/50 shadow-lg shadow-sky-500/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Product Image & Badges */}
                <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.category && (
                    <span className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur text-[11px] font-medium text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700/50">
                      {product.category}
                    </span>
                  )}
                  {product.price && (
                    <span className="absolute top-2.5 right-2.5 bg-emerald-600 text-[11px] font-bold text-white px-2.5 py-0.5 rounded-full shadow">
                      {product.price}
                    </span>
                  )}

                  {isPublished && (
                    <div className="absolute bottom-2.5 left-2.5 bg-sky-950/90 border border-sky-500/40 text-sky-400 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Published to Telegram
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-100 line-clamp-2 leading-snug">
                      {product.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <a
                      href={product.affiliate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-sky-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                      title="Vizitează linkul de afiliat direct"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectProduct(product)}
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                          isSelected
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>AI Compose</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDirectPublish(product)}
                        disabled={isPublishing}
                        className="flex items-center gap-1 text-xs font-medium bg-emerald-600/90 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                        title="Generează automat copy și trimite pe Telegram"
                      >
                        {isPublishing ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        <span>Quick Post</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
