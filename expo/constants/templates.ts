import { ThingType, TemplateTask } from './types';

export const thingEmojis: Record<ThingType, string> = {
  home: '🏠',
  auto: '🚗',
  rental: '🏘️',
  vacation: '🏖️',
  hottub: '🛁',
  generator: '⚡',
  lawn: '🌿',
  boat: '🚤',
  custom: '🔧',
};

export const thingTypeLabels: Record<ThingType, string> = {
  home: 'Home',
  auto: 'Auto',
  rental: 'Rental',
  vacation: 'Vacation Property',
  hottub: 'Hot Tub / Pool',
  generator: 'Generator',
  lawn: 'Lawn',
  boat: 'Boat',
  custom: 'Custom',
};

export const templateTasks: Record<ThingType, TemplateTask[]> = {
  home: [
    { name: 'HVAC Filter', intervalValue: 3, intervalUnit: 'months' },
    { name: 'Pest Control', intervalValue: 3, intervalUnit: 'months' },
    { name: 'Gutter Cleaning', intervalValue: 6, intervalUnit: 'months' },
    { name: 'Dryer Vent Cleaning', intervalValue: 6, intervalUnit: 'months' },
    { name: 'Whole-House Water Filter', intervalValue: 6, intervalUnit: 'months' },
    { name: 'Smoke Detector Battery', intervalValue: 6, intervalUnit: 'months' },
    { name: 'Water Heater Flush', intervalValue: 12, intervalUnit: 'months' },
    { name: 'Chimney Cleaning', intervalValue: 12, intervalUnit: 'months' },
    { name: 'Exterior Caulking', intervalValue: 12, intervalUnit: 'months' },
  ],
  auto: [
    { name: 'Oil Change', intervalValue: 6, intervalUnit: 'months' },
    { name: 'Tire Rotation', intervalValue: 6, intervalUnit: 'months' },
    { name: 'Brake Inspection', intervalValue: 12, intervalUnit: 'months' },
    { name: 'Cabin Air Filter', intervalValue: 12, intervalUnit: 'months' },
    { name: 'Engine Air Filter', intervalValue: 12, intervalUnit: 'months' },
    { name: 'Wiper Blades', intervalValue: 12, intervalUnit: 'months' },
    { name: 'Battery Check', intervalValue: 12, intervalUnit: 'months' },
    { name: 'Coolant Flush', intervalValue: 24, intervalUnit: 'months' },
  ],
  rental: [
    { name: 'HVAC Filter', intervalValue: 3, intervalUnit: 'months' },
    { name: 'Pest Control', intervalValue: 3, intervalUnit: 'months' },
    { name: 'Gutter Cleaning', intervalValue: 6, intervalUnit: 'months' },
    { name: 'Smoke/CO Detector Test', intervalValue: 12, intervalUnit: 'months' },
    { name: 'Exterior Inspection', intervalValue: 12, intervalUnit: 'months' },
    { name: 'Appliance Check', intervalValue: 12, intervalUnit: 'months' },
  ],
  vacation: [
    { name: 'Pest Control', intervalValue: 6, intervalUnit: 'months' },
    { name: 'HVAC Filter', intervalValue: 6, intervalUnit: 'months' },
    { name: 'Winterization', intervalValue: 12, intervalUnit: 'months' },
    { name: 'Spring Opening', intervalValue: 12, intervalUnit: 'months' },
    { name: 'Water Heater Check', intervalValue: 12, intervalUnit: 'months' },
    { name: 'Exterior Inspection', intervalValue: 12, intervalUnit: 'months' },
  ],
  hottub: [
    { name: 'Chemical Balance Check', intervalValue: 1, intervalUnit: 'weeks' },
    { name: 'Filter Rinse', intervalValue: 1, intervalUnit: 'months' },
    { name: 'Water Change', intervalValue: 3, intervalUnit: 'months' },
    { name: 'Filter Deep Clean', intervalValue: 3, intervalUnit: 'months' },
    { name: 'Filter Replacement', intervalValue: 12, intervalUnit: 'months' },
    { name: 'Cover Inspection', intervalValue: 12, intervalUnit: 'months' },
  ],
  generator: [
    { name: 'Load Test', intervalValue: 6, intervalUnit: 'months' },
    { name: 'Fuel Stabilizer', intervalValue: 6, intervalUnit: 'months' },
    { name: 'Oil Change', intervalValue: 12, intervalUnit: 'months' },
    { name: 'Air Filter', intervalValue: 12, intervalUnit: 'months' },
    { name: 'Spark Plug Inspection', intervalValue: 12, intervalUnit: 'months' },
    { name: 'Battery Check', intervalValue: 12, intervalUnit: 'months' },
  ],
  lawn: [
    { name: 'Fertilization', intervalValue: 3, intervalUnit: 'months' },
    { name: 'Sprinkler System Check', intervalValue: 6, intervalUnit: 'months' },
    { name: 'Mower Oil Change', intervalValue: 12, intervalUnit: 'months' },
    { name: 'Mower Blade Sharpening', intervalValue: 12, intervalUnit: 'months' },
    { name: 'Mower Air Filter', intervalValue: 12, intervalUnit: 'months' },
    { name: 'Aeration', intervalValue: 12, intervalUnit: 'months' },
    { name: 'Overseeding', intervalValue: 12, intervalUnit: 'months' },
  ],
  boat: [
    { name: 'Hull Cleaning', intervalValue: 3, intervalUnit: 'months' },
    { name: 'Engine Oil Change', intervalValue: 6, intervalUnit: 'months' },
    { name: 'Lower Unit Gear Oil', intervalValue: 6, intervalUnit: 'months' },
    { name: 'Fuel Filter', intervalValue: 6, intervalUnit: 'months' },
    { name: 'Battery Check', intervalValue: 6, intervalUnit: 'months' },
    { name: 'Propeller Inspection', intervalValue: 6, intervalUnit: 'months' },
    { name: 'Bilge Pump Test', intervalValue: 6, intervalUnit: 'months' },
    { name: 'Zincs / Anodes', intervalValue: 12, intervalUnit: 'months' },
    { name: 'Winterization', intervalValue: 12, intervalUnit: 'months' },
    { name: 'Spring Commissioning', intervalValue: 12, intervalUnit: 'months' },
    { name: 'Safety Equipment Check', intervalValue: 12, intervalUnit: 'months' },
    { name: 'Trailer Inspection', intervalValue: 12, intervalUnit: 'months' },
  ],
  custom: [],
};

export interface DecomposeTemplate {
  name: string;
  emoji: string;
  type: ThingType;
  keywords: string[];
  tasks: TemplateTask[];
}

export const decomposeTemplates: DecomposeTemplate[] = [
  {
    name: 'HVAC System',
    emoji: '🌬️',
    type: 'home',
    keywords: ['hvac', 'air filter', 'furnace', 'a/c', 'ac filter'],
    tasks: [
      { name: 'HVAC Filter', intervalValue: 3, intervalUnit: 'months' },
      { name: 'HVAC Service', intervalValue: 12, intervalUnit: 'months' },
    ],
  },
  {
    name: 'Water Heater',
    emoji: '🚿',
    type: 'home',
    keywords: ['water heater', 'heater flush', 'tank flush'],
    tasks: [
      { name: 'Water Heater Flush', intervalValue: 12, intervalUnit: 'months' },
      { name: 'Water Heater Inspection', intervalValue: 12, intervalUnit: 'months' },
    ],
  },
  {
    name: 'Chimney',
    emoji: '🔥',
    type: 'home',
    keywords: ['chimney', 'fireplace'],
    tasks: [
      { name: 'Chimney Cleaning', intervalValue: 12, intervalUnit: 'months' },
    ],
  },
  {
    name: 'Gutters',
    emoji: '🏠',
    type: 'home',
    keywords: ['gutter', 'downspout'],
    tasks: [
      { name: 'Gutter Cleaning', intervalValue: 6, intervalUnit: 'months' },
    ],
  },
  {
    name: 'Dryer',
    emoji: '🧺',
    type: 'home',
    keywords: ['dryer', 'vent cleaning'],
    tasks: [
      { name: 'Dryer Vent Cleaning', intervalValue: 6, intervalUnit: 'months' },
    ],
  },
  {
    name: 'Water Filter',
    emoji: '💧',
    type: 'home',
    keywords: ['water filter', 'whole-house filter'],
    tasks: [
      { name: 'Water Filter Change', intervalValue: 6, intervalUnit: 'months' },
    ],
  },
  {
    name: 'Smoke Detectors',
    emoji: '🚨',
    type: 'home',
    keywords: ['smoke detector', 'co detector', 'carbon monoxide'],
    tasks: [
      { name: 'Smoke Detector Battery', intervalValue: 6, intervalUnit: 'months' },
      { name: 'Smoke/CO Test', intervalValue: 12, intervalUnit: 'months' },
    ],
  },
  {
    name: 'Pest Control',
    emoji: '🐜',
    type: 'home',
    keywords: ['pest', 'exterminator', 'bug'],
    tasks: [
      { name: 'Pest Control', intervalValue: 3, intervalUnit: 'months' },
    ],
  },
  {
    name: 'Exterior',
    emoji: '🧱',
    type: 'home',
    keywords: ['exterior', 'caulking', 'siding', 'paint'],
    tasks: [
      { name: 'Exterior Caulking', intervalValue: 12, intervalUnit: 'months' },
      { name: 'Exterior Inspection', intervalValue: 12, intervalUnit: 'months' },
    ],
  },
];

export function matchDecomposeTemplate(taskName: string): DecomposeTemplate | null {
  const lower = taskName.toLowerCase();
  for (const tpl of decomposeTemplates) {
    for (const kw of tpl.keywords) {
      if (lower.includes(kw)) return tpl;
    }
  }
  return null;
}
