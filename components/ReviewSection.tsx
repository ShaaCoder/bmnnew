'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, type ProductReview } from '@/lib/supabase';
import { Star, MessageCircle, Loader as Loader2, ThumbsUp } from 'lucide-react';
import ReviewForm from './ReviewForm';

type Props = {
  productId: string;
};

function StarRow({ rating, size = 'w-4 h-4' }: { rating: number; size?: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${size} ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
      ))}
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ReviewSection({ productId }: Props) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent');

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    setReviews((data as ProductReview[]) || []);
    setLoading(false);
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }));

  const sorted = sortBy === 'rating'
    ? [...reviews].sort((a, b) => b.rating - a.rating)
    : reviews;

  return (
    <div className="mt-16">
      <div className="flex items-center gap-3 mb-8">
        <MessageCircle className="w-7 h-7 text-green-700" />
        <h2 className="font-display text-2xl font-bold text-green-900">Customer Reviews</h2>
        {reviews.length > 0 && (
          <span className="text-sm text-green-500 bg-green-50 px-3 py-1 rounded-full">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Summary + form toggle */}
        <div className="lg:col-span-1 space-y-6">
          {/* Rating summary */}
          <div className="bg-white border border-green-100 rounded-2xl p-6 text-center">
            <p className="text-5xl font-bold text-green-900">{avgRating.toFixed(1)}</p>
            <div className="flex justify-center mt-2">
              <StarRow rating={Math.round(avgRating)} size="w-5 h-5" />
            </div>
            <p className="text-sm text-green-500 mt-2">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>

            {reviews.length > 0 && (
              <div className="mt-4 space-y-1.5">
                {ratingCounts.map(({ star, count }) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-green-600 w-3">{star}</span>
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <div className="flex-1 h-2 bg-green-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${reviews.length > 0 ? (count / reviews.length) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-green-500 w-5 text-right">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Write review button / form */}
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full bg-green-800 text-white py-3 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
            >
              Write a Review
            </button>
          ) : (
            <ReviewForm productId={productId} onSubmitted={load} />
          )}
        </div>

        {/* Reviews list */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-green-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-green-100">
              <MessageCircle className="w-10 h-10 text-green-300 mx-auto mb-3" />
              <p className="text-green-600 font-medium">No reviews yet</p>
              <p className="text-sm text-green-400 mt-1">Be the first to share your experience!</p>
            </div>
          ) : (
            <>
              {/* Sort */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-green-500">Sort by:</span>
                <button
                  onClick={() => setSortBy('recent')}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors ${sortBy === 'recent' ? 'bg-green-800 text-white' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                >
                  Most Recent
                </button>
                <button
                  onClick={() => setSortBy('rating')}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors ${sortBy === 'rating' ? 'bg-green-800 text-white' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                >
                  Highest Rated
                </button>
              </div>

              <div className="space-y-4">
                {sorted.map((review) => (
                  <div key={review.id} className="bg-white border border-green-100 rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                          {review.reviewer_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-green-900 text-sm">{review.reviewer_name}</p>
                          <p className="text-xs text-green-400">{formatDate(review.created_at)}</p>
                        </div>
                      </div>
                      <StarRow rating={review.rating} />
                    </div>

                    {review.title && (
                      <p className="font-medium text-green-800 text-sm mb-1">{review.title}</p>
                    )}
                    {review.body && (
                      <p className="text-sm text-green-600/80 leading-relaxed mb-3">{review.body}</p>
                    )}

                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mb-3">
                        {review.images.map((img, i) => (
                          <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-green-100 shrink-0">
                            <img src={img} alt={`Review photo ${i + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    {review.admin_reply && (
                      <div className="mt-3 bg-green-50 rounded-xl p-3 border border-green-100">
                        <p className="text-xs font-medium text-green-700 mb-1">Response from Bharat Advance</p>
                        <p className="text-sm text-green-600">{review.admin_reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
