CREATE POLICY "Allow authenticated users to delete event_subscriptions"
ON event_subscriptions FOR DELETE
USING (auth.role() = 'authenticated');
