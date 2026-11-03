// Generated from the backend OpenAPI schema. Do not edit; run `pnpm api-client:generate`.
export interface paths {
    "/api/v1/admin/analytics/episodes/{episode_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Episode Stats */
        get: operations["episode_stats_api_v1_admin_analytics_episodes__episode_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/analytics/overview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Overview */
        get: operations["overview_api_v1_admin_analytics_overview_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/analytics/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Refresh
         * @description Queue an aggregation now instead of waiting for the 15-minute schedule.
         */
        post: operations["refresh_api_v1_admin_analytics_refresh_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/analytics/retention": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Retention */
        get: operations["retention_api_v1_admin_analytics_retention_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/analytics/series/{series_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Series Stats */
        get: operations["series_stats_api_v1_admin_analytics_series__series_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/audit-log": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Audit Log */
        get: operations["audit_log_api_v1_admin_audit_log_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/costs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Admin Costs */
        get: operations["admin_costs_api_v1_admin_costs_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/episodes/{episode_id}/access": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Set Episode Access */
        put: operations["set_episode_access_api_v1_admin_episodes__episode_id__access_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/episodes/{episode_id}/publish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Publish */
        post: operations["publish_api_v1_admin_episodes__episode_id__publish_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/episodes/{episode_id}/unpublish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Unpublish */
        post: operations["unpublish_api_v1_admin_episodes__episode_id__unpublish_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/invites": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Invites */
        get: operations["list_invites_api_v1_admin_invites_get"];
        put?: never;
        /** Create Invite */
        post: operations["create_invite_api_v1_admin_invites_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/invites/{invite_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Revoke Invite */
        delete: operations["revoke_invite_api_v1_admin_invites__invite_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/invites/{invite_id}/resend": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Resend Invite */
        post: operations["resend_invite_api_v1_admin_invites__invite_id__resend_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/review-items/{item_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Review Detail */
        get: operations["review_detail_api_v1_admin_review_items__item_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/review-items/{item_id}/approve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Approve */
        post: operations["approve_api_v1_admin_review_items__item_id__approve_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/review-items/{item_id}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Reject */
        post: operations["reject_api_v1_admin_review_items__item_id__reject_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/review-items/{item_id}/request-changes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Request Changes */
        post: operations["request_changes_api_v1_admin_review_items__item_id__request_changes_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/review-queue": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Review Queue */
        get: operations["review_queue_api_v1_admin_review_queue_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/series": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Admin List Series */
        get: operations["admin_list_series_api_v1_admin_series_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/series/{series_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Admin Update Series */
        put: operations["admin_update_series_api_v1_admin_series__series_id__put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/series/{series_id}/budget": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Budget */
        get: operations["get_budget_api_v1_admin_series__series_id__budget_get"];
        /** Set Budget */
        put: operations["set_budget_api_v1_admin_series__series_id__budget_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/series/{series_id}/cover": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Admin Upload Cover */
        post: operations["admin_upload_cover_api_v1_admin_series__series_id__cover_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/shelves": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Admin List Shelves */
        get: operations["admin_list_shelves_api_v1_admin_shelves_get"];
        put?: never;
        /** Admin Create Shelf */
        post: operations["admin_create_shelf_api_v1_admin_shelves_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/shelves/order": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Admin Reorder Shelves */
        put: operations["admin_reorder_shelves_api_v1_admin_shelves_order_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/shelves/{shelf_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Admin Update Shelf */
        put: operations["admin_update_shelf_api_v1_admin_shelves__shelf_id__put"];
        post?: never;
        /** Admin Delete Shelf */
        delete: operations["admin_delete_shelf_api_v1_admin_shelves__shelf_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/shelves/{shelf_id}/items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Admin Set Shelf Items */
        put: operations["admin_set_shelf_items_api_v1_admin_shelves__shelf_id__items_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/voices": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Admin List Voices */
        get: operations["admin_list_voices_api_v1_admin_voices_get"];
        put?: never;
        /** Admin Create Voice */
        post: operations["admin_create_voice_api_v1_admin_voices_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/voices/{voice_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Admin Update Voice */
        put: operations["admin_update_voice_api_v1_admin_voices__voice_id__put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/writer-series-counts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Writer Series Counts */
        get: operations["writer_series_counts_api_v1_admin_writer_series_counts_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/writers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Writers */
        get: operations["list_writers_api_v1_admin_writers_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/writers/{user_id}/deactivate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Deactivate Writer */
        post: operations["deactivate_writer_api_v1_admin_writers__user_id__deactivate_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/writers/{user_id}/reactivate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Reactivate Writer */
        post: operations["reactivate_writer_api_v1_admin_writers__user_id__reactivate_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/accept-invite": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Accept Invite */
        post: operations["accept_invite_api_v1_auth_accept_invite_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Login */
        post: operations["login_api_v1_auth_login_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Logout */
        post: operations["logout_api_v1_auth_logout_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Refresh */
        post: operations["refresh_api_v1_auth_refresh_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/signup": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Signup */
        post: operations["signup_api_v1_auth_signup_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/social": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Social Login */
        post: operations["social_login_api_v1_auth_social_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/episodes/{episode_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Episode */
        get: operations["get_episode_api_v1_episodes__episode_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/episodes/{episode_id}/playback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Playback */
        get: operations["get_playback_api_v1_episodes__episode_id__playback_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Post Events */
        post: operations["post_events_api_v1_events_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Health */
        get: operations["health_api_v1_health_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Me */
        get: operations["me_api_v1_me_get"];
        put?: never;
        post?: never;
        /** Delete Me */
        delete: operations["delete_me_api_v1_me_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/downloads": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Downloads */
        get: operations["get_downloads_api_v1_me_downloads_get"];
        put?: never;
        /** Add Download */
        post: operations["add_download_api_v1_me_downloads_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/downloads/{episode_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Remove Download */
        delete: operations["remove_download_api_v1_me_downloads__episode_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/progress": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Progress */
        get: operations["get_progress_api_v1_me_progress_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/progress/{episode_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Put Progress */
        put: operations["put_progress_api_v1_me_progress__episode_id__put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/public/series": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Series */
        get: operations["list_series_api_v1_public_series_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/public/series/{series_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Series */
        get: operations["get_series_api_v1_public_series__series_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/public/series/{series_id}/sample": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Sample */
        get: operations["get_sample_api_v1_public_series__series_id__sample_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/public/shelves": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Shelves */
        get: operations["list_shelves_api_v1_public_shelves_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/public/shelves/{shelf_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Shelf */
        get: operations["get_shelf_api_v1_public_shelves__shelf_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/public/sitemap": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Sitemap */
        get: operations["sitemap_api_v1_public_sitemap_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Search */
        get: operations["search_api_v1_search_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/series/{series_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Series */
        get: operations["get_series_api_v1_series__series_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/series/{series_id}/episodes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Series Episodes */
        get: operations["list_series_episodes_api_v1_series__series_id__episodes_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/shelves": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Shelves */
        get: operations["list_shelves_api_v1_shelves_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/audio-lines/{line_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Edit Line */
        put: operations["edit_line_api_v1_studio_audio_lines__line_id__put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/audio-lines/{line_id}/regenerate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Regenerate Line */
        post: operations["regenerate_line_api_v1_studio_audio_lines__line_id__regenerate_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/audio-renders/{render_id}/retry": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Retry Render */
        post: operations["retry_render_api_v1_studio_audio_renders__render_id__retry_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/canon-proposals/{proposal_id}/accept": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Accept Proposal */
        post: operations["accept_proposal_api_v1_studio_canon_proposals__proposal_id__accept_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/canon-proposals/{proposal_id}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Reject Proposal */
        post: operations["reject_proposal_api_v1_studio_canon_proposals__proposal_id__reject_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/continuity-issues/{issue_id}/propose-canon": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Propose Canon From Issue
         * @description Creates a pending canon proposal; the issue stays open until the next check.
         */
        post: operations["propose_canon_from_issue_api_v1_studio_continuity_issues__issue_id__propose_canon_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/continuity-issues/{issue_id}/resolve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Resolve Issue */
        post: operations["resolve_issue_api_v1_studio_continuity_issues__issue_id__resolve_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/episodes/{episode_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Episode */
        get: operations["get_episode_api_v1_studio_episodes__episode_id__get"];
        /** Update Episode */
        put: operations["update_episode_api_v1_studio_episodes__episode_id__put"];
        post?: never;
        /** Delete Episode */
        delete: operations["delete_episode_api_v1_studio_episodes__episode_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/episodes/{episode_id}/audio": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Episode Audio */
        get: operations["episode_audio_api_v1_studio_episodes__episode_id__audio_get"];
        put?: never;
        /** Start Render */
        post: operations["start_render_api_v1_studio_episodes__episode_id__audio_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/episodes/{episode_id}/continuity-issues": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Issues */
        get: operations["list_issues_api_v1_studio_episodes__episode_id__continuity_issues_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/episodes/{episode_id}/costs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Episode Costs */
        get: operations["episode_costs_api_v1_studio_episodes__episode_id__costs_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/episodes/{episode_id}/drafts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Drafts */
        get: operations["list_drafts_api_v1_studio_episodes__episode_id__drafts_get"];
        put?: never;
        /** Save Draft */
        post: operations["save_draft_api_v1_studio_episodes__episode_id__drafts_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/episodes/{episode_id}/drafts/compare": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Compare Drafts */
        get: operations["compare_drafts_api_v1_studio_episodes__episode_id__drafts_compare_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/episodes/{episode_id}/drafts/{version}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Draft */
        get: operations["get_draft_api_v1_studio_episodes__episode_id__drafts__version__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/episodes/{episode_id}/drafts/{version}/restore": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Restore Draft */
        post: operations["restore_draft_api_v1_studio_episodes__episode_id__drafts__version__restore_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/episodes/{episode_id}/plan": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Set Plan */
        put: operations["set_plan_api_v1_studio_episodes__episode_id__plan_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/episodes/{episode_id}/regenerate-section": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Regenerate Section */
        post: operations["regenerate_section_api_v1_studio_episodes__episode_id__regenerate_section_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/episodes/{episode_id}/reviews": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Episode Reviews */
        get: operations["episode_reviews_api_v1_studio_episodes__episode_id__reviews_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/episodes/{episode_id}/script": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Script */
        get: operations["get_script_api_v1_studio_episodes__episode_id__script_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/episodes/{episode_id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Set Status */
        post: operations["set_status_api_v1_studio_episodes__episode_id__status_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/episodes/{episode_id}/submit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Submit */
        post: operations["submit_api_v1_studio_episodes__episode_id__submit_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/episodes/{episode_id}/workflow-runs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Runs */
        get: operations["list_runs_api_v1_studio_episodes__episode_id__workflow_runs_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/episodes/{episode_id}/workflows/continuity": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Start Continuity */
        post: operations["start_continuity_api_v1_studio_episodes__episode_id__workflows_continuity_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/episodes/{episode_id}/workflows/drafting": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Start Drafting */
        post: operations["start_drafting_api_v1_studio_episodes__episode_id__workflows_drafting_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/notifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Notifications */
        get: operations["notifications_api_v1_studio_notifications_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/notifications/{notification_id}/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Mark Read */
        post: operations["mark_read_api_v1_studio_notifications__notification_id__read_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/series": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Series */
        get: operations["list_series_api_v1_studio_series_get"];
        put?: never;
        /** Create Series */
        post: operations["create_series_api_v1_studio_series_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/series/{series_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Series */
        get: operations["get_series_api_v1_studio_series__series_id__get"];
        /** Update Series */
        put: operations["update_series_api_v1_studio_series__series_id__put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/series/{series_id}/bible": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Bible */
        get: operations["get_bible_api_v1_studio_series__series_id__bible_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/series/{series_id}/canon-proposals": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Proposals */
        get: operations["list_proposals_api_v1_studio_series__series_id__canon_proposals_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/series/{series_id}/characters": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Characters */
        get: operations["list_characters_api_v1_studio_series__series_id__characters_get"];
        put?: never;
        /** Create Characters */
        post: operations["create_characters_api_v1_studio_series__series_id__characters_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/series/{series_id}/characters/{entity_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Characters */
        get: operations["get_characters_api_v1_studio_series__series_id__characters__entity_id__get"];
        /** Update Characters */
        put: operations["update_characters_api_v1_studio_series__series_id__characters__entity_id__put"];
        post?: never;
        /** Delete Characters */
        delete: operations["delete_characters_api_v1_studio_series__series_id__characters__entity_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/series/{series_id}/costs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Series Costs */
        get: operations["series_costs_api_v1_studio_series__series_id__costs_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/series/{series_id}/cover": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Upload Cover */
        post: operations["upload_cover_api_v1_studio_series__series_id__cover_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/series/{series_id}/episodes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Episodes */
        get: operations["list_episodes_api_v1_studio_series__series_id__episodes_get"];
        put?: never;
        /** Create Episode */
        post: operations["create_episode_api_v1_studio_series__series_id__episodes_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/series/{series_id}/episodes/order": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Reorder Episodes */
        put: operations["reorder_episodes_api_v1_studio_series__series_id__episodes_order_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/series/{series_id}/locations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Locations */
        get: operations["list_locations_api_v1_studio_series__series_id__locations_get"];
        put?: never;
        /** Create Locations */
        post: operations["create_locations_api_v1_studio_series__series_id__locations_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/series/{series_id}/locations/{entity_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Locations */
        get: operations["get_locations_api_v1_studio_series__series_id__locations__entity_id__get"];
        /** Update Locations */
        put: operations["update_locations_api_v1_studio_series__series_id__locations__entity_id__put"];
        post?: never;
        /** Delete Locations */
        delete: operations["delete_locations_api_v1_studio_series__series_id__locations__entity_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/series/{series_id}/plot-threads": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Plot Threads */
        get: operations["list_plot_threads_api_v1_studio_series__series_id__plot_threads_get"];
        put?: never;
        /** Create Plot Threads */
        post: operations["create_plot_threads_api_v1_studio_series__series_id__plot_threads_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/series/{series_id}/plot-threads/{entity_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Plot Threads */
        get: operations["get_plot_threads_api_v1_studio_series__series_id__plot_threads__entity_id__get"];
        /** Update Plot Threads */
        put: operations["update_plot_threads_api_v1_studio_series__series_id__plot_threads__entity_id__put"];
        post?: never;
        /** Delete Plot Threads */
        delete: operations["delete_plot_threads_api_v1_studio_series__series_id__plot_threads__entity_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/series/{series_id}/relationships": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Relationships */
        get: operations["list_relationships_api_v1_studio_series__series_id__relationships_get"];
        put?: never;
        /** Create Relationships */
        post: operations["create_relationships_api_v1_studio_series__series_id__relationships_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/series/{series_id}/relationships/{entity_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Relationships */
        get: operations["get_relationships_api_v1_studio_series__series_id__relationships__entity_id__get"];
        /** Update Relationships */
        put: operations["update_relationships_api_v1_studio_series__series_id__relationships__entity_id__put"];
        post?: never;
        /** Delete Relationships */
        delete: operations["delete_relationships_api_v1_studio_series__series_id__relationships__entity_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/series/{series_id}/timeline": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Timeline */
        get: operations["list_timeline_api_v1_studio_series__series_id__timeline_get"];
        put?: never;
        /** Create Timeline */
        post: operations["create_timeline_api_v1_studio_series__series_id__timeline_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/series/{series_id}/timeline/{entity_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Timeline */
        get: operations["get_timeline_api_v1_studio_series__series_id__timeline__entity_id__get"];
        /** Update Timeline */
        put: operations["update_timeline_api_v1_studio_series__series_id__timeline__entity_id__put"];
        post?: never;
        /** Delete Timeline */
        delete: operations["delete_timeline_api_v1_studio_series__series_id__timeline__entity_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/series/{series_id}/voice-assignments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Cast */
        get: operations["get_cast_api_v1_studio_series__series_id__voice_assignments_get"];
        /** Set Cast */
        put: operations["set_cast_api_v1_studio_series__series_id__voice_assignments_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/series/{series_id}/world-rules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List World Rules */
        get: operations["list_world_rules_api_v1_studio_series__series_id__world_rules_get"];
        put?: never;
        /** Create World Rules */
        post: operations["create_world_rules_api_v1_studio_series__series_id__world_rules_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/series/{series_id}/world-rules/{entity_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get World Rules */
        get: operations["get_world_rules_api_v1_studio_series__series_id__world_rules__entity_id__get"];
        /** Update World Rules */
        put: operations["update_world_rules_api_v1_studio_series__series_id__world_rules__entity_id__put"];
        post?: never;
        /** Delete World Rules */
        delete: operations["delete_world_rules_api_v1_studio_series__series_id__world_rules__entity_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/voices": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Voices */
        get: operations["list_voices_api_v1_studio_voices_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/voices/{voice_id}/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Voice Preview */
        get: operations["voice_preview_api_v1_studio_voices__voice_id__preview_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/workflow-runs/{run_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Run */
        get: operations["get_run_api_v1_studio_workflow_runs__run_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/workflow-runs/{run_id}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Cancel Run */
        post: operations["cancel_run_api_v1_studio_workflow_runs__run_id__cancel_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/workflow-runs/{run_id}/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Stream Run Events
         * @description Server-sent events with run progress. Closes when the run waits for the writer or ends;
         *     reconnect with ``Last-Event-ID`` (or ``after``) to continue.
         */
        get: operations["stream_run_events_api_v1_studio_workflow_runs__run_id__events_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/studio/workflow-runs/{run_id}/resume": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Resume Run */
        post: operations["resume_run_api_v1_studio_workflow_runs__run_id__resume_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** AcceptInviteIn */
        AcceptInviteIn: {
            /** Display Name */
            display_name?: string | null;
            /** Password */
            password: string;
            /** Token */
            token: string;
        };
        /** AdminCostsOut */
        AdminCostsOut: {
            /** Cost Per Finished Minute Usd */
            cost_per_finished_minute_usd?: string | null;
            /** From Date */
            from_date: string | null;
            /** Group By */
            group_by: string;
            /** Rows */
            rows: components["schemas"]["CostRow"][];
            /** To Date */
            to_date: string | null;
            /** Total Usd */
            total_usd: string;
        };
        /**
         * AdminSeriesUpdate
         * @description Admins can also change catalog settings. ``is_ai_assisted`` can only ever be true.
         */
        AdminSeriesUpdate: {
            /** Archived */
            archived?: boolean | null;
            /** Free Episode Count */
            free_episode_count?: number | null;
            /** Is Ai Assisted */
            is_ai_assisted?: true | null;
            /** Language */
            language?: string | null;
            /** Owner Writer Id */
            owner_writer_id?: string | null;
            /** Premise */
            premise?: string | null;
            /** Target Episode Minutes */
            target_episode_minutes?: number | null;
            /** Themes */
            themes?: string[] | null;
            /** Title */
            title?: string | null;
            /** Tone */
            tone?: string | null;
        };
        /** AdminShelfOut */
        AdminShelfOut: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            kind: components["schemas"]["ShelfKind"];
            /** Position */
            position: number;
            /** Series Ids */
            series_ids: string[];
            /** Title */
            title: string;
        };
        /** ApproveIn */
        ApproveIn: {
            /**
             * Comments
             * @default
             */
            comments: string;
            /**
             * Publish Now
             * @default false
             */
            publish_now: boolean;
        };
        /** AssignmentIn */
        AssignmentIn: {
            /**
             * Character Id
             * @description null assigns the narrator voice
             */
            character_id: string | null;
            /**
             * Voice Id
             * Format: uuid
             */
            voice_id: string;
        };
        /** AssignmentsIn */
        AssignmentsIn: {
            /** Assignments */
            assignments: components["schemas"]["AssignmentIn"][];
        };
        /** AssignmentsOut */
        AssignmentsOut: {
            /** Cast */
            cast: components["schemas"]["CastMember"][];
        };
        /** AudioAssetOut */
        AudioAssetOut: {
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Duration Seconds */
            duration_seconds: string;
            /** Format */
            format: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Loudness Lufs */
            loudness_lufs: string | null;
            /** Peak Dbfs */
            peak_dbfs: string | null;
            /** Url */
            url: string;
        };
        /** AudioLineOut */
        AudioLineOut: {
            /** Duration Ms */
            duration_ms: number;
            /** Error */
            error: string | null;
            /** Flag */
            flag: string | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Kind */
            kind: string;
            /** Position */
            position: number;
            /** Source Line */
            source_line: number;
            /** Speaker */
            speaker: string | null;
            /** Status */
            status: string;
            /** Text */
            text: string;
            /** Url */
            url: string | null;
            /** Voice Id */
            voice_id: string | null;
        };
        /** AuditEntryOut */
        AuditEntryOut: {
            /** Action */
            action: string;
            /** Actor Id */
            actor_id: string | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Entity Id */
            entity_id: string | null;
            /** Entity Type */
            entity_type: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Metadata */
            metadata: {
                [key: string]: unknown;
            };
        };
        /** Beat */
        Beat: {
            /** Id */
            id: string;
            /** Text */
            text: string;
        };
        /** BibleOut */
        BibleOut: {
            /** Characters */
            characters: components["schemas"]["CharacterOut"][];
            /** Locations */
            locations: components["schemas"]["LocationOut"][];
            /** Plot Threads */
            plot_threads: components["schemas"]["PlotThreadOut"][];
            /** Relationships */
            relationships: components["schemas"]["RelationshipOut"][];
            /** Timeline */
            timeline: components["schemas"]["TimelineEventOut"][];
            /** World Rules */
            world_rules: components["schemas"]["WorldRuleOut"][];
        };
        /** Body_admin_upload_cover_api_v1_admin_series__series_id__cover_post */
        Body_admin_upload_cover_api_v1_admin_series__series_id__cover_post: {
            /** File */
            file: string;
        };
        /** Body_upload_cover_api_v1_studio_series__series_id__cover_post */
        Body_upload_cover_api_v1_studio_series__series_id__cover_post: {
            /** File */
            file: string;
        };
        /** BudgetIn */
        BudgetIn: {
            /** Soft Limit Usd */
            soft_limit_usd?: number | string | null;
        };
        /** BudgetOut */
        BudgetOut: {
            /** Over Budget */
            over_budget: boolean;
            /** Soft Limit Usd */
            soft_limit_usd: string | null;
        };
        /** CastMember */
        CastMember: {
            /** Character Id */
            character_id: string | null;
            /** Name */
            name: string;
            /** Voice Id */
            voice_id: string | null;
            /** Voice Notes */
            voice_notes: string;
        };
        /** CharacterCreate */
        CharacterCreate: {
            /**
             * Description
             * @default
             */
            description: string;
            /**
             * Is Narrator
             * @default false
             */
            is_narrator: boolean;
            /** Name */
            name: string;
            /** Traits */
            traits?: string[];
            /**
             * Voice Notes
             * @default
             */
            voice_notes: string;
        };
        /** CharacterOut */
        CharacterOut: {
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Description */
            description: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Is Narrator */
            is_narrator: boolean;
            /** Name */
            name: string;
            /**
             * Series Id
             * Format: uuid
             */
            series_id: string;
            /** Traits */
            traits: string[];
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
            /** Voice Notes */
            voice_notes: string;
        };
        /** CharacterUpdate */
        CharacterUpdate: {
            /** Description */
            description?: string | null;
            /** Is Narrator */
            is_narrator?: boolean | null;
            /** Name */
            name?: string | null;
            /** Traits */
            traits?: string[] | null;
            /** Voice Notes */
            voice_notes?: string | null;
        };
        /** CommentsIn */
        CommentsIn: {
            /** Comments */
            comments: string;
        };
        /** CompareOut */
        CompareOut: {
            /** A */
            a: number;
            /** B */
            b: number;
            /** Ops */
            ops: components["schemas"]["DiffOp"][];
        };
        /** CostRow */
        CostRow: {
            /** Cost Usd */
            cost_usd: string;
            /** Embedding Tokens */
            embedding_tokens: number;
            /** Input Tokens */
            input_tokens: number;
            /** Key */
            key: string;
            /** Label */
            label: string;
            /** Output Tokens */
            output_tokens: number;
            /** Tts Characters */
            tts_characters: number;
        };
        /** CostSummary */
        CostSummary: {
            /** By Purpose */
            by_purpose: components["schemas"]["PurposeCost"][];
            /** Embedding Tokens */
            embedding_tokens: number;
            /** Input Tokens */
            input_tokens: number;
            /** Output Tokens */
            output_tokens: number;
            /** Total Usd */
            total_usd: string;
            /** Tts Characters */
            tts_characters: number;
        };
        /**
         * CurrentUser
         * @description The signed-in user, as seen by every module's route dependencies.
         */
        CurrentUser: {
            /** Display Name */
            display_name?: string | null;
            /** Email */
            email: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            role: components["schemas"]["Role"];
        };
        /** DiffOp */
        DiffOp: {
            /** A Lines */
            a_lines: string[];
            /** B Lines */
            b_lines: string[];
            /**
             * Op
             * @enum {string}
             */
            op: "equal" | "insert" | "delete" | "replace";
        };
        /** DownloadIn */
        DownloadIn: {
            /**
             * Episode Id
             * Format: uuid
             */
            episode_id: string;
        };
        /** DownloadOut */
        DownloadOut: {
            /** Available */
            available: boolean;
            /**
             * Downloaded At
             * Format: date-time
             */
            downloaded_at: string;
            /**
             * Episode Id
             * Format: uuid
             */
            episode_id: string;
        };
        /** DraftIn */
        DraftIn: {
            /**
             * Base Version
             * @description Version the edit started from; null for the first draft
             */
            base_version?: number | null;
            /**
             * Note
             * @default
             */
            note: string;
            /** Text */
            text: string;
        };
        /** DraftOut */
        DraftOut: {
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Created By */
            created_by: string | null;
            /** Estimated Seconds */
            estimated_seconds: number;
            /** Note */
            note: string;
            source: components["schemas"]["DraftSource"];
            /** Text */
            text: string;
            /** Version */
            version: number;
            /** Word Count */
            word_count: number;
        };
        /**
         * DraftSource
         * @enum {string}
         */
        DraftSource: "ai" | "human";
        /** DraftSummary */
        DraftSummary: {
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Created By */
            created_by: string | null;
            /** Estimated Seconds */
            estimated_seconds: number;
            /** Note */
            note: string;
            source: components["schemas"]["DraftSource"];
            /** Version */
            version: number;
            /** Word Count */
            word_count: number;
        };
        /** EpisodeAccessIn */
        EpisodeAccessIn: {
            /**
             * Is Free
             * @description null follows the series' free episode count
             */
            is_free: boolean | null;
        };
        /** EpisodeAccessOut */
        EpisodeAccessOut: {
            /**
             * Episode Id
             * Format: uuid
             */
            episode_id: string;
            /** Is Free */
            is_free: boolean | null;
        };
        /** EpisodeAudioOut */
        EpisodeAudioOut: {
            asset: components["schemas"]["AudioAssetOut"] | null;
            /** Is Current */
            is_current: boolean;
            /** Lines */
            lines: components["schemas"]["AudioLineOut"][];
            render: components["schemas"]["RenderOut"] | null;
        };
        /** EpisodeCost */
        EpisodeCost: {
            /** Cost Usd */
            cost_usd: string;
            /**
             * Episode Id
             * Format: uuid
             */
            episode_id: string;
            /** Number */
            number: number;
            /** Title */
            title: string;
        };
        /** EpisodeCreate */
        EpisodeCreate: {
            /**
             * Title
             * @default
             */
            title: string;
        };
        /** EpisodeOrderIn */
        EpisodeOrderIn: {
            /** Episode Ids */
            episode_ids: string[];
        };
        /** EpisodeOut */
        EpisodeOut: {
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Current Version */
            current_version: number | null;
            /** Estimated Seconds */
            estimated_seconds: number;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Is Free */
            is_free: boolean | null;
            /** Number */
            number: number;
            plan: components["schemas"]["PlanOut"];
            /** Published At */
            published_at: string | null;
            /**
             * Series Id
             * Format: uuid
             */
            series_id: string;
            status: components["schemas"]["EpisodeStatus"];
            /** Target Seconds */
            target_seconds: number;
            /** Title */
            title: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
            /** Word Count */
            word_count: number;
        };
        /**
         * EpisodeStatus
         * @enum {string}
         */
        EpisodeStatus: "planned" | "drafting" | "ready_for_audio" | "audio_ready" | "in_review" | "changes_requested" | "approved" | "published";
        /** EpisodeUpdate */
        EpisodeUpdate: {
            /** Title */
            title?: string | null;
        };
        /** EventBatchIn */
        EventBatchIn: {
            /** Events */
            events: components["schemas"]["EventIn"][];
        };
        /** EventBatchOut */
        EventBatchOut: {
            /** Accepted */
            accepted: number;
            /** Duplicates */
            duplicates: number;
            /** Rejected */
            rejected: components["schemas"]["RejectedEvent"][];
        };
        /** EventIn */
        EventIn: {
            /** Client Event Id */
            client_event_id: string;
            /**
             * Client Ts
             * Format: date-time
             */
            client_ts: string;
            /** Device */
            device?: {
                [key: string]: unknown;
            };
            /**
             * Episode Id
             * Format: uuid
             */
            episode_id: string;
            /**
             * Position Seconds
             * @default 0
             */
            position_seconds: number | string;
            /**
             * Session Id
             * @default
             */
            session_id: string;
            /** To Episode Id */
            to_episode_id?: string | null;
            /** Type */
            type: string;
        };
        /** HTTPValidationError */
        HTTPValidationError: {
            /** Detail */
            detail?: components["schemas"]["ValidationError"][];
        };
        /** InviteCreateIn */
        InviteCreateIn: {
            /**
             * Email
             * Format: email
             */
            email: string;
        };
        /** InviteOut */
        InviteOut: {
            /** Accepted At */
            accepted_at: string | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Email */
            email: string;
            /**
             * Expires At
             * Format: date-time
             */
            expires_at: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Invited By */
            invited_by: string | null;
            /** Revoked At */
            revoked_at: string | null;
            /** Status */
            status: string;
        };
        /**
         * IssueCanonIn
         * @description Turn an issue into a canon change proposal the writer then accepts or rejects.
         */
        IssueCanonIn: {
            /** Entity Id */
            entity_id?: string | null;
            /**
             * Entity Type
             * @enum {string}
             */
            entity_type: "characters" | "relationships" | "locations" | "world-rules" | "timeline" | "plot-threads";
            /**
             * Op
             * @enum {string}
             */
            op: "create" | "update" | "delete";
            /** Payload */
            payload?: {
                [key: string]: unknown;
            };
        };
        /** IssueOut */
        IssueOut: {
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Description */
            description: string;
            /** Draft Version */
            draft_version: number;
            /**
             * Episode Id
             * Format: uuid
             */
            episode_id: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Quote */
            quote: string;
            /** Resolution Note */
            resolution_note: string;
            /** Resolved At */
            resolved_at: string | null;
            /** Severity */
            severity: string;
            /** Source Ref */
            source_ref: {
                [key: string]: unknown;
            };
            /** Status */
            status: string;
            /** Type */
            type: string;
            /** Workflow Run Id */
            workflow_run_id: string | null;
        };
        /**
         * IssueStatus
         * @enum {string}
         */
        IssueStatus: "open" | "fixed" | "intentional";
        /** LineTextIn */
        LineTextIn: {
            /** Text */
            text: string;
        };
        /** ListenerEpisodeOut */
        ListenerEpisodeOut: {
            /** Duration Seconds */
            duration_seconds: string | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Is Free */
            is_free: boolean;
            /** Number */
            number: number;
            /** Published At */
            published_at: string | null;
            /**
             * Series Id
             * Format: uuid
             */
            series_id: string;
            /** Title */
            title: string;
        };
        /**
         * ListenerSeriesOut
         * @description Listener view of a published series. Always carries the AI-assisted label.
         */
        ListenerSeriesOut: {
            /** Cover Url */
            cover_url: string | null;
            /** Free Episode Count */
            free_episode_count: number;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /**
             * Is Ai Assisted
             * @default true
             * @constant
             */
            is_ai_assisted: true;
            /** Language */
            language: string;
            /** Play Count */
            play_count: number;
            /** Premise */
            premise: string;
            /** Published At */
            published_at: string | null;
            /** Themes */
            themes: string[];
            /** Title */
            title: string;
            /** Tone */
            tone: string;
        };
        /** ListenerShelfOut */
        ListenerShelfOut: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            kind: components["schemas"]["ShelfKind"];
            /** Series */
            series: components["schemas"]["ListenerSeriesOut"][];
            /** Title */
            title: string;
        };
        /** LocationCreate */
        LocationCreate: {
            /**
             * Description
             * @default
             */
            description: string;
            /** Name */
            name: string;
        };
        /** LocationOut */
        LocationOut: {
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Description */
            description: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Name */
            name: string;
            /**
             * Series Id
             * Format: uuid
             */
            series_id: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** LocationUpdate */
        LocationUpdate: {
            /** Description */
            description?: string | null;
            /** Name */
            name?: string | null;
        };
        /** LoginIn */
        LoginIn: {
            /**
             * Email
             * Format: email
             */
            email: string;
            /** Password */
            password: string;
        };
        /** NotificationOut */
        NotificationOut: {
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Episode Id */
            episode_id: string | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Kind */
            kind: string;
            /** Message */
            message: string;
            /** Read At */
            read_at: string | null;
            /** Review Item Id */
            review_item_id: string | null;
        };
        /** NotificationsOut */
        NotificationsOut: {
            /** Items */
            items: components["schemas"]["NotificationOut"][];
            /** Unread */
            unread: number;
        };
        /** Page[AuditEntryOut] */
        Page_AuditEntryOut_: {
            /** Items */
            items: components["schemas"]["AuditEntryOut"][];
            /** Limit */
            limit: number;
            /** Offset */
            offset: number;
            /** Total */
            total: number;
        };
        /** Page[InviteOut] */
        Page_InviteOut_: {
            /** Items */
            items: components["schemas"]["InviteOut"][];
            /** Limit */
            limit: number;
            /** Offset */
            offset: number;
            /** Total */
            total: number;
        };
        /** Page[ListenerSeriesOut] */
        Page_ListenerSeriesOut_: {
            /** Items */
            items: components["schemas"]["ListenerSeriesOut"][];
            /** Limit */
            limit: number;
            /** Offset */
            offset: number;
            /** Total */
            total: number;
        };
        /** Page[ListenerShelfOut] */
        Page_ListenerShelfOut_: {
            /** Items */
            items: components["schemas"]["ListenerShelfOut"][];
            /** Limit */
            limit: number;
            /** Offset */
            offset: number;
            /** Total */
            total: number;
        };
        /** Page[ReviewItemOut] */
        Page_ReviewItemOut_: {
            /** Items */
            items: components["schemas"]["ReviewItemOut"][];
            /** Limit */
            limit: number;
            /** Offset */
            offset: number;
            /** Total */
            total: number;
        };
        /** Page[SeriesOut] */
        Page_SeriesOut_: {
            /** Items */
            items: components["schemas"]["SeriesOut"][];
            /** Limit */
            limit: number;
            /** Offset */
            offset: number;
            /** Total */
            total: number;
        };
        /** Page[WriterOut] */
        Page_WriterOut_: {
            /** Items */
            items: components["schemas"]["WriterOut"][];
            /** Limit */
            limit: number;
            /** Offset */
            offset: number;
            /** Total */
            total: number;
        };
        /** PlanIn */
        PlanIn: {
            /** Beats */
            beats?: components["schemas"]["Beat"][];
            /**
             * Notes
             * @default
             */
            notes: string;
        };
        /** PlanOut */
        PlanOut: {
            /** Beats */
            beats: components["schemas"]["Beat"][];
            /** Notes */
            notes: string;
        };
        /** PlaybackOut */
        PlaybackOut: {
            /** Duration Seconds */
            duration_seconds: string | null;
            /**
             * Episode Id
             * Format: uuid
             */
            episode_id: string;
            /** Format */
            format: string;
            /**
             * Next Episode Id
             * @description Next live episode, for auto-advance
             */
            next_episode_id: string | null;
            /**
             * Series Id
             * Format: uuid
             */
            series_id: string;
            /**
             * Url
             * @description Signed, expiring URL of the published audio
             */
            url: string;
        };
        /** PlotThreadCreate */
        PlotThreadCreate: {
            /**
             * Description
             * @default
             */
            description: string;
            /** Opened In Episode */
            opened_in_episode?: number | null;
            /** Resolved In Episode */
            resolved_in_episode?: number | null;
            /** @default open */
            status: components["schemas"]["PlotThreadStatus"];
            /** Title */
            title: string;
        };
        /** PlotThreadOut */
        PlotThreadOut: {
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Description */
            description: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Opened In Episode */
            opened_in_episode: number | null;
            /** Resolved In Episode */
            resolved_in_episode: number | null;
            /**
             * Series Id
             * Format: uuid
             */
            series_id: string;
            status: components["schemas"]["PlotThreadStatus"];
            /** Title */
            title: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /**
         * PlotThreadStatus
         * @enum {string}
         */
        PlotThreadStatus: "open" | "resolved";
        /** PlotThreadUpdate */
        PlotThreadUpdate: {
            /** Description */
            description?: string | null;
            /** Opened In Episode */
            opened_in_episode?: number | null;
            /** Resolved In Episode */
            resolved_in_episode?: number | null;
            status?: components["schemas"]["PlotThreadStatus"] | null;
            /** Title */
            title?: string | null;
        };
        /** ProgressIn */
        ProgressIn: {
            /**
             * Client Ts
             * Format: date-time
             */
            client_ts: string;
            /**
             * Completed
             * @default false
             */
            completed: boolean;
            /** Position Seconds */
            position_seconds: number | string;
        };
        /** ProgressOut */
        ProgressOut: {
            /** Completed */
            completed: boolean;
            /** Duration Seconds */
            duration_seconds: string | null;
            /**
             * Episode Id
             * Format: uuid
             */
            episode_id: string;
            /** Episode Number */
            episode_number: number;
            /** Episode Title */
            episode_title: string;
            /** Position Seconds */
            position_seconds: string;
            /**
             * Series Id
             * Format: uuid
             */
            series_id: string;
            /** Series Title */
            series_title: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /**
         * ProposalAcceptIn
         * @description Optionally accept with edits: the writer can adjust the payload first.
         */
        ProposalAcceptIn: {
            /** Payload */
            payload?: {
                [key: string]: unknown;
            } | null;
        };
        /**
         * ProposalOp
         * @enum {string}
         */
        ProposalOp: "create" | "update" | "delete";
        /** ProposalOut */
        ProposalOut: {
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Current */
            current?: {
                [key: string]: unknown;
            } | null;
            /** Decided At */
            decided_at: string | null;
            /** Decided By */
            decided_by: string | null;
            /** Entity Id */
            entity_id: string | null;
            /** Entity Type */
            entity_type: string;
            /** Episode Id */
            episode_id: string | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            op: components["schemas"]["ProposalOp"];
            /** Payload */
            payload: {
                [key: string]: unknown;
            };
            /** Reason */
            reason: string;
            /**
             * Series Id
             * Format: uuid
             */
            series_id: string;
            status: components["schemas"]["ProposalStatus"];
        };
        /**
         * ProposalStatus
         * @enum {string}
         */
        ProposalStatus: "pending" | "accepted" | "rejected";
        /** PublicSeriesDetail */
        PublicSeriesDetail: {
            /** Episodes */
            episodes: components["schemas"]["ListenerEpisodeOut"][];
            /** Has Sample */
            has_sample: boolean;
            series: components["schemas"]["ListenerSeriesOut"];
        };
        /** PurposeCost */
        PurposeCost: {
            /** Cost Usd */
            cost_usd: string;
            /** Purpose */
            purpose: string;
        };
        /** RefreshIn */
        RefreshIn: {
            /** Refresh Token */
            refresh_token: string;
        };
        /** RegenerateIn */
        RegenerateIn: {
            /** Sections */
            sections: components["schemas"]["Section"][];
        };
        /** RejectedEvent */
        RejectedEvent: {
            /** Code */
            code: string;
            /** Index */
            index: number;
        };
        /** RelationshipCreate */
        RelationshipCreate: {
            /**
             * Character A Id
             * Format: uuid
             */
            character_a_id: string;
            /**
             * Character B Id
             * Format: uuid
             */
            character_b_id: string;
            /**
             * Description
             * @default
             */
            description: string;
            /** From Episode */
            from_episode?: number | null;
        };
        /** RelationshipOut */
        RelationshipOut: {
            /**
             * Character A Id
             * Format: uuid
             */
            character_a_id: string;
            /**
             * Character B Id
             * Format: uuid
             */
            character_b_id: string;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Description */
            description: string;
            /** From Episode */
            from_episode: number | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /**
             * Series Id
             * Format: uuid
             */
            series_id: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** RelationshipUpdate */
        RelationshipUpdate: {
            /** Character A Id */
            character_a_id?: string | null;
            /** Character B Id */
            character_b_id?: string | null;
            /** Description */
            description?: string | null;
            /** From Episode */
            from_episode?: number | null;
        };
        /** RenderOut */
        RenderOut: {
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Draft Version */
            draft_version: number;
            /** Error */
            error: string | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Lines Done */
            lines_done: number;
            /** Lines Total */
            lines_total: number;
            /** Status */
            status: string;
            /** Workflow Run Id */
            workflow_run_id: string | null;
        };
        /** ResolveIssueIn */
        ResolveIssueIn: {
            /**
             * Note
             * @default
             */
            note: string;
            /**
             * Status
             * @enum {string}
             */
            status: "fixed" | "intentional";
        };
        /**
         * ResumeIn
         * @description Answer for the step the run is waiting at, e.g. ``{"action": "approve"}``, or empty to
         *     retry a failed run.
         */
        ResumeIn: {
            /** Payload */
            payload?: {
                [key: string]: unknown;
            } | null;
        };
        /** ReviewDetailOut */
        ReviewDetailOut: {
            audio: components["schemas"]["AudioAssetOut"] | null;
            /** Continuity */
            continuity: {
                [key: string]: unknown;
            }[];
            cost: components["schemas"]["CostSummary"];
            /** Episode Status */
            episode_status: string;
            /** Is Live */
            is_live: boolean;
            item: components["schemas"]["ReviewItemOut"];
            /** Text */
            text: string;
            /** Versions */
            versions: components["schemas"]["DraftSummary"][];
        };
        /** ReviewItemOut */
        ReviewItemOut: {
            /** Comments */
            comments: string;
            /** Decided At */
            decided_at: string | null;
            /** Draft Version */
            draft_version: number;
            /**
             * Episode Id
             * Format: uuid
             */
            episode_id: string;
            /** Episode Number */
            episode_number: number;
            /** Episode Title */
            episode_title: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /**
             * Series Id
             * Format: uuid
             */
            series_id: string;
            /** Series Title */
            series_title: string;
            /** Status */
            status: string;
            /**
             * Submitted At
             * Format: date-time
             */
            submitted_at: string;
            /** Writer Id */
            writer_id: string | null;
        };
        /**
         * Role
         * @enum {string}
         */
        Role: "listener" | "writer" | "admin";
        /** RunOut */
        RunOut: {
            /**
             * Cost Usd
             * @default 0
             */
            cost_usd: string;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Current Step */
            current_step: string;
            /** Episode Id */
            episode_id: string | null;
            /** Error */
            error: string | null;
            /** Finished At */
            finished_at: string | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Interrupt Payload */
            interrupt_payload: {
                [key: string]: unknown;
            } | null;
            /** Request Id */
            request_id: string | null;
            /** Series Id */
            series_id: string | null;
            /** Started At */
            started_at: string | null;
            status: components["schemas"]["RunStatus"];
            /** Workflow */
            workflow: string;
        };
        /**
         * RunStatus
         * @enum {string}
         */
        RunStatus: "queued" | "running" | "waiting" | "succeeded" | "failed" | "cancelled";
        /** SampleOut */
        SampleOut: {
            /** Duration Seconds */
            duration_seconds: string;
            /** Episode Number */
            episode_number: number;
            /**
             * Url
             * @description Signed, short-lived URL of the sample clip only
             */
            url: string;
        };
        /** ScriptLineOut */
        ScriptLineOut: {
            /** Index */
            index: number;
            /**
             * Kind
             * @enum {string}
             */
            kind: "dialogue" | "narration" | "scene_break";
            /** Paragraph */
            paragraph: number;
            /** Source Line */
            source_line: number;
            /** Speaker */
            speaker: string | null;
            /** Text */
            text: string;
            /** Unknown Speaker */
            unknown_speaker: string | null;
        };
        /** Section */
        Section: {
            /** End */
            end: number;
            /**
             * Note
             * @default
             */
            note: string;
            /** Start */
            start: number;
        };
        /** SeriesCostOut */
        SeriesCostOut: {
            budget: components["schemas"]["BudgetOut"];
            /** Episodes */
            episodes: components["schemas"]["EpisodeCost"][];
            summary: components["schemas"]["CostSummary"];
        };
        /** SeriesCreate */
        SeriesCreate: {
            /** Language */
            language: string;
            /**
             * Premise
             * @default
             */
            premise: string;
            /**
             * Target Episode Minutes
             * @default 18
             */
            target_episode_minutes: number;
            /** Themes */
            themes: string[];
            /** Title */
            title: string;
            /**
             * Tone
             * @default
             */
            tone: string;
        };
        /**
         * SeriesOut
         * @description Studio view of a series (writers and admins).
         */
        SeriesOut: {
            /** Cover Url */
            cover_url?: string | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Free Episode Count */
            free_episode_count: number;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Is Ai Assisted */
            is_ai_assisted: boolean;
            /** Language */
            language: string;
            /** Owner Writer Id */
            owner_writer_id: string | null;
            /** Play Count */
            play_count: number;
            /** Premise */
            premise: string;
            /** Published At */
            published_at: string | null;
            status: components["schemas"]["SeriesStatus"];
            /** Target Episode Minutes */
            target_episode_minutes: number;
            /** Themes */
            themes: string[];
            /** Title */
            title: string;
            /** Tone */
            tone: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /**
         * SeriesStatus
         * @enum {string}
         */
        SeriesStatus: "draft" | "in_review" | "published" | "archived";
        /**
         * SeriesUpdate
         * @description Fields a writer can change on their own series.
         */
        SeriesUpdate: {
            /** Language */
            language?: string | null;
            /** Premise */
            premise?: string | null;
            /** Target Episode Minutes */
            target_episode_minutes?: number | null;
            /** Themes */
            themes?: string[] | null;
            /** Title */
            title?: string | null;
            /** Tone */
            tone?: string | null;
        };
        /** ShelfCreate */
        ShelfCreate: {
            /** @default mood */
            kind: components["schemas"]["ShelfKind"];
            /** Title */
            title: string;
        };
        /** ShelfItemsIn */
        ShelfItemsIn: {
            /** Series Ids */
            series_ids: string[];
        };
        /**
         * ShelfKind
         * @enum {string}
         */
        ShelfKind: "mood" | "theme" | "genre";
        /** ShelfOrderIn */
        ShelfOrderIn: {
            /** Shelf Ids */
            shelf_ids: string[];
        };
        /** ShelfUpdate */
        ShelfUpdate: {
            kind?: components["schemas"]["ShelfKind"] | null;
            /** Title */
            title?: string | null;
        };
        /** SignupIn */
        SignupIn: {
            /** Display Name */
            display_name?: string | null;
            /**
             * Email
             * Format: email
             */
            email: string;
            /** Password */
            password: string;
        };
        /** SitemapEntry */
        SitemapEntry: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Title */
            title: string;
            /** Updated At */
            updated_at: string | null;
        };
        /** SocialLoginIn */
        SocialLoginIn: {
            /** Id Token */
            id_token: string;
            /** Provider */
            provider: string;
        };
        /** StartRenderOut */
        StartRenderOut: {
            /**
             * Render Id
             * Format: uuid
             */
            render_id: string;
            /**
             * Workflow Run Id
             * Format: uuid
             */
            workflow_run_id: string;
        };
        /** StatusIn */
        StatusIn: {
            status: components["schemas"]["EpisodeStatus"];
        };
        /** TimelineEventCreate */
        TimelineEventCreate: {
            /** Description */
            description: string;
            /** Episode Number */
            episode_number?: number | null;
            /** Position */
            position?: number | null;
            /**
             * Story Time
             * @default
             */
            story_time: string;
        };
        /** TimelineEventOut */
        TimelineEventOut: {
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Description */
            description: string;
            /** Episode Number */
            episode_number: number | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Position */
            position: number;
            /**
             * Series Id
             * Format: uuid
             */
            series_id: string;
            /** Story Time */
            story_time: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** TimelineEventUpdate */
        TimelineEventUpdate: {
            /** Description */
            description?: string | null;
            /** Episode Number */
            episode_number?: number | null;
            /** Position */
            position?: number | null;
            /** Story Time */
            story_time?: string | null;
        };
        /** TokenPair */
        TokenPair: {
            /** Access Token */
            access_token: string;
            /** Expires In */
            expires_in: number;
            /** Refresh Token */
            refresh_token: string;
            /**
             * Token Type
             * @default bearer
             */
            token_type: string;
            user: components["schemas"]["UserOut"];
        };
        /** UserOut */
        UserOut: {
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Display Name */
            display_name: string | null;
            /** Email */
            email: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            role: components["schemas"]["Role"];
            status: components["schemas"]["UserStatus"];
        };
        /**
         * UserStatus
         * @enum {string}
         */
        UserStatus: "active" | "deactivated";
        /** ValidationError */
        ValidationError: {
            /** Context */
            ctx?: Record<string, never>;
            /** Input */
            input?: unknown;
            /** Location */
            loc: (string | number)[];
            /** Message */
            msg: string;
            /** Error Type */
            type: string;
        };
        /** VoiceIn */
        VoiceIn: {
            /**
             * Description
             * @default
             */
            description: string;
            /**
             * Language
             * @default en
             */
            language: string;
            /** Name */
            name: string;
            /** Provider */
            provider: string;
            /** Provider Voice Id */
            provider_voice_id: string;
            /** Sample Text */
            sample_text?: string | null;
        };
        /** VoiceOut */
        VoiceOut: {
            /** Description */
            description: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Is Active */
            is_active: boolean;
            /** Language */
            language: string;
            /** Name */
            name: string;
            /** Provider */
            provider: string;
            /** Provider Voice Id */
            provider_voice_id: string;
            /** Sample Text */
            sample_text: string;
        };
        /** VoicePreviewOut */
        VoicePreviewOut: {
            /**
             * Url
             * @description null while the preview is being generated
             */
            url: string | null;
        };
        /** VoiceUpdate */
        VoiceUpdate: {
            /** Description */
            description?: string | null;
            /** Is Active */
            is_active?: boolean | null;
            /** Language */
            language?: string | null;
            /** Name */
            name?: string | null;
            /** Sample Text */
            sample_text?: string | null;
        };
        /** WorldRuleCreate */
        WorldRuleCreate: {
            /** Rule Text */
            rule_text: string;
        };
        /** WorldRuleOut */
        WorldRuleOut: {
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Rule Text */
            rule_text: string;
            /**
             * Series Id
             * Format: uuid
             */
            series_id: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** WorldRuleUpdate */
        WorldRuleUpdate: {
            /** Rule Text */
            rule_text?: string | null;
        };
        /** WriterOut */
        WriterOut: {
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Display Name */
            display_name: string | null;
            /** Email */
            email: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Last Login At */
            last_login_at: string | null;
            role: components["schemas"]["Role"];
            status: components["schemas"]["UserStatus"];
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    episode_stats_api_v1_admin_analytics_episodes__episode_id__get: {
        parameters: {
            query?: {
                from?: string | null;
                to?: string | null;
            };
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    overview_api_v1_admin_analytics_overview_get: {
        parameters: {
            query?: {
                from?: string | null;
                to?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    refresh_api_v1_admin_analytics_refresh_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: string;
                    };
                };
            };
        };
    };
    retention_api_v1_admin_analytics_retention_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: number | null;
                    };
                };
            };
        };
    };
    series_stats_api_v1_admin_analytics_series__series_id__get: {
        parameters: {
            query?: {
                from?: string | null;
                to?: string | null;
            };
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    audit_log_api_v1_admin_audit_log_get: {
        parameters: {
            query?: {
                actor_id?: string | null;
                entity_type?: string | null;
                entity_id?: string | null;
                from?: string | null;
                to?: string | null;
                limit?: number;
                offset?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_AuditEntryOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    admin_costs_api_v1_admin_costs_get: {
        parameters: {
            query?: {
                from?: string | null;
                to?: string | null;
                group_by?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminCostsOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    set_episode_access_api_v1_admin_episodes__episode_id__access_put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EpisodeAccessIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EpisodeAccessOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    publish_api_v1_admin_episodes__episode_id__publish_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    unpublish_api_v1_admin_episodes__episode_id__unpublish_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_invites_api_v1_admin_invites_get: {
        parameters: {
            query?: {
                status?: string | null;
                limit?: number;
                offset?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_InviteOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_invite_api_v1_admin_invites_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["InviteCreateIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InviteOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    revoke_invite_api_v1_admin_invites__invite_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                invite_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InviteOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    resend_invite_api_v1_admin_invites__invite_id__resend_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                invite_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InviteOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    review_detail_api_v1_admin_review_items__item_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                item_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReviewDetailOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    approve_api_v1_admin_review_items__item_id__approve_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                item_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ApproveIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReviewItemOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    reject_api_v1_admin_review_items__item_id__reject_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                item_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CommentsIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReviewItemOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    request_changes_api_v1_admin_review_items__item_id__request_changes_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                item_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CommentsIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReviewItemOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    review_queue_api_v1_admin_review_queue_get: {
        parameters: {
            query?: {
                series_id?: string | null;
                writer_id?: string | null;
                limit?: number;
                offset?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_ReviewItemOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    admin_list_series_api_v1_admin_series_get: {
        parameters: {
            query?: {
                status?: components["schemas"]["SeriesStatus"] | null;
                q?: string | null;
                limit?: number;
                offset?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_SeriesOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    admin_update_series_api_v1_admin_series__series_id__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdminSeriesUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SeriesOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_budget_api_v1_admin_series__series_id__budget_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BudgetOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    set_budget_api_v1_admin_series__series_id__budget_put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BudgetIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BudgetOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    admin_upload_cover_api_v1_admin_series__series_id__cover_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_admin_upload_cover_api_v1_admin_series__series_id__cover_post"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SeriesOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    admin_list_shelves_api_v1_admin_shelves_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminShelfOut"][];
                };
            };
        };
    };
    admin_create_shelf_api_v1_admin_shelves_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ShelfCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminShelfOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    admin_reorder_shelves_api_v1_admin_shelves_order_put: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ShelfOrderIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    admin_update_shelf_api_v1_admin_shelves__shelf_id__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                shelf_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ShelfUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminShelfOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    admin_delete_shelf_api_v1_admin_shelves__shelf_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                shelf_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    admin_set_shelf_items_api_v1_admin_shelves__shelf_id__items_put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                shelf_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ShelfItemsIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminShelfOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    admin_list_voices_api_v1_admin_voices_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VoiceOut"][];
                };
            };
        };
    };
    admin_create_voice_api_v1_admin_voices_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VoiceIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VoiceOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    admin_update_voice_api_v1_admin_voices__voice_id__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                voice_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VoiceUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VoiceOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    writer_series_counts_api_v1_admin_writer_series_counts_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: number;
                    };
                };
            };
        };
    };
    list_writers_api_v1_admin_writers_get: {
        parameters: {
            query?: {
                limit?: number;
                offset?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_WriterOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    deactivate_writer_api_v1_admin_writers__user_id__deactivate_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                user_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    reactivate_writer_api_v1_admin_writers__user_id__reactivate_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                user_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    accept_invite_api_v1_auth_accept_invite_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AcceptInviteIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TokenPair"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    login_api_v1_auth_login_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TokenPair"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    logout_api_v1_auth_logout_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RefreshIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    refresh_api_v1_auth_refresh_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RefreshIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TokenPair"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    signup_api_v1_auth_signup_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SignupIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TokenPair"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    social_login_api_v1_auth_social_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SocialLoginIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TokenPair"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_episode_api_v1_episodes__episode_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListenerEpisodeOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_playback_api_v1_episodes__episode_id__playback_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlaybackOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    post_events_api_v1_events_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EventBatchIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EventBatchOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    health_api_v1_health_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: string;
                    };
                };
            };
        };
    };
    me_api_v1_me_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CurrentUser"];
                };
            };
        };
    };
    delete_me_api_v1_me_delete: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    get_downloads_api_v1_me_downloads_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DownloadOut"][];
                };
            };
        };
    };
    add_download_api_v1_me_downloads_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DownloadIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DownloadOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    remove_download_api_v1_me_downloads__episode_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_progress_api_v1_me_progress_get: {
        parameters: {
            query?: {
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProgressOut"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    put_progress_api_v1_me_progress__episode_id__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProgressIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProgressOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_series_api_v1_public_series_get: {
        parameters: {
            query?: {
                limit?: number;
                offset?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_ListenerSeriesOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_series_api_v1_public_series__series_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicSeriesDetail"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_sample_api_v1_public_series__series_id__sample_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SampleOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_shelves_api_v1_public_shelves_get: {
        parameters: {
            query?: {
                items_per_shelf?: number;
                limit?: number;
                offset?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_ListenerShelfOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_shelf_api_v1_public_shelves__shelf_id__get: {
        parameters: {
            query?: {
                limit?: number;
            };
            header?: never;
            path: {
                shelf_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListenerShelfOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    sitemap_api_v1_public_sitemap_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SitemapEntry"][];
                };
            };
        };
    };
    search_api_v1_search_get: {
        parameters: {
            query: {
                q: string;
                limit?: number;
                offset?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_ListenerSeriesOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_series_api_v1_series__series_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListenerSeriesOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_series_episodes_api_v1_series__series_id__episodes_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListenerEpisodeOut"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_shelves_api_v1_shelves_get: {
        parameters: {
            query?: {
                items_per_shelf?: number;
                limit?: number;
                offset?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_ListenerShelfOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    edit_line_api_v1_studio_audio_lines__line_id__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                line_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LineTextIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StartRenderOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    regenerate_line_api_v1_studio_audio_lines__line_id__regenerate_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                line_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StartRenderOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    retry_render_api_v1_studio_audio_renders__render_id__retry_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                render_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StartRenderOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    accept_proposal_api_v1_studio_canon_proposals__proposal_id__accept_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                proposal_id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["ProposalAcceptIn"] | null;
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProposalOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    reject_proposal_api_v1_studio_canon_proposals__proposal_id__reject_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                proposal_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProposalOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    propose_canon_from_issue_api_v1_studio_continuity_issues__issue_id__propose_canon_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                issue_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IssueCanonIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: string;
                    };
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    resolve_issue_api_v1_studio_continuity_issues__issue_id__resolve_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                issue_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ResolveIssueIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IssueOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_episode_api_v1_studio_episodes__episode_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EpisodeOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_episode_api_v1_studio_episodes__episode_id__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EpisodeUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EpisodeOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_episode_api_v1_studio_episodes__episode_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    episode_audio_api_v1_studio_episodes__episode_id__audio_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EpisodeAudioOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    start_render_api_v1_studio_episodes__episode_id__audio_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StartRenderOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_issues_api_v1_studio_episodes__episode_id__continuity_issues_get: {
        parameters: {
            query?: {
                status?: components["schemas"]["IssueStatus"] | null;
            };
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IssueOut"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    episode_costs_api_v1_studio_episodes__episode_id__costs_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CostSummary"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_drafts_api_v1_studio_episodes__episode_id__drafts_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DraftSummary"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    save_draft_api_v1_studio_episodes__episode_id__drafts_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DraftIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DraftOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    compare_drafts_api_v1_studio_episodes__episode_id__drafts_compare_get: {
        parameters: {
            query: {
                a: number;
                b: number;
            };
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CompareOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_draft_api_v1_studio_episodes__episode_id__drafts__version__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                episode_id: string;
                version: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DraftOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    restore_draft_api_v1_studio_episodes__episode_id__drafts__version__restore_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                episode_id: string;
                version: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DraftOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    set_plan_api_v1_studio_episodes__episode_id__plan_put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PlanIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EpisodeOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    regenerate_section_api_v1_studio_episodes__episode_id__regenerate_section_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RegenerateIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RunOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    episode_reviews_api_v1_studio_episodes__episode_id__reviews_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReviewItemOut"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_script_api_v1_studio_episodes__episode_id__script_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScriptLineOut"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    set_status_api_v1_studio_episodes__episode_id__status_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StatusIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EpisodeOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    submit_api_v1_studio_episodes__episode_id__submit_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReviewItemOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_runs_api_v1_studio_episodes__episode_id__workflow_runs_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RunOut"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    start_continuity_api_v1_studio_episodes__episode_id__workflows_continuity_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RunOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    start_drafting_api_v1_studio_episodes__episode_id__workflows_drafting_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                episode_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RunOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    notifications_api_v1_studio_notifications_get: {
        parameters: {
            query?: {
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotificationsOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    mark_read_api_v1_studio_notifications__notification_id__read_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                notification_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_series_api_v1_studio_series_get: {
        parameters: {
            query?: {
                status?: components["schemas"]["SeriesStatus"] | null;
                q?: string | null;
                limit?: number;
                offset?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_SeriesOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_series_api_v1_studio_series_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SeriesCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SeriesOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_series_api_v1_studio_series__series_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SeriesOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_series_api_v1_studio_series__series_id__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SeriesUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SeriesOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_bible_api_v1_studio_series__series_id__bible_get: {
        parameters: {
            query?: {
                q?: string | null;
            };
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BibleOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_proposals_api_v1_studio_series__series_id__canon_proposals_get: {
        parameters: {
            query?: {
                status?: components["schemas"]["ProposalStatus"] | null;
            };
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProposalOut"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_characters_api_v1_studio_series__series_id__characters_get: {
        parameters: {
            query?: {
                q?: string | null;
            };
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CharacterOut"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_characters_api_v1_studio_series__series_id__characters_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CharacterCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CharacterOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_characters_api_v1_studio_series__series_id__characters__entity_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
                entity_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CharacterOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_characters_api_v1_studio_series__series_id__characters__entity_id__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
                entity_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CharacterUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CharacterOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_characters_api_v1_studio_series__series_id__characters__entity_id__delete: {
        parameters: {
            query?: {
                /** @description Delete even if other entries use it */
                force?: boolean;
            };
            header?: never;
            path: {
                series_id: string;
                entity_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    series_costs_api_v1_studio_series__series_id__costs_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SeriesCostOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    upload_cover_api_v1_studio_series__series_id__cover_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_upload_cover_api_v1_studio_series__series_id__cover_post"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SeriesOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_episodes_api_v1_studio_series__series_id__episodes_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EpisodeOut"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_episode_api_v1_studio_series__series_id__episodes_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EpisodeCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EpisodeOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    reorder_episodes_api_v1_studio_series__series_id__episodes_order_put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EpisodeOrderIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_locations_api_v1_studio_series__series_id__locations_get: {
        parameters: {
            query?: {
                q?: string | null;
            };
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LocationOut"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_locations_api_v1_studio_series__series_id__locations_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LocationCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LocationOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_locations_api_v1_studio_series__series_id__locations__entity_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
                entity_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LocationOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_locations_api_v1_studio_series__series_id__locations__entity_id__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
                entity_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LocationUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LocationOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_locations_api_v1_studio_series__series_id__locations__entity_id__delete: {
        parameters: {
            query?: {
                /** @description Delete even if other entries use it */
                force?: boolean;
            };
            header?: never;
            path: {
                series_id: string;
                entity_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_plot_threads_api_v1_studio_series__series_id__plot_threads_get: {
        parameters: {
            query?: {
                q?: string | null;
            };
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlotThreadOut"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_plot_threads_api_v1_studio_series__series_id__plot_threads_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PlotThreadCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlotThreadOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_plot_threads_api_v1_studio_series__series_id__plot_threads__entity_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
                entity_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlotThreadOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_plot_threads_api_v1_studio_series__series_id__plot_threads__entity_id__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
                entity_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PlotThreadUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlotThreadOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_plot_threads_api_v1_studio_series__series_id__plot_threads__entity_id__delete: {
        parameters: {
            query?: {
                /** @description Delete even if other entries use it */
                force?: boolean;
            };
            header?: never;
            path: {
                series_id: string;
                entity_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_relationships_api_v1_studio_series__series_id__relationships_get: {
        parameters: {
            query?: {
                q?: string | null;
            };
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RelationshipOut"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_relationships_api_v1_studio_series__series_id__relationships_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RelationshipCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RelationshipOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_relationships_api_v1_studio_series__series_id__relationships__entity_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
                entity_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RelationshipOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_relationships_api_v1_studio_series__series_id__relationships__entity_id__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
                entity_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RelationshipUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RelationshipOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_relationships_api_v1_studio_series__series_id__relationships__entity_id__delete: {
        parameters: {
            query?: {
                /** @description Delete even if other entries use it */
                force?: boolean;
            };
            header?: never;
            path: {
                series_id: string;
                entity_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_timeline_api_v1_studio_series__series_id__timeline_get: {
        parameters: {
            query?: {
                q?: string | null;
            };
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TimelineEventOut"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_timeline_api_v1_studio_series__series_id__timeline_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TimelineEventCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TimelineEventOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_timeline_api_v1_studio_series__series_id__timeline__entity_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
                entity_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TimelineEventOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_timeline_api_v1_studio_series__series_id__timeline__entity_id__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
                entity_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TimelineEventUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TimelineEventOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_timeline_api_v1_studio_series__series_id__timeline__entity_id__delete: {
        parameters: {
            query?: {
                /** @description Delete even if other entries use it */
                force?: boolean;
            };
            header?: never;
            path: {
                series_id: string;
                entity_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_cast_api_v1_studio_series__series_id__voice_assignments_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AssignmentsOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    set_cast_api_v1_studio_series__series_id__voice_assignments_put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AssignmentsIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AssignmentsOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_world_rules_api_v1_studio_series__series_id__world_rules_get: {
        parameters: {
            query?: {
                q?: string | null;
            };
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorldRuleOut"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_world_rules_api_v1_studio_series__series_id__world_rules_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WorldRuleCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorldRuleOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_world_rules_api_v1_studio_series__series_id__world_rules__entity_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
                entity_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorldRuleOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_world_rules_api_v1_studio_series__series_id__world_rules__entity_id__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                series_id: string;
                entity_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WorldRuleUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorldRuleOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_world_rules_api_v1_studio_series__series_id__world_rules__entity_id__delete: {
        parameters: {
            query?: {
                /** @description Delete even if other entries use it */
                force?: boolean;
            };
            header?: never;
            path: {
                series_id: string;
                entity_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_voices_api_v1_studio_voices_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VoiceOut"][];
                };
            };
        };
    };
    voice_preview_api_v1_studio_voices__voice_id__preview_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                voice_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VoicePreviewOut"];
                };
            };
            /** @description Preview is being generated */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VoicePreviewOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_run_api_v1_studio_workflow_runs__run_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                run_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RunOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    cancel_run_api_v1_studio_workflow_runs__run_id__cancel_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                run_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RunOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    stream_run_events_api_v1_studio_workflow_runs__run_id__events_get: {
        parameters: {
            query?: {
                /** @description Return events after this cursor */
                after?: number;
            };
            header?: {
                "Last-Event-ID"?: number | null;
            };
            path: {
                run_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/event-stream": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    resume_run_api_v1_studio_workflow_runs__run_id__resume_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                run_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ResumeIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RunOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
}
