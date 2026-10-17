import React, { useState } from 'react';
import { Lightbulb, Shuffle, BookOpen, Sparkles, ExternalLink } from 'lucide-react';

export interface WellnessTip {
  id: number;
  category: string;
  headline: string;
  body: string;
  physiologicalPrinciple: string;
}

const SCIENCE_BACKED_TIPS: WellnessTip[] = [
  {
    id: 1,
    category: 'Tear Film Dynamics',
    headline: 'Incomplete Blinks Dry the Cornea',
    body: 'During intense screen work, over 60% of blinks are incomplete (eyelids do not fully touch). Making a conscious effort to close eyelids fully spreads the lipid layer from the meibomian glands across the eye surface.',
    physiologicalPrinciple: 'Prevents lipid layer breakup and evaporative dry eye (evaporative asthenopia).',
  },
  {
    id: 2,
    category: 'Ciliary Accommodation',
    headline: 'Why 20 Feet Relaxes the Eyes',
    body: 'Looking at near displays forces the ciliary muscle to continuously contract to focus the lens. Focusing on an object 20 feet (6 meters) away allows the ciliary muscle to relax to its natural resting state.',
    physiologicalPrinciple: 'Relieves accommodative spasm and reduces ocular tension.',
  },
  {
    id: 3,
    category: 'Display Ergonomics',
    headline: 'Keep Monitor Top Edge at Eye Level',
    body: 'Positioning your display so your gaze angles downward by 15° to 20° naturally narrows the palpebral fissure (eyelid opening), reducing the exposed ocular surface area susceptible to tear evaporation.',
    physiologicalPrinciple: 'Decreases surface tear evaporation rate by up to 35%.',
  },
  {
    id: 4,
    category: 'Ambient Contrast',
    headline: 'Balance Room & Screen Brightness',
    body: 'Working in a dark room with a bright monitor forces your pupils to continuously constrict and dilate as you glance between screen and surroundings, causing rapid retinal fatigue.',
    physiologicalPrinciple: 'Maintains stable pupillary diameter and reduces asthenopic headache triggers.',
  },
  {
    id: 5,
    category: 'Blink Kinematics',
    headline: 'Screen Focus Slashes Blink Rate',
    body: 'A relaxed human blinks approximately 15 to 20 times per minute. When reading high-density text or code, cognitive load drops the spontaneous blink rate down to just 4 to 7 blinks per minute.',
    physiologicalPrinciple: 'Cognitive stare-inhibition reduces tear lubrication cycles by more than half.',
  },
  {
    id: 6,
    category: 'Microclimate',
    headline: 'Shield Eyes From Direct Air Drafts',
    body: 'Air conditioning vents, heaters, or desk fans blowing directly toward the face accelerate tear film evaporation by over 40%. Orient fans and vents downward or away from the workstation.',
    physiologicalPrinciple: 'Protects the precorneal tear film from convective desiccation.',
  },
  {
    id: 7,
    category: 'Systemic Hydration',
    headline: 'Hydration Directly Fuels Tear Osmolarity',
    body: 'Even mild systemic dehydration increases tear film osmolarity, triggering corneal epithelial inflammation and the sensation of sand or grit in the eyes.',
    physiologicalPrinciple: 'Preserves aqueous tear volume produced by the lacrimal glands.',
  },
];

export const WellnessTipsCard: React.FC = () => {
  // Select one random tip on startup
  const [currentTipIndex, setCurrentTipIndex] = useState(() =>
    Math.floor(Math.random() * SCIENCE_BACKED_TIPS.length)
  );

  const handleShuffle = () => {
    setCurrentTipIndex((prev) => (prev + 1) % SCIENCE_BACKED_TIPS.length);
  };

  const tip = SCIENCE_BACKED_TIPS[currentTipIndex];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-slate-200">Daily Science-Backed Wellness Tip</h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-cyan-400 font-mono">
            {tip.category}
          </span>
          <button
            onClick={handleShuffle}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Read another scientific tip"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tip Content */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>{tip.headline}</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          {tip.body}
        </p>
      </div>

      {/* Physiological Mechanism Footnote */}
      <div className="mt-1 p-2.5 rounded-lg border border-slate-800 bg-slate-950/50 text-[11px] text-slate-400 flex items-start gap-2">
        <BookOpen className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold text-slate-300">Physiological Mechanism:</span>{' '}
          {tip.physiologicalPrinciple}
        </p>
      </div>
    </div>
  );
};
