import { BrainCircuit, BriefcaseBusiness, Palette } from 'lucide-react';

// Banner colour + icon come from the workshop type (the API has no topic)
export const TYPE_STYLE = {
  Workshop: { variant: 'ml', Icon: BrainCircuit },
  Seminar: { variant: 'design', Icon: Palette },
  FDP: { variant: 'career', Icon: BriefcaseBusiness },
};

export const getTypeStyle = (type) => TYPE_STYLE[type] || TYPE_STYLE.Workshop;