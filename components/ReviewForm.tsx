'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, Loader as Loader2, Camera, X, CheckCircle } from 'lucide-react';
import ImageUploader from '@/components/admin/ImageUploader';

type Props = {
  productId: string;
  onSubmitted: () => void;
};

export default function ReviewForm({ productId, onSubmitted }: Props) {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (rating < 1 || rating > 5) { setError('Please select a rating'); return; }

    setSubmitting(true);
    const { error: insertError } = await supabase.from('product_reviews').insert({
      product_id: productId,
      reviewer_name: name.trim(),
      rating,
      title: title.trim() || null,
      body: body.trim() || null,
      images,
      status: 'pending',
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message || 'Failed to submit review');
      return;
    }

    setSuccess(true);
    setName('');
    setRating(5);
    setTitle('');
    setBody('');
    setImages([]);
    onSubmitted();
    setTimeout(() => setSuccess(false), 5000);
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
        <p className="font-medium text-green-800 mb-1">Thank you for your review!</p>
        <p className="text-sm text-green-600">Your review has been submitted and will appear once approved by our team.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-green-100 rounded-2xl p-6 space-y-4">
      <h4 className="font-display font-semibold text-green-900 text-lg">Write a Review</h4>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Star rating */}
      <div>
        <label className="block text-xs font-medium text-green-700 mb-2">Your Rating *</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                className={`w-7 h-7 ${(hoverRating || rating) >= star ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-green-700 mb-1.5">Your Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50"
          placeholder="Enter your name"
          required
        />
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-medium text-green-700 mb-1.5">Review Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50"
          placeholder="Summarize your experience"
        />
      </div>

      {/* Body */}
      <div>
        <label className="block text-xs font-medium text-green-700 mb-1.5">Your Review</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="w-full px-3.5 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50 resize-none"
          placeholder="Share details about the product, quality, your experience..."
        />
      </div>

      {/* Images */}
      <div>
        <label className="block text-xs font-medium text-green-700 mb-1.5">
          <span className="flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" /> Add Photos (optional)
          </span>
        </label>
        <ImageUploader value={images} onChange={setImages} folder="reviews" label="Review Photos" max={4} />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-green-800 text-white py-3 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>

      <p className="text-xs text-green-500 text-center">Reviews are moderated and will appear after admin approval.</p>
    </form>
  );
}
