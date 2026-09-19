'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

import {
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
  Video,
  Eye,
  EyeOff,
  Loader as Loader2,
  Upload,
  ExternalLink,
} from 'lucide-react';

type Product = {
  id: string;
  name: string;
  slug?: string | null;
};

type WebsiteVideo = {
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
  created_at: string;
  updated_at: string;
  products?: Product | null;
};

type VideoForm = {
  video_url: string;
  thumbnail_url: string;
  title: string;
  description: string;
  product_id: string;
  button_text: string;
  display_order: number;
  is_active: boolean;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
};

const EMPTY_FORM: VideoForm = {
  video_url: '',
  thumbnail_url: '',
  title: '',
  description: '',
  product_id: '',
  button_text: 'Add To Cart',
  display_order: 0,
  is_active: true,
  autoplay: true,
  muted: true,
  loop: true,
};

export default function WebsiteVideoSettings() {
  const [videos, setVideos] = useState<WebsiteVideo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] =
    useState<WebsiteVideo | null>(null);

  const [form, setForm] =
    useState<VideoForm>(EMPTY_FORM);

  const [videoFile, setVideoFile] =
    useState<File | null>(null);

  const [thumbnailFile, setThumbnailFile] =
    useState<File | null>(null);

  const [videoPreview, setVideoPreview] =
    useState<string | null>(null);

  const [thumbnailPreview, setThumbnailPreview] =
    useState<string | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const loadVideos = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('website_videos')
        .select(`
          *,
          products (
            id,
            name,
            slug
          )
        `)
        .order('display_order', {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      setVideos(
        (data || []) as WebsiteVideo[]
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load videos.'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id,name,slug')
      .order('name', {
        ascending: true,
      });

    if (!error) {
      setProducts(
        (data || []) as Product[]
      );
    }
  };

  useEffect(() => {
    loadVideos();
    loadProducts();
  }, []);

  /* =========================================================
     OPEN ADD MODAL
  ========================================================= */

  const openAdd = () => {
    setEditing(null);

    setForm({
      ...EMPTY_FORM,
      display_order:
        videos.length > 0
          ? Math.max(
              ...videos.map(
                (v) => v.display_order
              )
            ) + 1
          : 0,
    });

    setVideoFile(null);
    setThumbnailFile(null);

    setVideoPreview(null);
    setThumbnailPreview(null);

    setError('');
    setSuccess('');

    setShowModal(true);
  };

  /* =========================================================
     OPEN EDIT MODAL
  ========================================================= */

  const openEdit = (
    video: WebsiteVideo
  ) => {
    setEditing(video);

    setForm({
      video_url:
        video.video_url || '',

      thumbnail_url:
        video.thumbnail_url || '',

      title:
        video.title || '',

      description:
        video.description || '',

      product_id:
        video.product_id || '',

      button_text:
        video.button_text || 'Add To Cart',

      display_order:
        video.display_order || 0,

      is_active:
        video.is_active,

      autoplay:
        video.autoplay,

      muted:
        video.muted,

      loop:
        video.loop,
    });

    setVideoFile(null);
    setThumbnailFile(null);

    setVideoPreview(
      video.video_url || null
    );

    setThumbnailPreview(
      video.thumbnail_url || null
    );

    setError('');
    setSuccess('');

    setShowModal(true);
  };

  /* =========================================================
     UPDATE FORM
  ========================================================= */

  const updateForm = <
    K extends keyof VideoForm
  >(
    field: K,
    value: VideoForm[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* =========================================================
     VIDEO FILE
  ========================================================= */

  const handleVideoFile = (
    file: File | null
  ) => {
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setError(
        'Please select a valid video file.'
      );
      return;
    }

    /*
      100 MB frontend check.
      Supabase bucket must also allow the
      selected file size.
    */

    if (file.size > 100 * 1024 * 1024) {
      setError(
        'Video must be smaller than 100 MB.'
      );
      return;
    }

    setError('');
    setVideoFile(file);

    const url =
      URL.createObjectURL(file);

    setVideoPreview(url);
  };

  /* =========================================================
     THUMBNAIL FILE
  ========================================================= */

  const handleThumbnailFile = (
    file: File | null
  ) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(
        'Please select a valid image.'
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        'Thumbnail must be smaller than 5 MB.'
      );
      return;
    }

    setError('');
    setThumbnailFile(file);

    const url =
      URL.createObjectURL(file);

    setThumbnailPreview(url);
  };

  /* =========================================================
     UPLOAD FILE
  ========================================================= */

  const uploadFile = async (
    file: File,
    folder: string
  ) => {
    const extension =
      file.name.split('.').pop() ||
      'bin';

    const filename =
      `${folder}-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 10)}.${extension}`;

    const path =
      `website/${filename}`;

    const { error } =
      await supabase.storage
        .from('website-videos')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

    if (error) {
      throw error;
    }

    const {
      data: publicData,
    } = supabase.storage
      .from('website-videos')
      .getPublicUrl(path);

    return publicData.publicUrl;
  };

  /* =========================================================
     SAVE
  ========================================================= */

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!form.title.trim()) {
      setError(
        'Please enter a video title.'
      );
      return;
    }

    if (
      !editing &&
      !videoFile &&
      !form.video_url
    ) {
      setError(
        'Please upload a video.'
      );
      return;
    }

    setSaving(true);

    try {
      let videoUrl =
        form.video_url.trim() || null;

      let thumbnailUrl =
        form.thumbnail_url.trim() || null;

      /* ===============================================
         UPLOAD VIDEO
      =============================================== */

      if (videoFile) {
        videoUrl = await uploadFile(
          videoFile,
          'video'
        );
      }

      /* ===============================================
         UPLOAD THUMBNAIL
      =============================================== */

      if (thumbnailFile) {
        thumbnailUrl =
          await uploadFile(
            thumbnailFile,
            'thumbnail'
          );
      }

      if (!videoUrl) {
        throw new Error(
          'Video URL is missing.'
        );
      }

      /* ===============================================
         UPDATE
      =============================================== */

      if (editing) {
        const { error } =
          await supabase
            .from('website_videos')
            .update({
              video_url:
                videoUrl,

              thumbnail_url:
                thumbnailUrl,

              title:
                form.title.trim(),

              description:
                form.description.trim() ||
                null,

              product_id:
                form.product_id || null,

              button_text:
                form.button_text.trim() ||
                'Add To Cart',

              display_order:
                Number(
                  form.display_order
                ),

              is_active:
                form.is_active,

              autoplay:
                form.autoplay,

              muted:
                form.muted,

              loop:
                form.loop,

              updated_at:
                new Date().toISOString(),
            })
            .eq(
              'id',
              editing.id
            );

        if (error) {
          throw error;
        }

        setSuccess(
          'Video updated successfully.'
        );
      }

      /* ===============================================
         INSERT
      =============================================== */

      else {
        const { error } =
          await supabase
            .from('website_videos')
            .insert({
              video_url:
                videoUrl,

              thumbnail_url:
                thumbnailUrl,

              title:
                form.title.trim(),

              description:
                form.description.trim() ||
                null,

              product_id:
                form.product_id || null,

              button_text:
                form.button_text.trim() ||
                'Add To Cart',

              display_order:
                Number(
                  form.display_order
                ),

              is_active:
                form.is_active,

              autoplay:
                form.autoplay,

              muted:
                form.muted,

              loop:
                form.loop,
            });

        if (error) {
          throw error;
        }

        setSuccess(
          'Video added successfully.'
        );
      }

      await loadVideos();

      setTimeout(() => {
        setShowModal(false);
        setSuccess('');
      }, 700);
    } catch (err) {
      console.error(
        'Website Video Save Error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save video.'
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = async (
    video: WebsiteVideo
  ) => {
    const confirmed =
      window.confirm(
        `Delete "${video.title}"?`
      );

    if (!confirmed) return;

    setError('');

    try {
      const { error } =
        await supabase
          .from('website_videos')
          .delete()
          .eq(
            'id',
            video.id
          );

      if (error) {
        throw error;
      }

      await loadVideos();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete video.'
      );
    }
  };

  /* =========================================================
     TOGGLE ACTIVE
  ========================================================= */

  const toggleActive = async (
    video: WebsiteVideo
  ) => {
    const { error } =
      await supabase
        .from('website_videos')
        .update({
          is_active:
            !video.is_active,
        })
        .eq(
          'id',
          video.id
        );

    if (error) {
      setError(error.message);
      return;
    }

    setVideos((prev) =>
      prev.map((item) =>
        item.id === video.id
          ? {
              ...item,
              is_active:
                !item.is_active,
            }
          : item
      )
    );
  };

  /* =========================================================
     MOVE ORDER
  ========================================================= */

  const moveVideo = async (
    index: number,
    direction: 'up' | 'down'
  ) => {
    const newIndex =
      direction === 'up'
        ? index - 1
        : index + 1;

    if (
      newIndex < 0 ||
      newIndex >= videos.length
    ) {
      return;
    }

    const current =
      videos[index];

    const target =
      videos[newIndex];

    try {
      await supabase
        .from('website_videos')
        .update({
          display_order:
            target.display_order,
        })
        .eq(
          'id',
          current.id
        );

      await supabase
        .from('website_videos')
        .update({
          display_order:
            current.display_order,
        })
        .eq(
          'id',
          target.id
        );

      await loadVideos();
    } catch (err) {
      console.error(err);
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-green-100 p-6">

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-xl animate-pulse" />

          <div>
            <div className="h-5 w-48 bg-green-100 rounded animate-pulse" />
            <div className="h-3 w-64 bg-green-50 rounded mt-2 animate-pulse" />
          </div>
        </div>

        <div className="space-y-4">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-32 bg-green-50 rounded-xl animate-pulse"
            />
          ))}
        </div>

      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <>
      <div className="bg-white rounded-2xl border border-green-100 p-6">

        {/* HEADER */}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Video className="w-5 h-5 text-green-700" />
            </div>

            <div>
              <h2 className="font-display text-lg font-bold text-green-900">
                Video Showcase
              </h2>

              <p className="text-xs text-gray-500 mt-1">
                Add product videos to your homepage.
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={openAdd}
            className="flex items-center justify-center gap-2 bg-green-800 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Video
          </button>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* EMPTY */}

        {videos.length === 0 ? (
          <div className="border-2 border-dashed border-green-200 rounded-2xl py-16 text-center bg-green-50/30">

            <Video className="w-12 h-12 text-green-300 mx-auto mb-4" />

            <h3 className="font-display font-bold text-green-900">
              No Videos
            </h3>

            <p className="text-sm text-green-600 mt-1 mb-5">
              Add your first product video.
            </p>

            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center gap-2 bg-green-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add First Video
            </button>

          </div>
        ) : (
          <div className="space-y-4">

            {videos.map(
              (video, index) => (
                <div
                  key={video.id}
                  className={`border rounded-2xl p-4 transition ${
                    video.is_active
                      ? 'border-green-100 bg-white'
                      : 'border-gray-200 bg-gray-50 opacity-70'
                  }`}
                >

                  <div className="flex flex-col md:flex-row gap-4">

                    {/* VIDEO */}

                    <div className="w-full md:w-48 h-64 md:h-32 bg-black rounded-xl overflow-hidden shrink-0 relative">

                      <video
                        src={
                          video.video_url
                        }
                        poster={
                          video.thumbnail_url ||
                          undefined
                        }
                        muted
                        playsInline
                        loop
                        className="w-full h-full object-cover"
                      />

                      {!video.is_active && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            Inactive
                          </span>
                        </div>
                      )}

                    </div>

                    {/* INFORMATION */}

                    <div className="flex-1 min-w-0">

                      <div className="flex items-start justify-between gap-3">

                        <div>
                          <h3 className="font-semibold text-green-900">
                            {video.title}
                          </h3>

                          {video.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {video.description}
                            </p>
                          )}

                          {video.products && (
                            <p className="text-xs text-green-600 mt-2">
                              Product:{' '}
                              <span className="font-medium">
                                {
                                  video.products.name
                                }
                              </span>
                            </p>
                          )}

                        </div>

                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg shrink-0">
                          #{index + 1}
                        </span>

                      </div>

                      {/* ACTIONS */}

                      <div className="flex flex-wrap items-center gap-2 mt-5">

                        <button
                          type="button"
                          onClick={() =>
                            toggleActive(
                              video
                            )
                          }
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                            video.is_active
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {video.is_active ? (
                            <Eye className="w-3.5 h-3.5" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}

                          {video.is_active
                            ? 'Active'
                            : 'Inactive'}
                        </button>

                        <button
                          type="button"
                          disabled={
                            index === 0
                          }
                          onClick={() =>
                            moveVideo(
                              index,
                              'up'
                            )
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 disabled:opacity-30"
                          title="Move up"
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          disabled={
                            index ===
                            videos.length - 1
                          }
                          onClick={() =>
                            moveVideo(
                              index,
                              'down'
                            )
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 disabled:opacity-30"
                          title="Move down"
                        >
                          ↓
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEdit(
                              video
                            )
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              video
                            )
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>

                        <a
                          href={
                            video.video_url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 text-xs font-medium"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open
                        </a>

                      </div>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </div>

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-6 py-4 border-b border-green-100">

              <div>
                <h3 className="font-display text-xl font-bold text-green-900">
                  {editing
                    ? 'Edit Video'
                    : 'Add Video'}
                </h3>

                <p className="text-xs text-gray-500 mt-1">
                  Configure the homepage product video.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowModal(false)
                }
                className="p-2 rounded-lg hover:bg-green-50"
              >
                <X className="w-5 h-5 text-green-700" />
              </button>

            </div>

            <div className="p-6 space-y-5">

              {/* ERROR */}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              {/* VIDEO UPLOAD */}

              <div>

                <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
                  Video
                </label>

                <label className="mt-2 border-2 border-dashed border-green-200 rounded-xl min-h-40 flex flex-col items-center justify-center cursor-pointer hover:bg-green-50/50 transition overflow-hidden">

                  {videoPreview ? (
                    <video
                      src={
                        videoPreview
                      }
                      muted
                      controls
                      playsInline
                      className="w-full max-h-64 object-contain bg-black"
                    />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-green-400 mb-2" />

                      <span className="text-sm font-medium text-green-700">
                        Upload Video
                      </span>

                      <span className="text-xs text-gray-400 mt-1">
                        MP4, WebM or MOV · max 100 MB
                      </span>
                    </>
                  )}

                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={(e) =>
                      handleVideoFile(
                        e.target.files?.[0] ||
                          null
                      )
                    }
                  />

                </label>

              </div>

              {/* THUMBNAIL */}

              <div>

                <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
                  Thumbnail
                </label>

                <label className="mt-2 border-2 border-dashed border-green-200 rounded-xl h-36 flex items-center justify-center cursor-pointer overflow-hidden hover:bg-green-50/50">

                  {thumbnailPreview ? (
                    <img
                      src={
                        thumbnailPreview
                      }
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-7 h-7 text-green-400 mx-auto mb-2" />

                      <span className="text-sm text-green-700">
                        Upload Thumbnail
                      </span>

                      <p className="text-xs text-gray-400 mt-1">
                        JPG, PNG or WebP
                      </p>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) =>
                      handleThumbnailFile(
                        e.target.files?.[0] ||
                          null
                      )
                    }
                  />

                </label>

              </div>

              {/* TITLE */}

              <div>

                <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
                  Video Title
                </label>

                <input
                  value={
                    form.title
                  }
                  onChange={(e) =>
                    updateForm(
                      'title',
                      e.target.value
                    )
                  }
                  placeholder="IHP Kitchen Spray (Combo of 2)"
                  className="w-full mt-1.5 px-3.5 py-2.5 border border-green-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />

              </div>

              {/* DESCRIPTION */}

              <div>

                <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
                  Description
                </label>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(e) =>
                    updateForm(
                      'description',
                      e.target.value
                    )
                  }
                  rows={3}
                  placeholder="Short description..."
                  className="w-full mt-1.5 px-3.5 py-2.5 border border-green-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
                />

              </div>

              {/* PRODUCT */}

              <div>

                <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
                  Connected Product
                </label>

                <select
                  value={
                    form.product_id
                  }
                  onChange={(e) =>
                    updateForm(
                      'product_id',
                      e.target.value
                    )
                  }
                  className="w-full mt-1.5 px-3.5 py-2.5 border border-green-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
                >

                  <option value="">
                    No product
                  </option>

                  {products.map(
                    (product) => (
                      <option
                        key={
                          product.id
                        }
                        value={
                          product.id
                        }
                      >
                        {product.name}
                      </option>
                    )
                  )}

                </select>

                <p className="text-xs text-gray-400 mt-1.5">
                  Connect this video to a product for the Add To Cart button.
                </p>

              </div>

              {/* BUTTON */}

              <div>

                <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
                  Button Text
                </label>

                <input
                  value={
                    form.button_text
                  }
                  onChange={(e) =>
                    updateForm(
                      'button_text',
                      e.target.value
                    )
                  }
                  placeholder="Add To Cart"
                  className="w-full mt-1.5 px-3.5 py-2.5 border border-green-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />

              </div>

              {/* ORDER */}

              <div>

                <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
                  Display Order
                </label>

                <input
                  type="number"
                  min={0}
                  value={
                    form.display_order
                  }
                  onChange={(e) =>
                    updateForm(
                      'display_order',
                      Number(
                        e.target.value
                      )
                    )
                  }
                  className="w-full mt-1.5 px-3.5 py-2.5 border border-green-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />

              </div>

              {/* SETTINGS */}

              <div className="bg-green-50 rounded-xl p-4 space-y-3">

                <label className="flex items-center gap-3 cursor-pointer">

                  <input
                    type="checkbox"
                    checked={
                      form.is_active
                    }
                    onChange={(e) =>
                      updateForm(
                        'is_active',
                        e.target.checked
                      )
                    }
                    className="w-4 h-4 accent-green-700"
                  />

                  <span className="text-sm text-green-900">
                    Show this video on homepage
                  </span>

                </label>

                <label className="flex items-center gap-3 cursor-pointer">

                  <input
                    type="checkbox"
                    checked={
                      form.autoplay
                    }
                    onChange={(e) =>
                      updateForm(
                        'autoplay',
                        e.target.checked
                      )
                    }
                    className="w-4 h-4 accent-green-700"
                  />

                  <span className="text-sm text-green-900">
                    Autoplay
                  </span>

                </label>

                <label className="flex items-center gap-3 cursor-pointer">

                  <input
                    type="checkbox"
                    checked={
                      form.muted
                    }
                    onChange={(e) =>
                      updateForm(
                        'muted',
                        e.target.checked
                      )
                    }
                    className="w-4 h-4 accent-green-700"
                  />

                  <span className="text-sm text-green-900">
                    Muted
                  </span>

                </label>

                <label className="flex items-center gap-3 cursor-pointer">

                  <input
                    type="checkbox"
                    checked={
                      form.loop
                    }
                    onChange={(e) =>
                      updateForm(
                        'loop',
                        e.target.checked
                      )
                    }
                    className="w-4 h-4 accent-green-700"
                  />

                  <span className="text-sm text-green-900">
                    Loop video
                  </span>

                </label>

              </div>

            </div>

            {/* FOOTER */}

            <div className="sticky bottom-0 bg-white border-t border-green-100 px-6 py-4 flex gap-3">

              <button
                type="button"
                onClick={() =>
                  setShowModal(false)
                }
                className="flex-1 px-4 py-2.5 border border-green-200 text-green-700 rounded-xl text-sm font-medium"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleSave
                }
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-green-800 hover:bg-green-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >

                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}

                {saving
                  ? 'Saving...'
                  : editing
                    ? 'Save Changes'
                    : 'Add Video'}

              </button>

            </div>

          </div>

        </div>
      )}
    </>
  );
}