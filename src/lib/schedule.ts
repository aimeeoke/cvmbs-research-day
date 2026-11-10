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
    time: '10:00 – 10:45 am',
    title: 'Undergraduate Poster Session',
    location: 'Grand Event Hall',
    type: 'session',
  },
  {
    time: '10:45 – 11:00 am',
    title: 'Break',
    description: 'Undergrads remove posters.',
    type: 'break',
  },
  {
    time: '11:00 am – 1:00 pm',
    title: 'Session I',
    description:
      'Oral Session 1A: Foundational Science (Auditorium)\nOral Session 1B: Translational Science (Boardroom)\nPoster Session 1: Odd numbers (Grand Event Hall)',
    type: 'session',
  },
  {
    time: '1:00 – 1:15 pm',
    title: 'Break',
    description: 'Remove odd posters, hang even posters.',
    type: 'break',
  },
  {
    time: '1:15 – 3:15 pm',
    title: 'Session II',
    description:
      'Oral Session 2A: Foundational Science (Boardroom)\nOral Session 2B: Veterinary Clinical Science (Auditorium)\nPoster Session 2: Even numbers (Grand Event Hall)',
    type: 'session',
  },
  {
    time: '3:15 – 3:30 pm',
    title: 'Break',
    description: 'Remove all posters.',
    type: 'break',
  },
  {
    time: '3:30 – 4:30 pm',
    title: 'Research Day Keynote',
    location: 'Auditorium',
    description:
      'Dr. Adam Harris, D.V.M., Ph.D.\n2026 Zoetis Veterinary Research Excellence Awardee',
    type: 'general',
  },
  {
    time: '4:30 – 5:30 pm',
    title: 'Reception & Awards Ceremony',
    location: 'Grand Event Hall',
    type: 'social',
  },
]
