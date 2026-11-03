import { test, expect } from '@playwright/test';
import type { Attendee } from '../src/lib/eventdetail';
import { leftOutByYourNo } from '../src/lib/owndecline';

// `leftOutByYourNo` as a table, in Node and without a browser context — the
// same arrangement as `organizer.spec.ts`. What the *popover* does with the
// answer is in `components.spec.ts`.

const person = (o: Partial<Attendee> & { email: string }): Attendee => ({
  display_name: null, response_status: 'accepted', optional: false, is_self: false, ...o,
});
const me = person({ email: 'me@x.com', is_self: true });
const teodor = person({ email: 'teodor@x.com', display_name: 'Teodor' });

test.describe('leftOutByYourNo', () => {
  test('on your own Google meeting it is everyone else who still expects you', async () => {
    const attendees = [
      me,
      teodor,
      person({ email: 'ivan@x.com', response_status: 'needsAction' }),
      person({ email: 'petya@x.com', response_status: 'tentative' }),
      // Already said no: not expecting the meeting, so not left out of anything.
      person({ email: 'zoe@x.com', response_status: 'declined' }),
      // A room has no inbox and no plans.
      person({ email: 'c_1234@resource.calendar.google.com' }),
    ];
    const out = leftOutByYourNo({ is_organizer: true, mails_guests: true, attendees });
    expect(out.map((a) => a.email)).toEqual(['teodor@x.com', 'ivan@x.com', 'petya@x.com']);
  });

  test('nobody, when your No is a guest’s No and Google tells the organizer', async () => {
    expect(leftOutByYourNo({ is_organizer: false, mails_guests: true, attendees: [me, teodor] }))
      .toEqual([]);
  });

  test('nobody, off Google, where OmaCal mails no one whatever the answer', async () => {
    expect(leftOutByYourNo({ is_organizer: true, mails_guests: false, attendees: [me, teodor] }))
      .toEqual([]);
  });

  test('nobody, on your own meeting that has no one else on it', async () => {
    expect(leftOutByYourNo({ is_organizer: true, mails_guests: true, attendees: [me] })).toEqual([]);
  });
});
