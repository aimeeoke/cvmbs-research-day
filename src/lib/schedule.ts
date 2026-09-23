/**
 * Draft schedule for CVMBS Research Day 2027.
 *
 * Edit this file to update the schedule shown on /schedule. When the
 * committee finalizes the day's structure, replace the entries below.
 * When submissions/assignments are ready, we'll pull oral-session details
 * from the database instead of the static array.
 */

export type ScheduleEventType = 'general' | 'session' | 'break' | 'social'

export type ScheduleEvent = {
  time: string
  title: string
  location?: string
  description?: string
  type: ScheduleEventType
}

// Placeholder — mirrors the 2026 event structure. Update dates/times for 2027.
export const scheduleData: ScheduleEvent[] = [
  {
    time: '9:00 – 10:00 am',
    title: 'Check-in & Poster set-up',
    description: 'Load oral presentations to room computers.',
    type: 'general',
  },
  {
    time: '10:15 – 11:15 am',
    title: 'Undergraduate Poster Session',
    location: 'Grand Events Hall',
    type: 'session',
  },
  {
    time: '11:15 – 11:30 am',
    title: 'Break',
    description: 'Undergrads remove posters.',
    type: 'break',
  },
  {
    time: '11:30 – 1:30 pm',
    title: 'Session I',
    description:
      'Oral Session 1A: Foundational Science (Auditorium)\nOral Session 1B: Translational Science (Boardroom)\nPoster Session 1: Odd numbers (Grand Events Hall)',
    type: 'session',
  },
  {
    time: '1:30 – 1:45 pm',
    title: 'Break',
    description: 'Remove odd posters, hang even posters.',
    type: 'break',
  },
  {
    time: '1:45 – 3:45 pm',
    title: 'Session II',
    description:
      'Oral Session 2A: Foundational Science (Boardroom)\nOral Session 2B: Veterinary Clinical Science (Auditorium)\nPoster Session 2: Even numbers (Grand Events Hall)',
    type: 'session',
  },
  {
    time: '3:45 – 4:15 pm',
    title: 'Refreshments & Desserts',
    location: 'Grand Events Hall',
    description: 'Remove all posters.',
    type: 'social',
  },
  {
    time: '4:15 – 5:00 pm',
    title: 'Research Day Keynote',
    location: 'Auditorium',
    description: 'Speaker TBD.',
    type: 'general',
  },
  {
    time: '5:00 – 5:30 pm',
    title: 'Awards Ceremony',
    location: 'Auditorium',
    type: 'social',
  },
]
