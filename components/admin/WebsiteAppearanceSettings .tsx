'use client';

import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

import {
  Save,
  Loader as Loader2,
  Monitor,
  MapPin,
  ExternalLink,
  Check,
  Plus,
  Trash2,
  Pencil,
  ChevronUp,
  ChevronDown,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';

import ImageUploader from '@/components/admin/ImageUploader';

/* =========================================================
   TYPES
========================================================= */

type WebsiteSettings = {
  id: string;

  footer_map_url: string | null;
  footer_map_title: string | null;
  footer_map_enabled: boolean;

  created_at: string;
  updated_at: string;
};

type HeroSlide = {
  id: string;
  image_url: string;

  badge: string | null;
  title: string | null;
  highlight: string | null;
  description: string | null;

  button_text: string | null;
  button_link: string | null;

  secondary_button_text: string | null;
  secondary_button_link: string | null;

  display_order: number;
  is_active: boolean;

  created_at: string;
  updated_at: string;
};

type HeroSlideForm = {
  image_url: string;

  badge: string;
  title: string;
  highlight: string;
  description: string;

  button_text: string;
  button_link: string;

  secondary_button_text: string;
  secondary_button_link: string;

  is_active: boolean;
};

/* =========================================================
   DEFAULT HERO SLIDE
========================================================= */

const DEFAULT_HERO_SLIDE: HeroSlideForm = {
  image_url: '',

  badge: 'Premium Quality Products',
  title: 'Discover the',
  highlight: 'Bharat Collection',
  description:
    'Curated products across electronics, home decor, fashion, and more. Quality you can trust, delivered to your door.',

  button_text: 'Shop Now',
  button_link: '/products',

  secondary_button_text: 'View Gallery',
  secondary_button_link: '/gallery',

  is_active: true,
};

/* =========================================================
   COMPONENT
========================================================= */

export default function WebsiteAppearanceSettings() {
  /* =======================================================
     WEBSITE SETTINGS
  ======================================================= */

  const [settings, setSettings] =
    useState<WebsiteSettings | null>(null);

  /* =======================================================
     HERO SLIDES
  ======================================================= */

  const [slides, setSlides] =
    useState<HeroSlide[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [savingFooter, setSavingFooter] =
    useState(false);

  const [savedFooter, setSavedFooter] =
    useState(false);

  const [savingSlide, setSavingSlide] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  /* =======================================================
     SLIDE MODAL
  ======================================================= */

  const [showSlideModal, setShowSlideModal] =
    useState(false);

  const [editingSlide, setEditingSlide] =
    useState<HeroSlide | null>(null);

  const [slideForm, setSlideForm] =
    useState<HeroSlideForm>(
      DEFAULT_HERO_SLIDE
    );

  /* =======================================================
     DELETE
  ======================================================= */

  const [deletingSlideId, setDeletingSlideId] =
    useState<string | null>(null);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const loadData = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      /* ================================================
         WEBSITE SETTINGS
      ================================================ */

      const {
        data: websiteData,
        error: websiteError,
      } = await supabase
        .from('website_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (websiteError) {
        console.error(
          'Website Settings Load Error:',
          websiteError
        );

        setErrorMessage(
          `Unable to load website settings: ${websiteError.message}`
        );

        setLoading(false);
        return;
      }

      setSettings(
        websiteData as WebsiteSettings | null
      );

      /* ================================================
         HERO SLIDES
      ================================================ */

      const {
        data: heroData,
        error: heroError,
      } = await supabase
        .from('website_hero_slides')
        .select('*')
        .order('display_order', {
          ascending: true,
        });

      if (heroError) {
        console.error(
          'Hero Slides Load Error:',
          heroError
        );

        setErrorMessage(
          `Unable to load hero slides: ${heroError.message}`
        );

        setLoading(false);
        return;
      }

      setSlides(
        (heroData || []) as HeroSlide[]
      );
    } catch (error) {
      console.error(
        'Website Appearance Load Error:',
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while loading website settings.'
      );
    }

    setLoading(false);
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadData();
  }, []);

  /* =======================================================
     FOOTER UPDATE
  ======================================================= */

  const updateFooter = <
    K extends keyof WebsiteSettings
  >(
    field: K,
    value: WebsiteSettings[K]
  ) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [field]: value,
    });
  };

  /* =======================================================
     SAVE FOOTER
  ======================================================= */

  const handleSaveFooter = async () => {
    if (!settings) return;

    setSavingFooter(true);
    setSavedFooter(false);
    setErrorMessage('');

    try {
      const {
        data,
        error,
      } = await supabase
        .from('website_settings')
        .update({
          footer_map_url:
            settings.footer_map_url?.trim() ||
            null,

          footer_map_title:
            settings.footer_map_title?.trim() ||
            'Find Us',

          footer_map_enabled:
            Boolean(
              settings.footer_map_enabled
            ),

          updated_at:
            new Date().toISOString(),
        })
        .eq('id', settings.id)
        .select()
        .single();

      if (error) {
        throw new Error(
          error.message
        );
      }

      if (data) {
        setSettings(
          data as WebsiteSettings
        );
      }

      setSavedFooter(true);

      setTimeout(() => {
        setSavedFooter(false);
      }, 3000);
    } catch (error) {
      console.error(
        'Footer Save Error:',
        error
      );

      setErrorMessage(
        error instanceof Error
          ? `Failed to save footer settings: ${error.message}`
          : 'Failed to save footer settings.'
      );
    } finally {
      setSavingFooter(false);
    }
  };

  /* =======================================================
     OPEN ADD SLIDE
  ======================================================= */

  const openAddSlide = () => {
    setEditingSlide(null);

    setSlideForm({
      ...DEFAULT_HERO_SLIDE,
    });

    setShowSlideModal(true);
    setErrorMessage('');
  };

  /* =======================================================
     OPEN EDIT SLIDE
  ======================================================= */

  const openEditSlide = (
    slide: HeroSlide
  ) => {
    setEditingSlide(slide);

    setSlideForm({
      image_url:
        slide.image_url || '',

      badge:
        slide.badge || '',

      title:
        slide.title || '',

      highlight:
        slide.highlight || '',

      description:
        slide.description || '',

      button_text:
        slide.button_text || '',

      button_link:
        slide.button_link || '',

      secondary_button_text:
        slide.secondary_button_text || '',

      secondary_button_link:
        slide.secondary_button_link || '',

      is_active:
        slide.is_active,
    });

    setShowSlideModal(true);
    setErrorMessage('');
  };

  /* =======================================================
     UPDATE SLIDE FORM
  ======================================================= */

  const updateSlideForm = <
    K extends keyof HeroSlideForm
  >(
    field: K,
    value: HeroSlideForm[K]
  ) => {
    setSlideForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* =======================================================
     IMAGE UPLOAD
  ======================================================= */

  const updateSlideImage = (
    urls: string[]
  ) => {
    updateSlideForm(
      'image_url',
      urls[0] || ''
    );
  };

  /* =======================================================
     SAVE HERO SLIDE
  ======================================================= */

  const handleSaveSlide = async () => {
    setSavingSlide(true);
    setErrorMessage('');

    try {
      if (!slideForm.image_url.trim()) {
        throw new Error(
          'Please upload a hero image.'
        );
      }

      /* ================================================
         EDIT EXISTING SLIDE
      ================================================ */

      if (editingSlide) {
        const {
          data,
          error,
        } = await supabase
          .from('website_hero_slides')
          .update({
            image_url:
              slideForm.image_url.trim(),

            badge:
              slideForm.badge.trim() ||
              null,

            title:
              slideForm.title.trim() ||
              null,

            highlight:
              slideForm.highlight.trim() ||
              null,

            description:
              slideForm.description.trim() ||
              null,

            button_text:
              slideForm.button_text.trim() ||
              null,

            button_link:
              slideForm.button_link.trim() ||
              null,

            secondary_button_text:
              slideForm.secondary_button_text.trim() ||
              null,

            secondary_button_link:
              slideForm.secondary_button_link.trim() ||
              null,

            is_active:
              slideForm.is_active,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            'id',
            editingSlide.id
          )
          .select()
          .single();

        if (error) {
          throw new Error(
            error.message
          );
        }

        setSlides((prev) =>
          prev
            .map((slide) =>
              slide.id === editingSlide.id
                ? (data as HeroSlide)
                : slide
            )
            .sort(
              (a, b) =>
                a.display_order -
                b.display_order
            )
        );
      }

      /* ================================================
         CREATE NEW SLIDE
      ================================================ */

      else {
        const nextOrder =
          slides.length > 0
            ? Math.max(
                ...slides.map(
                  (slide) =>
                    slide.display_order
                )
              ) + 1
            : 0;

        const {
          data,
          error,
        } = await supabase
          .from('website_hero_slides')
          .insert({
            image_url:
              slideForm.image_url.trim(),

            badge:
              slideForm.badge.trim() ||
              null,

            title:
              slideForm.title.trim() ||
              null,

            highlight:
              slideForm.highlight.trim() ||
              null,

            description:
              slideForm.description.trim() ||
              null,

            button_text:
              slideForm.button_text.trim() ||
              null,

            button_link:
              slideForm.button_link.trim() ||
              null,

            secondary_button_text:
              slideForm.secondary_button_text.trim() ||
              null,

            secondary_button_link:
              slideForm.secondary_button_link.trim() ||
              null,

            display_order:
              nextOrder,

            is_active:
              slideForm.is_active,
          })
          .select()
          .single();

        if (error) {
          throw new Error(
            error.message
          );
        }

        setSlides((prev) =>
          [
            ...prev,
            data as HeroSlide,
          ].sort(
            (a, b) =>
              a.display_order -
              b.display_order
          )
        );
      }

      setShowSlideModal(false);
      setEditingSlide(null);
      setSlideForm({
        ...DEFAULT_HERO_SLIDE,
      });
    } catch (error) {
      console.error(
        'Hero Slide Save Error:',
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to save hero slide.'
      );
    } finally {
      setSavingSlide(false);
    }
  };

  /* =======================================================
     DELETE SLIDE
  ======================================================= */

  const handleDeleteSlide = async (
    slide: HeroSlide
  ) => {
    const confirmed = window.confirm(
      'Delete this hero slide? This cannot be undone.'
    );

    if (!confirmed) return;

    setDeletingSlideId(slide.id);
    setErrorMessage('');

    try {
      const {
        error,
      } = await supabase
        .from('website_hero_slides')
        .delete()
        .eq('id', slide.id);

      if (error) {
        throw new Error(
          error.message
        );
      }

      const remaining =
        slides.filter(
          (item) =>
            item.id !== slide.id
        );

      /* ================================================
         REBUILD DISPLAY ORDER
      ================================================ */

      const reordered =
        remaining.map(
          (item, index) => ({
            ...item,
            display_order: index,
          })
        );

      setSlides(reordered);

      /* Update database order */

      for (
        const item of reordered
      ) {
        await supabase
          .from('website_hero_slides')
          .update({
            display_order:
              item.display_order,
          })
          .eq(
            'id',
            item.id
          );
      }
    } catch (error) {
      console.error(
        'Hero Slide Delete Error:',
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to delete hero slide.'
      );
    } finally {
      setDeletingSlideId(null);
    }
  };

  /* =======================================================
     MOVE SLIDE
  ======================================================= */

  const moveSlide = async (
    index: number,
    direction:
      | 'up'
      | 'down'
  ) => {
    const newIndex =
      direction === 'up'
        ? index - 1
        : index + 1;

    if (
      newIndex < 0 ||
      newIndex >= slides.length
    ) {
      return;
    }

    const reordered = [
      ...slides,
    ];

    const current =
      reordered[index];

    const target =
      reordered[newIndex];

    reordered[index] =
      target;

    reordered[newIndex] =
      current;

    const updated =
      reordered.map(
        (slide, position) => ({
          ...slide,
          display_order:
            position,
        })
      );

    setSlides(updated);

    try {
      for (
        const slide of updated
      ) {
        const { error } =
          await supabase
            .from(
              'website_hero_slides'
            )
            .update({
              display_order:
                slide.display_order,
            })
            .eq(
              'id',
              slide.id
            );

        if (error) {
          throw error;
        }
      }
    } catch (error) {
      console.error(
        'Hero Slide Reorder Error:',
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to reorder hero slides.'
      );

      await loadData();
    }
  };

  /* =======================================================
     TOGGLE SLIDE
  ======================================================= */

  const toggleSlide = async (
    slide: HeroSlide
  ) => {
    const newStatus =
      !slide.is_active;

    setSlides((prev) =>
      prev.map((item) =>
        item.id === slide.id
          ? {
              ...item,
              is_active:
                newStatus,
            }
          : item
      )
    );

    const {
      error,
    } = await supabase
      .from('website_hero_slides')
      .update({
        is_active:
          newStatus,
      })
      .eq(
        'id',
        slide.id
      );

    if (error) {
      console.error(
        'Hero Slide Toggle Error:',
        error
      );

      setErrorMessage(
        error.message
      );

      await loadData();
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-green-100 p-6 mb-6">

        <div className="flex items-center gap-3 mb-6">

          <div className="w-10 h-10 rounded-xl bg-green-100 animate-pulse" />

          <div className="space-y-2">

            <div className="h-5 w-48 bg-green-100 rounded animate-pulse" />

            <div className="h-3 w-72 bg-green-50 rounded animate-pulse" />

          </div>

        </div>

        <div className="space-y-4">

          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="h-20 bg-green-50 rounded-xl animate-pulse"
              />
            )
          )}

        </div>

      </div>
    );
  }

  /* =======================================================
     STYLES
  ======================================================= */

  const inputClass =
    'w-full mt-1.5 px-3 py-2.5 text-sm border border-green-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400';

  const labelClass =
    'text-xs font-medium text-green-600 uppercase tracking-wide';

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="space-y-6">

      {/* ===================================================
          ERROR
      =================================================== */}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-start justify-between gap-4">

          <span>
            {errorMessage}
          </span>

          <button
            type="button"
            onClick={() =>
              setErrorMessage('')
            }
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>

        </div>
      )}

      {/* ===================================================
          HERO SECTION
      =================================================== */}

      <div className="bg-white rounded-2xl border border-green-100 p-6">

        {/* HEADER */}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">

              <Monitor className="w-5 h-5 text-green-700" />

            </div>

            <div>

              <h2 className="font-display text-lg font-bold text-green-900">
                Hero Section
              </h2>

              <p className="text-xs text-gray-500 mt-1">
                Create multiple hero slides with different images and content.
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={openAddSlide}
            className="inline-flex items-center justify-center gap-2 bg-green-800 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >

            <Plus className="w-4 h-4" />

            Add Hero Slide

          </button>

        </div>

        {/* =================================================
            NO SLIDES
        ================================================= */}

        {slides.length === 0 ? (
          <div className="border-2 border-dashed border-green-200 rounded-2xl py-14 px-6 text-center bg-green-50/40">

            <Monitor className="w-10 h-10 text-green-300 mx-auto mb-3" />

            <h3 className="font-semibold text-green-900">
              No Hero Slides
            </h3>

            <p className="text-sm text-green-600 mt-1 mb-5">
              Add your first hero slide to display it on the homepage.
            </p>

            <button
              type="button"
              onClick={openAddSlide}
              className="inline-flex items-center gap-2 bg-green-800 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium"
            >

              <Plus className="w-4 h-4" />

              Add First Slide

            </button>

          </div>
        ) : (
          <div className="space-y-4">

            {slides.map(
              (
                slide,
                index
              ) => (
                <div
                  key={slide.id}
                  className={`border rounded-2xl overflow-hidden transition ${
                    slide.is_active
                      ? 'border-green-200 bg-white'
                      : 'border-gray-200 bg-gray-50 opacity-75'
                  }`}
                >

                  <div className="flex flex-col lg:flex-row">

                    {/* IMAGE */}

                    <div className="w-full lg:w-64 h-48 lg:h-auto shrink-0 bg-green-100">

                      {slide.image_url ? (
                        <img
                          src={
                            slide.image_url
                          }
                          alt={
                            slide.title ||
                            `Hero slide ${index + 1}`
                          }
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-green-400">
                          No Image
                        </div>
                      )}

                    </div>

                    {/* CONTENT */}

                    <div className="flex-1 p-5">

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <div className="flex flex-wrap items-center gap-2 mb-2">

                            <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                              Slide {index + 1}
                            </span>

                            {slide.is_active ? (
                              <span className="text-xs font-medium bg-green-100 text-green-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                Active
                              </span>
                            ) : (
                              <span className="text-xs font-medium bg-gray-200 text-gray-600 px-2.5 py-1 rounded-full flex items-center gap-1">
                                <EyeOff className="w-3 h-3" />
                                Hidden
                              </span>
                            )}

                          </div>

                          {slide.badge && (
                            <p className="text-xs font-medium text-green-600 mb-1">
                              {slide.badge}
                            </p>
                          )}

                          <h3 className="font-display text-xl font-bold text-green-900">

                            {slide.title ||
                              'Untitled'}

                            {slide.highlight && (
                              <>
                                {' '}
                                <span className="text-green-600">
                                  {slide.highlight}
                                </span>
                              </>
                            )}

                          </h3>

                          {slide.description && (
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                              {
                                slide.description
                              }
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2 mt-3">

                            {slide.button_text && (
                              <span className="text-xs bg-green-50 border border-green-100 text-green-700 px-2.5 py-1.5 rounded-lg">
                                {slide.button_text}
                              </span>
                            )}

                            {slide.secondary_button_text && (
                              <span className="text-xs bg-gray-50 border border-gray-100 text-gray-600 px-2.5 py-1.5 rounded-lg">
                                {
                                  slide.secondary_button_text
                                }
                              </span>
                            )}

                          </div>

                        </div>

                      </div>

                      {/* ACTIONS */}

                      <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-green-50">

                        {/* MOVE UP */}

                        <button
                          type="button"
                          disabled={
                            index === 0
                          }
                          onClick={() =>
                            moveSlide(
                              index,
                              'up'
                            )
                          }
                          className="w-9 h-9 flex items-center justify-center rounded-lg border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>

                        {/* MOVE DOWN */}

                        <button
                          type="button"
                          disabled={
                            index ===
                            slides.length - 1
                          }
                          onClick={() =>
                            moveSlide(
                              index,
                              'down'
                            )
                          }
                          className="w-9 h-9 flex items-center justify-center rounded-lg border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>

                        {/* TOGGLE */}

                        <button
                          type="button"
                          onClick={() =>
                            toggleSlide(
                              slide
                            )
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ${
                            slide.is_active
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'bg-green-50 text-green-700 hover:bg-green-100'
                          }`}
                        >

                          {slide.is_active ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              Activate
                            </>
                          )}

                        </button>

                        {/* EDIT */}

                        <button
                          type="button"
                          onClick={() =>
                            openEditSlide(
                              slide
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100"
                        >

                          <Pencil className="w-3.5 h-3.5" />

                          Edit

                        </button>

                        {/* DELETE */}

                        <button
                          type="button"
                          disabled={
                            deletingSlideId ===
                            slide.id
                          }
                          onClick={() =>
                            handleDeleteSlide(
                              slide
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 ml-auto"
                        >

                          {deletingSlideId ===
                          slide.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}

                          Delete

                        </button>

                      </div>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </div>

      {/* ===================================================
          FOOTER SETTINGS
      =================================================== */}

      <div className="bg-white rounded-2xl border border-green-100 p-6">

        <div className="flex items-start gap-3 mb-6">

          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">

            <MapPin className="w-5 h-5 text-green-700" />

          </div>

          <div>

            <h2 className="font-display text-lg font-bold text-green-900">
              Footer
            </h2>

            <p className="text-xs text-gray-500 mt-1">
              Manage the location map displayed in your website footer.
            </p>

          </div>

        </div>

        {settings ? (
          <>
            {/* SHOW MAP */}

            <div className="flex items-center justify-between gap-4 p-4 bg-green-50 rounded-xl border border-green-100 mb-5">

              <div>

                <p className="text-sm font-semibold text-green-900">
                  Show Location Map
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Display the map in the public website footer.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  updateFooter(
                    'footer_map_enabled',
                    !settings.footer_map_enabled
                  )
                }
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.footer_map_enabled
                    ? 'bg-green-700'
                    : 'bg-gray-300'
                }`}
                aria-label="Toggle footer map"
              >

                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    settings.footer_map_enabled
                      ? 'translate-x-7'
                      : 'translate-x-1'
                  }`}
                />

              </button>

            </div>

            {/* MAP TITLE */}

            <div className="mb-5">

              <label className={labelClass}>
                Map Title
              </label>

              <input
                className={inputClass}
                value={
                  settings.footer_map_title ||
                  ''
                }
                onChange={(e) =>
                  updateFooter(
                    'footer_map_title',
                    e.target.value
                  )
                }
                placeholder="Find Us"
              />

            </div>

            {/* MAP URL */}

            <div>

              <label className={labelClass}>
                Google Maps Embed URL
              </label>

              <div className="flex gap-2">

                <input
                  type="url"
                  className={inputClass}
                  value={
                    settings.footer_map_url ||
                    ''
                  }
                  onChange={(e) =>
                    updateFooter(
                      'footer_map_url',
                      e.target.value
                    )
                  }
                  placeholder="https://www.google.com/maps/embed?pb=..."
                />

                {settings.footer_map_url && (
                  <a
                    href={
                      settings.footer_map_url
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 w-11 h-[43px] shrink-0 flex items-center justify-center border border-green-200 text-green-700 rounded-xl hover:bg-green-50"
                    title="Open map URL"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

              </div>

              <p className="text-xs text-gray-400 mt-2">
                Google Maps → Share → Embed a map → Copy the URL from the iframe src.
              </p>

            </div>

            {/* MAP PREVIEW */}

            {settings.footer_map_url && (
              <div className="mt-5">

                <p className={labelClass}>
                  Map Preview
                </p>

                <div className="mt-2 rounded-xl overflow-hidden border border-green-100 bg-green-50">

                  <iframe
                    src={
                      settings.footer_map_url
                    }
                    title={
                      settings.footer_map_title ||
                      'Company Location'
                    }
                    className="w-full h-64 border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />

                </div>

              </div>
            )}

            {/* SAVE FOOTER */}

            <div className="flex items-center gap-4 mt-6">

              <button
                type="button"
                onClick={
                  handleSaveFooter
                }
                disabled={
                  savingFooter
                }
                className="flex items-center gap-2 bg-green-800 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors shadow-sm disabled:opacity-50"
              >

                {savingFooter ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}

                {savingFooter
                  ? 'Saving...'
                  : 'Save Footer Settings'}

              </button>

              {savedFooter && (
                <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">

                  <Check className="w-4 h-4" />

                  Footer settings saved!

                </span>
              )}

            </div>

          </>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            Website settings record was not found.
          </div>
        )}

      </div>

      {/* ===================================================
          HERO SLIDE MODAL
      =================================================== */}

      {showSlideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">

          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between px-6 py-4 border-b border-green-100 shrink-0">

              <div>

                <h3 className="font-display text-xl font-bold text-green-900">

                  {editingSlide
                    ? 'Edit Hero Slide'
                    : 'Add Hero Slide'}

                </h3>

                <p className="text-xs text-gray-500 mt-1">
                  Every slide can have its own image and content.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowSlideModal(false)
                }
                className="p-2 hover:bg-green-50 rounded-lg"
              >
                <X className="w-5 h-5 text-green-600" />
              </button>

            </div>

            {/* MODAL BODY */}

            <div className="overflow-y-auto px-6 py-5 space-y-6">

              {/* IMAGE */}

              <div>

                <ImageUploader
                  value={
                    slideForm.image_url
                      ? [
                          slideForm.image_url,
                        ]
                      : []
                  }
                  onChange={
                    updateSlideImage
                  }
                  folder="website/hero"
                  max={1}
                  label="Hero Image"
                  bucket="companyassets"
                />

                <p className="text-xs text-gray-400 mt-2">
                  Recommended: wide landscape image suitable for a hero banner.
                </p>

              </div>

              {/* TEXT */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                {/* BADGE */}

                <div className="sm:col-span-2">

                  <label className={labelClass}>
                    Badge
                  </label>

                  <input
                    className={inputClass}
                    value={
                      slideForm.badge
                    }
                    onChange={(e) =>
                      updateSlideForm(
                        'badge',
                        e.target.value
                      )
                    }
                    placeholder="Premium Quality Products"
                  />

                </div>

                {/* TITLE */}

                <div>

                  <label className={labelClass}>
                    Title
                  </label>

                  <input
                    className={inputClass}
                    value={
                      slideForm.title
                    }
                    onChange={(e) =>
                      updateSlideForm(
                        'title',
                        e.target.value
                      )
                    }
                    placeholder="Discover the"
                  />

                </div>

                {/* HIGHLIGHT */}

                <div>

                  <label className={labelClass}>
                    Highlight
                  </label>

                  <input
                    className={inputClass}
                    value={
                      slideForm.highlight
                    }
                    onChange={(e) =>
                      updateSlideForm(
                        'highlight',
                        e.target.value
                      )
                    }
                    placeholder="Bharat Collection"
                  />

                </div>

                {/* DESCRIPTION */}

                <div className="sm:col-span-2">

                  <label className={labelClass}>
                    Description
                  </label>

                  <textarea
                    className={inputClass}
                    rows={4}
                    value={
                      slideForm.description
                    }
                    onChange={(e) =>
                      updateSlideForm(
                        'description',
                        e.target.value
                      )
                    }
                    placeholder="Write a short description for this slide..."
                  />

                </div>

                {/* PRIMARY BUTTON */}

                <div>

                  <label className={labelClass}>
                    Primary Button Text
                  </label>

                  <input
                    className={inputClass}
                    value={
                      slideForm.button_text
                    }
                    onChange={(e) =>
                      updateSlideForm(
                        'button_text',
                        e.target.value
                      )
                    }
                    placeholder="Shop Now"
                  />

                </div>

                {/* PRIMARY LINK */}

                <div>

                  <label className={labelClass}>
                    Primary Button Link
                  </label>

                  <input
                    className={inputClass}
                    value={
                      slideForm.button_link
                    }
                    onChange={(e) =>
                      updateSlideForm(
                        'button_link',
                        e.target.value
                      )
                    }
                    placeholder="/products"
                  />

                </div>

                {/* SECONDARY BUTTON */}

                <div>

                  <label className={labelClass}>
                    Secondary Button Text
                  </label>

                  <input
                    className={inputClass}
                    value={
                      slideForm.secondary_button_text
                    }
                    onChange={(e) =>
                      updateSlideForm(
                        'secondary_button_text',
                        e.target.value
                      )
                    }
                    placeholder="View Gallery"
                  />

                </div>

                {/* SECONDARY LINK */}

                <div>

                  <label className={labelClass}>
                    Secondary Button Link
                  </label>

                  <input
                    className={inputClass}
                    value={
                      slideForm.secondary_button_link
                    }
                    onChange={(e) =>
                      updateSlideForm(
                        'secondary_button_link',
                        e.target.value
                      )
                    }
                    placeholder="/gallery"
                  />

                </div>

              </div>

              {/* ACTIVE */}

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">

                <div>

                  <p className="text-sm font-semibold text-green-900">
                    Show this slide
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Inactive slides will not appear on the homepage.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    updateSlideForm(
                      'is_active',
                      !slideForm.is_active
                    )
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    slideForm.is_active
                      ? 'bg-green-700'
                      : 'bg-gray-300'
                  }`}
                >

                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      slideForm.is_active
                        ? 'translate-x-7'
                        : 'translate-x-1'
                    }`}
                  />

                </button>

              </div>

            </div>

            {/* MODAL FOOTER */}

            <div className="px-6 py-4 border-t border-green-100 flex gap-3 shrink-0">

              <button
                type="button"
                onClick={() =>
                  setShowSlideModal(false)
                }
                className="flex-1 px-4 py-2.5 border border-green-200 text-green-700 rounded-xl text-sm font-medium hover:bg-green-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleSaveSlide
                }
                disabled={
                  savingSlide
                }
                className="flex-1 px-4 py-2.5 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-600 flex items-center justify-center gap-2 disabled:opacity-50"
              >

                {savingSlide ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}

                {savingSlide
                  ? 'Saving...'
                  : editingSlide
                  ? 'Update Slide'
                  : 'Add Slide'}

              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
