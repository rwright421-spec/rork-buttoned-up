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

export type AreaPattern = 'checkbox' | 'named' | 'custom';

export interface TemplateThing {
  key: string;
  name: string;
  emoji: string;
  type: ThingType;
  tasks: TemplateTask[];
}

export interface TemplateArea {
  key: string;
  name: string;
  emoji: string;
  pattern: AreaPattern;
  things?: TemplateThing[];
  thingPrompt?: string;
  defaultThing?: TemplateThing;
}

export const templateAreas: TemplateArea[] = [
  {
    key: 'home',
    name: 'Home',
    emoji: '🏠',
    pattern: 'checkbox',
    things: [
      {
        key: 'hvac',
        name: 'HVAC System',
        emoji: '🌬️',
        type: 'home',
        tasks: [
          { name: 'HVAC Filter', intervalValue: 3, intervalUnit: 'months' },
          { name: 'HVAC Service', intervalValue: 12, intervalUnit: 'months' },
        ],
      },
      {
        key: 'water_heater',
        name: 'Water Heater',
        emoji: '🚿',
        type: 'home',
        tasks: [
          { name: 'Water Heater Flush', intervalValue: 12, intervalUnit: 'months' },
          { name: 'Water Heater Inspection', intervalValue: 12, intervalUnit: 'months' },
        ],
      },
      {
        key: 'chimney',
        name: 'Chimney',
        emoji: '🔥',
        type: 'home',
        tasks: [
          { name: 'Chimney Cleaning', intervalValue: 12, intervalUnit: 'months' },
        ],
      },
      {
        key: 'gutters',
        name: 'Gutters',
        emoji: '🏠',
        type: 'home',
        tasks: [
          { name: 'Gutter Cleaning', intervalValue: 6, intervalUnit: 'months' },
        ],
      },
      {
        key: 'dryer',
        name: 'Dryer',
        emoji: '🧺',
        type: 'home',
        tasks: [
          { name: 'Dryer Vent Cleaning', intervalValue: 6, intervalUnit: 'months' },
        ],
      },
      {
        key: 'water_filter',
        name: 'Water Filter',
        emoji: '💧',
        type: 'home',
        tasks: [
          { name: 'Whole-House Water Filter', intervalValue: 6, intervalUnit: 'months' },
        ],
      },
      {
        key: 'smoke_detectors',
        name: 'Smoke Detectors',
        emoji: '🚨',
        type: 'home',
        tasks: [
          { name: 'Smoke Detector Battery', intervalValue: 6, intervalUnit: 'months' },
          { name: 'Smoke/CO Test', intervalValue: 12, intervalUnit: 'months' },
        ],
      },
      {
        key: 'pest_control',
        name: 'Pest Control',
        emoji: '🐜',
        type: 'home',
        tasks: [
          { name: 'Pest Control', intervalValue: 3, intervalUnit: 'months' },
        ],
      },
      {
        key: 'exterior',
        name: 'Exterior',
        emoji: '🧱',
        type: 'home',
        tasks: [
          { name: 'Exterior Caulking', intervalValue: 12, intervalUnit: 'months' },
          { name: 'Exterior Inspection', intervalValue: 12, intervalUnit: 'months' },
        ],
      },
      {
        key: 'lawn',
        name: 'Lawn',
        emoji: '🌿',
        type: 'lawn',
        tasks: [
          { name: 'Fertilization', intervalValue: 3, intervalUnit: 'months' },
          { name: 'Aeration', intervalValue: 12, intervalUnit: 'months' },
          { name: 'Overseeding', intervalValue: 12, intervalUnit: 'months' },
        ],
      },
      {
        key: 'sprinklers',
        name: 'Sprinklers',
        emoji: '💦',
        type: 'lawn',
        tasks: [
          { name: 'Sprinkler System Check', intervalValue: 6, intervalUnit: 'months' },
          { name: 'Winterize Sprinklers', intervalValue: 12, intervalUnit: 'months' },
        ],
      },
      {
        key: 'mower',
        name: 'Mower',
        emoji: '🚜',
        type: 'lawn',
        tasks: [
          { name: 'Mower Oil Change', intervalValue: 12, intervalUnit: 'months' },
          { name: 'Mower Blade Sharpening', intervalValue: 12, intervalUnit: 'months' },
          { name: 'Mower Air Filter', intervalValue: 12, intervalUnit: 'months' },
        ],
      },
      {
        key: 'generator',
        name: 'Generator',
        emoji: '⚡',
        type: 'generator',
        tasks: [
          { name: 'Load Test', intervalValue: 6, intervalUnit: 'months' },
          { name: 'Fuel Stabilizer', intervalValue: 6, intervalUnit: 'months' },
          { name: 'Oil Change', intervalValue: 12, intervalUnit: 'months' },
          { name: 'Air Filter', intervalValue: 12, intervalUnit: 'months' },
          { name: 'Spark Plug Inspection', intervalValue: 12, intervalUnit: 'months' },
          { name: 'Battery Check', intervalValue: 12, intervalUnit: 'months' },
        ],
      },
    ],
  },
  {
    key: 'personal_health',
    name: 'Personal Health',
    emoji: '❤️',
    pattern: 'checkbox',
    things: [
      {
        key: 'annual_physical',
        name: 'Annual Physical',
        emoji: '🩺',
        type: 'custom',
        tasks: [
          { name: 'Annual Physical Exam', intervalValue: 12, intervalUnit: 'months' },
        ],
      },
      {
        key: 'dentist',
        name: 'Dentist',
        emoji: '🦷',
        type: 'custom',
        tasks: [
          { name: 'Dental Cleaning', intervalValue: 6, intervalUnit: 'months' },
        ],
      },
      {
        key: 'eye_exam',
        name: 'Eye Exam',
        emoji: '👁️',
        type: 'custom',
        tasks: [
          { name: 'Eye Exam', intervalValue: 12, intervalUnit: 'months' },
        ],
      },
      {
        key: 'skin_check',
        name: 'Skin Check',
        emoji: '🧴',
        type: 'custom',
        tasks: [
          { name: 'Dermatology Screening', intervalValue: 12, intervalUnit: 'months' },
        ],
      },
      {
        key: 'bloodwork',
        name: 'Bloodwork',
        emoji: '🩸',
        type: 'custom',
        tasks: [
          { name: 'Annual Bloodwork', intervalValue: 12, intervalUnit: 'months' },
        ],
      },
      {
        key: 'haircut',
        name: 'Haircut',
        emoji: '💇',
        type: 'custom',
        tasks: [
          { name: 'Haircut', intervalValue: 6, intervalUnit: 'weeks' },
        ],
      },
    ],
  },
  {
    key: 'fitness',
    name: 'Fitness',
    emoji: '💪',
    pattern: 'checkbox',
    things: [
      {
        key: 'running_shoes',
        name: 'Running Shoes',
        emoji: '👟',
        type: 'custom',
        tasks: [
          { name: 'Replace Running Shoes', intervalValue: 6, intervalUnit: 'months' },
        ],
      },
      {
        key: 'gym_membership',
        name: 'Gym Membership',
        emoji: '🏋️',
        type: 'custom',
        tasks: [
          { name: 'Review Gym Membership', intervalValue: 12, intervalUnit: 'months' },
        ],
      },
      {
        key: 'bike',
        name: 'Bike',
        emoji: '🚲',
        type: 'custom',
        tasks: [
          { name: 'Chain Lube', intervalValue: 1, intervalUnit: 'months' },
          { name: 'Tune-Up', intervalValue: 12, intervalUnit: 'months' },
        ],
      },
    ],
  },
  {
    key: 'finance',
    name: 'Finance',
    emoji: '💰',
    pattern: 'checkbox',
    things: [
      {
        key: 'credit_report',
        name: 'Credit Report',
        emoji: '📊',
        type: 'custom',
        tasks: [
          { name: 'Pull Credit Report', intervalValue: 12, intervalUnit: 'months' },
        ],
      },
      {
        key: 'taxes',
        name: 'Taxes',
        emoji: '🧾',
        type: 'custom',
        tasks: [
          { name: 'File Taxes', intervalValue: 12, intervalUnit: 'months' },
        ],
      },
      {
        key: 'insurance',
        name: 'Insurance',
        emoji: '🛡️',
        type: 'custom',
        tasks: [
          { name: 'Review Insurance Policies', intervalValue: 12, intervalUnit: 'months' },
        ],
      },
      {
        key: 'retirement',
        name: 'Retirement',
        emoji: '🏦',
        type: 'custom',
        tasks: [
          { name: 'Rebalance Retirement Accounts', intervalValue: 12, intervalUnit: 'months' },
        ],
      },
      {
        key: 'will',
        name: 'Will & Estate',
        emoji: '📜',
        type: 'custom',
        tasks: [
          { name: 'Review Will / Estate Plan', intervalValue: 24, intervalUnit: 'months' },
        ],
      },
    ],
  },
  {
    key: 'auto',
    name: 'Auto',
    emoji: '🚗',
    pattern: 'named',
    thingPrompt: "What's your vehicle called?",
    defaultThing: {
      key: 'vehicle',
      name: 'Vehicle',
      emoji: '🚗',
      type: 'auto',
      tasks: [
        { name: 'Oil Change', intervalValue: 6, intervalUnit: 'months' },
        { name: 'Tire Rotation', intervalValue: 6, intervalUnit: 'months' },
        { name: 'Brake Inspection', intervalValue: 12, intervalUnit: 'months' },
        { name: 'Cabin Air Filter', intervalValue: 12, intervalUnit: 'months' },
        { name: 'Engine Air Filter', intervalValue: 12, intervalUnit: 'months' },
        { name: 'Wiper Blades', intervalValue: 12, intervalUnit: 'months' },
        { name: 'Battery Check', intervalValue: 12, intervalUnit: 'months' },
        { name: 'Coolant Flush', intervalValue: 24, intervalUnit: 'months' },
      ],
    },
  },
  {
    key: 'rental',
    name: 'Rental',
    emoji: '🏘️',
    pattern: 'named',
    thingPrompt: "What's the rental called?",
    defaultThing: {
      key: 'rental',
      name: 'Rental',
      emoji: '🏘️',
      type: 'rental',
      tasks: [
        { name: 'HVAC Filter', intervalValue: 3, intervalUnit: 'months' },
        { name: 'Pest Control', intervalValue: 3, intervalUnit: 'months' },
        { name: 'Gutter Cleaning', intervalValue: 6, intervalUnit: 'months' },
        { name: 'Smoke/CO Detector Test', intervalValue: 12, intervalUnit: 'months' },
        { name: 'Exterior Inspection', intervalValue: 12, intervalUnit: 'months' },
        { name: 'Appliance Check', intervalValue: 12, intervalUnit: 'months' },
      ],
    },
  },
  {
    key: 'vacation',
    name: 'Vacation Property',
    emoji: '🏖️',
    pattern: 'named',
    thingPrompt: "What's the vacation property called?",
    defaultThing: {
      key: 'vacation',
      name: 'Vacation Property',
      emoji: '🏖️',
      type: 'vacation',
      tasks: [
        { name: 'Pest Control', intervalValue: 6, intervalUnit: 'months' },
        { name: 'HVAC Filter', intervalValue: 6, intervalUnit: 'months' },
        { name: 'Winterization', intervalValue: 12, intervalUnit: 'months' },
        { name: 'Spring Opening', intervalValue: 12, intervalUnit: 'months' },
        { name: 'Water Heater Check', intervalValue: 12, intervalUnit: 'months' },
        { name: 'Exterior Inspection', intervalValue: 12, intervalUnit: 'months' },
      ],
    },
  },
  {
    key: 'boat',
    name: 'Boat',
    emoji: '🚤',
    pattern: 'named',
    thingPrompt: "What's your boat called?",
    defaultThing: {
      key: 'boat',
      name: 'Boat',
      emoji: '🚤',
      type: 'boat',
      tasks: [
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
    },
  },
  {
    key: 'pets',
    name: 'Pets',
    emoji: '🐾',
    pattern: 'named',
    thingPrompt: "What's your pet's name?",
    defaultThing: {
      key: 'pet',
      name: 'Pet',
      emoji: '🐾',
      type: 'custom',
      tasks: [
        { name: 'Vet Checkup', intervalValue: 12, intervalUnit: 'months' },
        { name: 'Vaccinations', intervalValue: 12, intervalUnit: 'months' },
        { name: 'Flea & Tick Treatment', intervalValue: 1, intervalUnit: 'months' },
        { name: 'Grooming', intervalValue: 2, intervalUnit: 'months' },
        { name: 'Dental Check', intervalValue: 12, intervalUnit: 'months' },
      ],
    },
  },
  {
    key: 'contacts',
    name: 'Contacts',
    emoji: '📇',
    pattern: 'named',
    thingPrompt: "Who do you want to stay in touch with?",
    defaultThing: {
      key: 'contact',
      name: 'Contact',
      emoji: '📇',
      type: 'custom',
      tasks: [
        { name: 'Reach Out', intervalValue: 2, intervalUnit: 'months' },
        { name: 'Birthday Card', intervalValue: 12, intervalUnit: 'months' },
      ],
    },
  },
  {
    key: 'custom',
    name: 'Custom',
    emoji: '✨',
    pattern: 'custom',
  },
];

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
