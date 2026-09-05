# Rollback procedure

Promote the last verified immutable deployment, disable outbound workers if acknowledgments are ambiguous, preserve events and logs, and reconcile every in-flight transmission before replay. Never resend merely because a UI timed out.
