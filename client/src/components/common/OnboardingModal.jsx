import { useState, useEffect } from 'react';
import { MapPin, Radar, Shield, X } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

export default function OnboardingModal({ onComplete }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to Twingle',
      text: 'Discover people nearby, explore the map, and connect with others.',
      icon: <Radar className="w-12 h-12 text-primary-400" />,
    },
    {
      title: 'Location Access',
      text: 'Twingle uses your location to find nearby users. Your location is only shared when you scan or enable sharing.',
      icon: <MapPin className="w-12 h-12 text-primary-400" />,
    },
    {
      title: 'Privacy First',
      text: 'Location sharing is OFF by default. You can enable Ghost Mode anytime to hide your location.',
      icon: <Shield className="w-12 h-12 text-primary-400" />,
    },
  ];

  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6 space-y-6 animate-in">
        <div className="flex justify-end">
          <button onClick={onComplete} className="text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col items-center text-center space-y-4">
          {steps[step].icon}
          <h2 className="text-xl font-bold text-white">{steps[step].title}</h2>
          <p className="text-neutral-400 text-sm">{steps[step].text}</p>
        </div>
        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} fullWidth>
              Back
            </Button>
          )}
          <Button
            variant="primary"
            onClick={() => (isLast ? onComplete() : setStep(step + 1))}
            fullWidth
          >
            {isLast ? 'Get Started' : 'Next'}
          </Button>
        </div>
        <div className="flex justify-center gap-2">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full ${i === step ? 'bg-primary-500' : 'bg-neutral-700'}`}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
