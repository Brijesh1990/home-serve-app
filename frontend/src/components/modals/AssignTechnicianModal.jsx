import React, { useState, useEffect } from 'react';
import { Wrench, Star, CheckCircle2, X } from 'lucide-react';
import { technicianService } from '../../services/technicianService';
import { bookingService } from '../../services/bookingService';

export const AssignTechnicianModal = ({ isOpen, onClose, booking, onAssigned }) => {
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      technicianService.getTechnicians().then((list) => {
        setTechnicians(list);
        if (list.length > 0) setSelectedTechId(list[0].id);
      });
    }
  }, [isOpen]);

  if (!isOpen || !booking) return null;

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedTechId) return;
    setSubmitting(true);
    try {
      const updated = await bookingService.assignTechnician(booking.id, selectedTechId);
      if (onAssigned) onAssigned(updated);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        <div className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Wrench className="w-5 h-5 text-[#F59E0B]" />
            <div>
              <h3 className="text-sm font-bold">Dispatch Field Technician</h3>
              <p className="text-[11px] text-slate-400">
                Booking {booking.booking_reference} • {booking.scheduled_date}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAssign} className="p-6 space-y-4">
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-3.5 text-xs">
            <p className="font-bold text-slate-900">{booking.service_name}</p>
            <p className="text-slate-600 mt-0.5">
              Customer: <strong>{booking.customer_name}</strong> ({booking.city}) • Slot:{' '}
              <strong>{booking.time_slot}</strong>
            </p>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            <label className="block text-xs font-bold text-slate-700">
              Select Verified Field Technician
            </label>
            {technicians.map((tech) => {
              const selected = Number(selectedTechId) === Number(tech.id);
              return (
                <div
                  key={tech.id}
                  onClick={() => setSelectedTechId(tech.id)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                    selected
                      ? 'border-[#2563EB] bg-blue-50/50 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                      {tech.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{tech.full_name}</p>
                      <p className="text-[11px] text-slate-500">
                        {tech.specialization} • {tech.jobs_completed} jobs completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {tech.rating}
                    </span>
                    {selected && <CheckCircle2 className="w-5 h-5 text-[#2563EB]" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-sm cursor-pointer"
            >
              {submitting ? 'Assigning...' : 'Confirm Technician Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignTechnicianModal;
