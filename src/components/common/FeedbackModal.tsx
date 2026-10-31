import React, { useState } from 'react';
import { Star, X, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  listingId: string;
  foodName: string;
  targetOrgName?: string;
  targetOrgId?: string;
  targetVolunteerId?: string;
  onSubmitted?: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  requestId,
  listingId,
  foodName,
  targetOrgName,
  targetOrgId,
  targetVolunteerId,
  onSubmitted,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [foodConditionRating, setFoodConditionRating] = useState<number>(5);
  const [punctualityRating, setPunctualityRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await api.submitFeedback({
        requestId,
        listingId,
        rating,
        comment: comment || 'Smooth coordination and handover.',
        foodConditionRating,
        punctualityRating,
        targetOrgId,
        targetVolunteerId,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onSubmitted) onSubmitted();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (current: number, setFn: (val: number) => void) => (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setFn(star)}
          className="p-1 focus:outline-hidden hover:scale-110 transition-transform"
        >
          <Star
            className={`w-6 h-6 ${
              star <= current ? 'fill-amber-400 text-amber-500' : 'text-stone-300 hover:text-amber-300'
            }`}
          />
        </button>
      ))}
      <span className="text-xs font-semibold text-stone-700 ml-2">{current} / 5</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-stone-900">Feedback Submitted!</h3>
            <p className="text-sm text-stone-600 mt-1">
              Thank you for strengthening transparency and food safety in our community redistribution network.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Quality & Reliability Review</span>
              <h3 className="text-xl font-bold text-stone-900 mt-0.5">Rate Donation & Handover</h3>
              <p className="text-xs text-stone-600 mt-1">
                For donation: <strong className="text-stone-800">{foodName}</strong>
                {targetOrgName && (
                  <>
                    {' '}· Partner: <strong className="text-stone-800">{targetOrgName}</strong>
                  </>
                )}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Overall Experience Rating
                </label>
                {renderStars(rating, setRating)}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Food Condition & Hygiene Standard
                </label>
                {renderStars(foodConditionRating, setFoodConditionRating)}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Punctuality & Communication
                </label>
                {renderStars(punctualityRating, setPunctualityRating)}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Review & Partner Feedback (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Mention packaging quality, temperature upon handover, and communication..."
                rows={3}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 shadow-xs"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
