// The writing page is a small, plain list of notes. Add an object here and it
// appears in the index, the nav route and the agent-facing llms.txt.

export interface WritingNote {
  slug: string;
  title: string;
  date: string;
  lede: string;
  body: string[];
}

export const writingNotes: WritingNote[] = [
  {
    slug: 'the-site-is-a-contact-sheet',
    title: 'the site is a contact sheet',
    date: 'nov 2026',
    lede: 'the homepage went from 575 words to about 150, and got a city.',
    body: [
      'the old page was a resume with better animation. i kept the animations and threw away most of the resume.',
      'so i cut it. the homepage is now an index: four things i have built, a strip of photos, one way to reach me. everything else is one click deeper. the city at the top is the only thing allowed to be loud.',
      'the reference points were mason hall\u2019s living skyline and sarah li\u2019s quiet, tiny pages. what i took from both was not the layout. it was the editing.',
    ],
  },
  {
    slug: 'a-city-you-can-click',
    title: 'a city you can click',
    date: 'nov 2026',
    lede: 'the skyline is a 1-bit canvas: about 1,500 windows, a clock tower on lafayette time, and birds that stay.',
    body: [
      'nothing in the hero is an image. the skyline, the river, the moon and the birds are all drawn from cells, which is why the city stays crisp at any size and why it weighs almost nothing.',
      'click the sky and a bird flies out, picks a free rooftop and lands. it stays there, looks around, occasionally hops. send enough and the oldest one leaves. the count lives in the bottom corner.',
      'the sun becomes a crescent moon when you switch themes. the clock tower runs on the same time zone as the clock in the corner. the whole thing pauses when you scroll away, or when your system asks for reduced motion.',
    ],
  },
];
