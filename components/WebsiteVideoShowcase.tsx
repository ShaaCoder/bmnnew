'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import {
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Play,
} from 'lucide-react';

type VideoProduct = {
  id: string;
  name: string;
  slug?: string | null;
  image?: string | null;
};

export type WebsiteVideoItem = {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  title: string;
  description: string | null;
  product_id: string | null;
  button_text: string;
  display_order: number;
  is_active: boolean;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  products?: VideoProduct | null;
};

type Props = {
  videos: WebsiteVideoItem[];
};

export default function WebsiteVideoShowcase({
  videos,
}: Props) {
  const containerRef =
    useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] =
    useState(0);

  const [playing, setPlaying] =
    useState<Record<string, boolean>>({});

  const activeVideos =
    videos.filter(
      (video) => video.is_active
    );

  if (activeVideos.length === 0) {
    return null;
  }

  /* =====================================================
     SCROLL
  ===================================================== */

  const scroll = (
    direction: 'left' | 'right'
  ) => {
    const container =
      containerRef.current;

    if (!container) return;

    const amount =
      container.clientWidth *
      0.85;

    container.scrollBy({
      left:
        direction === 'right'
          ? amount
          : -amount,
      behavior: 'smooth',
    });
  };

  /* =====================================================
     UPDATE DOT
  ===================================================== */

  useEffect(() => {
    const container =
      containerRef.current;

    if (!container) return;

    const handleScroll = () => {
      const cards =
        container.querySelectorAll(
          '[data-video-card]'
        );

      if (!cards.length) return;

      let closestIndex = 0;
      let closestDistance =
        Infinity;

      cards.forEach(
        (card, index) => {
          const rect =
            card.getBoundingClientRect();

          const containerRect =
            container.getBoundingClientRect();

          const distance =
            Math.abs(
              rect.left -
                containerRect.left
            );

          if (
            distance <
            closestDistance
          ) {
            closestDistance =
              distance;

            closestIndex =
              index;
          }
        }
      );

      setActiveIndex(
        closestIndex
      );
    };

    container.addEventListener(
      'scroll',
      handleScroll,
      { passive: true }
    );

    return () => {
      container.removeEventListener(
        'scroll',
        handleScroll
      );
    };
  }, []);

  /* =====================================================
     PLAY STATE
  ===================================================== */

  const handlePlay = (
    id: string
  ) => {
    setPlaying((prev) => ({
      ...prev,
      [id]: true,
    }));
  };

  return (
    <section className="py-16 bg-white">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-end justify-between mb-8">

          <div>

            <p className="text-green-600 font-medium text-sm tracking-widest uppercase mb-2">
              See It In Action
            </p>

            <h2 className="font-display text-3xl md:text-4xl font-bold text-green-900">
              Customer Favorites
            </h2>

            <p className="text-sm text-green-600 mt-2">
              Discover our products through real videos.
            </p>

          </div>

          {/* DESKTOP ARROWS */}

          {activeVideos.length > 1 && (
            <div className="hidden md:flex items-center gap-2">

              <button
                type="button"
                onClick={() =>
                  scroll('left')
                }
                className="w-10 h-10 rounded-full border border-green-200 text-green-700 hover:bg-green-50 flex items-center justify-center transition"
                aria-label="Previous videos"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() =>
                  scroll('right')
                }
                className="w-10 h-10 rounded-full border border-green-200 text-green-700 hover:bg-green-50 flex items-center justify-center transition"
                aria-label="Next videos"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

            </div>
          )}

        </div>

        {/* =================================================
            VIDEO CARDS
        ================================================= */}

        <div
          ref={containerRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
          style={{
            scrollbarWidth: 'none',
          }}
        >

          {activeVideos.map(
            (video) => (
              <VideoCard
                key={video.id}
                video={video}
                playing={
                  playing[video.id] ||
                  false
                }
                onPlay={() =>
                  handlePlay(
                    video.id
                  )
                }
              />
            )
          )}

        </div>

        {/* =================================================
            DOTS
        ================================================= */}

        {activeVideos.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">

            {activeVideos.map(
              (video, index) => (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => {
                    const container =
                      containerRef.current;

                    const cards =
                      container?.querySelectorAll(
                        '[data-video-card]'
                      );

                    const card =
                      cards?.[index];

                    if (card) {
                      card.scrollIntoView(
                        {
                          behavior:
                            'smooth',
                          block:
                            'nearest',
                          inline:
                            'start',
                        }
                      );
                    }
                  }}
                  className={`h-2 rounded-full transition-all ${
                    index ===
                    activeIndex
                      ? 'w-7 bg-green-600'
                      : 'w-2 bg-gray-300'
                  }`}
                  aria-label={`Go to video ${
                    index + 1
                  }`}
                />
              )
            )}

          </div>
        )}

      </div>

    </section>
  );
}

/* =========================================================
   VIDEO CARD
========================================================= */

function VideoCard({
  video,
  playing,
  onPlay,
}: {
  video: WebsiteVideoItem;
  playing: boolean;
  onPlay: () => void;
}) {
  const videoRef =
    useRef<HTMLVideoElement>(null);

  const [error, setError] =
    useState(false);

  useEffect(() => {
    const element =
      videoRef.current;

    if (!element) return;

    if (video.autoplay) {
      const promise =
        element.play();

      if (
        promise &&
        typeof promise.catch ===
          'function'
      ) {
        promise.catch(() => {
          // Browser may block autoplay.
        });
      }
    }
  }, [video.autoplay]);

  const handlePlay = () => {
    onPlay();

    const element =
      videoRef.current;

    if (!element) return;

    element.play().catch(() => {});
  };

  const productHref =
    video.products?.slug
      ? `/products/${video.products.slug}`
      : video.product_id
        ? `/products/${video.product_id}`
        : null;

  return (
    <div
      data-video-card
      className="snap-start shrink-0 w-[82vw] sm:w-[300px] md:w-[280px] lg:w-[265px]"
    >

      <div className="relative aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-md group">

        {/* =================================================
            VIDEO
        ================================================= */}

        {!error ? (
          <video
            ref={videoRef}
            src={video.video_url}
            poster={
              video.thumbnail_url ||
              undefined
            }
            autoPlay={
              video.autoplay
            }
            muted={
              video.muted
            }
            loop={
              video.loop
            }
            playsInline
            preload="metadata"
            onError={() =>
              setError(true)
            }
            onPlay={onPlay}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 bg-green-950 bg-cover bg-center"
            style={{
              backgroundImage:
                video.thumbnail_url
                  ? `url("${video.thumbnail_url}")`
                  : undefined,
            }}
          />
        )}

        {/* =================================================
            PLAY BUTTON
        ================================================= */}

        {!playing &&
          !video.autoplay && (
            <button
              type="button"
              onClick={
                handlePlay
              }
              className="absolute inset-0 z-10 flex items-center justify-center"
              aria-label="Play video"
            >
              <span className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white">
                <Play className="w-6 h-6 fill-white ml-1" />
              </span>
            </button>
          )}

        {/* =================================================
            GRADIENT
        ================================================= */}

        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />

        {/* =================================================
            PRODUCT IMAGE
        ================================================= */}

        {video.products?.image && (
          <div className="absolute left-3 bottom-16 w-12 h-12 rounded-lg bg-white overflow-hidden shadow-lg border border-white/50">

            <img
              src={
                video.products.image
              }
              alt={
                video.products.name
              }
              className="w-full h-full object-cover"
            />

          </div>
        )}

        {/* =================================================
            TITLE
        ================================================= */}

        <div
          className={`absolute left-3 right-3 bottom-14 ${
            video.products?.image
              ? 'pl-14'
              : ''
          }`}
        >

          <h3 className="text-white font-bold text-sm md:text-base leading-tight line-clamp-3 drop-shadow-md">
            {video.title}
          </h3>

          {video.description && (
            <p className="text-white/80 text-xs mt-1 line-clamp-2">
              {video.description}
            </p>
          )}

        </div>

        {/* =================================================
            PRODUCT BUTTON
        ================================================= */}

        {video.product_id &&
        productHref ? (
          <Link
            href={productHref}
            className="absolute bottom-3 left-3 right-3 h-10 bg-white text-green-900 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold hover:bg-green-50 transition"
          >
            <ShoppingBag className="w-4 h-4" />

            {video.button_text ||
              'Add To Cart'}
          </Link>
        ) : (
          <div className="absolute bottom-3 left-3 right-3 h-10 bg-white/95 text-green-900 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold">
            <ShoppingBag className="w-4 h-4" />

            {video.button_text ||
              'View Product'}
          </div>
        )}

      </div>

    </div>
  );
}