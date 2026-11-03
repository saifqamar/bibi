// Generated from the backend OpenAPI schema. Do not edit; run `pnpm api-client:generate`.
export interface paths {
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
        /** RefreshIn */
        RefreshIn: {
            /** Refresh Token */
            refresh_token: string;
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
        /**
         * Role
         * @enum {string}
         */
        Role: "listener" | "writer" | "admin";
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
        /** SocialLoginIn */
        SocialLoginIn: {
            /** Id Token */
            id_token: string;
            /** Provider */
            provider: string;
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
}
