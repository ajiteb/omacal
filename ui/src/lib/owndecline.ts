// Who a No on your own meeting leaves expecting you.
//
// Google mails a guest's No to the organizer. When the organizer is the one
// saying No, there is nobody to mail: the answer changes one row of the guest
// list, nobody is told, and the meeting stays on everyone else's calendar.
// Reported from Plamen's calendar (2026-10-26) — he declined his own 1:1 and
// Teodor still expected it. The popover asks first when this returns anyone.
//
// Its own module, and pure, for the reason `organizer.ts` is: a table of
// inputs to outputs that `owndecline.spec.ts` runs in Node.

import type { Attendee, EventDetail } from './eventdetail';
import { isMachineAddress } from './organizer';

/**
 * The people still expecting this meeting whom your No would not reach —
 * empty whenever there is nothing to warn about.
 *
 * - Not your meeting: your No is a guest's, and Google tells the organizer.
 * - Not Google (`mails_guests` false): OmaCal emails nobody about anything
 *   there, so a No is no quieter than any other change.
 * - Already declined: they are not expecting the meeting.
 * - A room or a calendar (`isMachineAddress`): nobody reads that inbox.
 */
export function leftOutByYourNo(
  d: Pick<EventDetail, 'is_organizer' | 'mails_guests' | 'attendees'>,
): Attendee[] {
  if (!d.is_organizer || !d.mails_guests) return [];
  return d.attendees.filter(
    (a) => !a.is_self && a.response_status !== 'declined' && !isMachineAddress(a.email),
  );
}
