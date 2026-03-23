'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import StepService from './StepService';
import StepDate from './StepDate';
import StepTimeSlot from './StepTimeSlot';
import StepClientForm from './StepClientForm';
import StepConfirmation from './StepConfirmation';

export interface BookingService {
  id: string;
  name: string;
  slug: string;
  description: string;
  durationMinutes: number;
  price: number | null;
  colorHex: string;
  emoji: string;
}

export interface BookingData {
  service: BookingService | null;
  date: string;
  time: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes: string;
}

const STEPS = [
  { label: 'Service', icon: 'I' },
  { label: 'Date', icon: 'II' },
  { label: 'Heure', icon: 'III' },
  { label: 'Confirmation', icon: 'IV' },
];

export default function BookingWizard() {
  const [step, setStep] = useState(0);
  const [booking, setBooking] = useState<BookingData>({
    service: null,
    date: '',
    time: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    notes: '',
  });
  const [confirmationToken, setConfirmationToken] = useState('');

  const goNext = () => setStep((s) => Math.min(s + 1, 4));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const updateBooking = (data: Partial<BookingData>) => {
    setBooking((prev) => ({ ...prev, ...data }));
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Indicator */}
      {step < 4 && (
        <div className="flex items-center justify-center gap-2 mb-12">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (i < step) setStep(i);
                }}
                disabled={i > step}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-cinzel tracking-wider transition-all duration-300 ${
                  i === step
                    ? 'bg-violet-royal/40 text-or-ancien border border-or-ancien/40'
                    : i < step
                      ? 'bg-violet-royal/20 text-or-ancien/70 border border-or-ancien/20 cursor-pointer hover:border-or-ancien/40'
                      : 'bg-charbon-mystere/50 text-parchemin-vieilli/30 border border-gris-fumee/20'
                }`}
              >
                <span className="font-cinzel-decorative text-[10px]">{s.icon}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-6 h-px transition-colors duration-300 ${
                    i < step ? 'bg-or-ancien/40' : 'bg-gris-fumee/20'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.35 }}
        >
          {step === 0 && (
            <StepService
              selected={booking.service}
              onSelect={(service) => {
                updateBooking({ service, date: '', time: '' });
                goNext();
              }}
            />
          )}
          {step === 1 && booking.service && (
            <StepDate
              serviceId={booking.service.id}
              selected={booking.date}
              onSelect={(date) => {
                updateBooking({ date, time: '' });
                goNext();
              }}
              onBack={goBack}
            />
          )}
          {step === 2 && booking.service && booking.date && (
            <StepTimeSlot
              serviceId={booking.service.id}
              date={booking.date}
              selected={booking.time}
              durationMinutes={booking.service.durationMinutes}
              onSelect={(time) => {
                updateBooking({ time });
                goNext();
              }}
              onBack={goBack}
            />
          )}
          {step === 3 && booking.service && booking.date && booking.time && (
            <StepClientForm
              booking={booking}
              onUpdate={updateBooking}
              onConfirm={(token) => {
                setConfirmationToken(token);
                goNext();
              }}
              onBack={goBack}
            />
          )}
          {step === 4 && (
            <StepConfirmation
              booking={booking}
              token={confirmationToken}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
