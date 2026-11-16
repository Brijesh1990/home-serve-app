import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';

export const ReviewModal = ({ isOpen, onClose, booking, onSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (comment.trim().length < 10) {
      setError('Please write at least 10 characters sharing your service experience.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await analyticsService.createReview({
        booking_id: booking.id,
        booking_reference: booking.booking_reference,
        service_id: booking.service_id,
        service_name: booking.service_name,
        provider_id: booking.provider_id,
        provider_name: booking.provider_name,
        rating,
        comment,
      });
      setComment('');
      if (onSubmitted) onSubmitted(created);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        <div className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold">Rate Your Service Experience</h3>
            <p className="text-[11px] text-slate-400">{booking.service_name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center space-y-2">
            <p className="text-xs font-semibold text-slate-500">
              How satisfied were you with <strong>{booking.provider_name}</strong>?
            </p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1.5 transition transform hover:scale-110 cursor-pointer"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? 'fill-[#F59E0B] text-[#F59E0B]'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Your Feedback & Review
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setError('');
              }}
              placeholder="Share details on punctuality, technician professionalism, and service quality..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#2563EB]"
            />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
            >
              {submitting ? 'Submitting...' : 'Submit Verified Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
