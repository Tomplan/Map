-- Visitors never see event_subscriptions fields (only admins do), so edits/arrivals there must not trigger visitor reloads.
DROP TRIGGER IF EXISTS bump_public_map_data_version ON public.event_subscriptions;

-- The visitor program tab polls the same version instead of a realtime channel.
DROP TRIGGER IF EXISTS bump_public_map_data_version ON public.event_activities;
CREATE TRIGGER bump_public_map_data_version
AFTER INSERT OR UPDATE OR DELETE ON public.event_activities
FOR EACH STATEMENT EXECUTE FUNCTION public.bump_public_map_data_version();
