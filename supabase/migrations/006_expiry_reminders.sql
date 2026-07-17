-- Track whether an expiry-reminder email has been sent for a site's current
-- billing period, so the daily cron doesn't email the same customer twice.
-- Reset to null whenever a site renews (expires_at moves forward) so the
-- next period gets its own reminder.

alter table public.sites
  add column if not exists reminder_sent_at timestamptz;
