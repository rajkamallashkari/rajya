--
-- PostgreSQL database dump
--


-- Dumped from database version 17.10 (Debian 17.10-1.pgdg12+1)
-- Dumped by pg_dump version 17.10 (Debian 17.10-1.pgdg12+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id bigint NOT NULL,
    kind character varying NOT NULL,
    username public.citext NOT NULL,
    display_name character varying NOT NULL,
    bio text,
    deactivated_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT ck_accounts_kind CHECK (((kind)::text = ANY ((ARRAY['human'::character varying, 'bot'::character varying])::text[])))
);


--
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accounts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


--
-- Name: active_storage_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.active_storage_attachments (
    id bigint NOT NULL,
    name character varying NOT NULL,
    record_type character varying NOT NULL,
    record_id bigint NOT NULL,
    blob_id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: active_storage_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.active_storage_attachments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: active_storage_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.active_storage_attachments_id_seq OWNED BY public.active_storage_attachments.id;


--
-- Name: active_storage_blobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.active_storage_blobs (
    id bigint NOT NULL,
    key character varying NOT NULL,
    filename character varying NOT NULL,
    content_type character varying,
    metadata text,
    service_name character varying NOT NULL,
    byte_size bigint NOT NULL,
    checksum character varying,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: active_storage_blobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.active_storage_blobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: active_storage_blobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.active_storage_blobs_id_seq OWNED BY public.active_storage_blobs.id;


--
-- Name: active_storage_variant_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.active_storage_variant_records (
    id bigint NOT NULL,
    blob_id bigint NOT NULL,
    variation_digest character varying NOT NULL
);


--
-- Name: active_storage_variant_records_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.active_storage_variant_records_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: active_storage_variant_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.active_storage_variant_records_id_seq OWNED BY public.active_storage_variant_records.id;


--
-- Name: ai_usage_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_usage_events (
    id bigint NOT NULL,
    account_id bigint,
    conversation_id bigint,
    capability character varying NOT NULL,
    provider character varying NOT NULL,
    model character varying NOT NULL,
    prompt_tokens integer,
    completion_tokens integer,
    latency_ms integer,
    status character varying NOT NULL,
    error_code character varying,
    created_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT ck_ai_usage_events_status CHECK (((status)::text = ANY ((ARRAY['success'::character varying, 'failed'::character varying, 'fallback'::character varying])::text[])))
);


--
-- Name: ai_usage_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_usage_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_usage_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_usage_events_id_seq OWNED BY public.ai_usage_events.id;


--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    key character varying NOT NULL,
    value jsonb NOT NULL,
    category character varying NOT NULL,
    updated_by_user_id bigint,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: ar_internal_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ar_internal_metadata (
    key character varying NOT NULL,
    value character varying,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attachments (
    id bigint NOT NULL,
    message_id bigint NOT NULL,
    kind character varying NOT NULL,
    content_type character varying NOT NULL,
    byte_size bigint NOT NULL,
    checksum character varying,
    width integer,
    height integer,
    duration_ms integer,
    blurhash character varying,
    waveform jsonb,
    processing_status character varying DEFAULT 'pending'::character varying NOT NULL,
    processing_error character varying,
    storage_bucket_id bigint,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    transcript text,
    transcript_status character varying,
    transcript_language character varying,
    CONSTRAINT ck_attachments_kind CHECK (((kind)::text = ANY ((ARRAY['image'::character varying, 'video'::character varying, 'audio'::character varying, 'voice'::character varying, 'file'::character varying])::text[]))),
    CONSTRAINT ck_attachments_processing_status CHECK (((processing_status)::text = ANY ((ARRAY['pending'::character varying, 'ready'::character varying, 'failed'::character varying])::text[]))),
    CONSTRAINT ck_attachments_transcript_status CHECK (((transcript_status IS NULL) OR ((transcript_status)::text = ANY ((ARRAY['pending'::character varying, 'ready'::character varying, 'failed'::character varying])::text[]))))
);


--
-- Name: attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attachments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attachments_id_seq OWNED BY public.attachments.id;


--
-- Name: audit_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_events (
    id bigint NOT NULL,
    admin_user_id bigint,
    impersonated_account_id bigint,
    action character varying NOT NULL,
    target_type character varying,
    target_id bigint,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    ip_address inet,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: audit_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_events_id_seq OWNED BY public.audit_events.id;


--
-- Name: blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blocks (
    id bigint NOT NULL,
    blocker_account_id bigint NOT NULL,
    blocked_account_id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT ck_blocks_not_self CHECK ((blocker_account_id <> blocked_account_id))
);


--
-- Name: blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.blocks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.blocks_id_seq OWNED BY public.blocks.id;


--
-- Name: bot_commands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bot_commands (
    id bigint NOT NULL,
    bot_id bigint NOT NULL,
    name public.citext NOT NULL,
    description text NOT NULL,
    usage_hint text,
    "position" smallint DEFAULT 0 NOT NULL,
    CONSTRAINT ck_bot_commands_name CHECK (((name)::text ~ '^[a-z0-9_]{1,32}$'::text))
);


--
-- Name: bot_commands_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bot_commands_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bot_commands_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bot_commands_id_seq OWNED BY public.bot_commands.id;


--
-- Name: bot_memories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bot_memories (
    id bigint NOT NULL,
    bot_id bigint NOT NULL,
    content text NOT NULL,
    source_account_id bigint,
    source_message_id bigint,
    embedding public.vector(768),
    importance double precision DEFAULT 0.5 NOT NULL,
    last_recalled_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: bot_memories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bot_memories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bot_memories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bot_memories_id_seq OWNED BY public.bot_memories.id;


--
-- Name: bot_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bot_requests (
    id bigint NOT NULL,
    bot_id bigint,
    target_bot_id bigint,
    requester_account_id bigint NOT NULL,
    kind character varying DEFAULT 'create'::character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    decline_reason character varying,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT ck_bot_requests_kind CHECK (((kind)::text = ANY ((ARRAY['create'::character varying, 'edit'::character varying])::text[]))),
    CONSTRAINT ck_bot_requests_status CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'declined'::character varying])::text[])))
);


--
-- Name: bot_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bot_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bot_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bot_requests_id_seq OWNED BY public.bot_requests.id;


--
-- Name: bots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bots (
    id bigint NOT NULL,
    account_id bigint NOT NULL,
    owner_account_id bigint,
    persona_prompt text NOT NULL,
    memory_enabled boolean DEFAULT true NOT NULL,
    model_override character varying,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: bots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bots_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bots_id_seq OWNED BY public.bots.id;


--
-- Name: call_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.call_participants (
    id bigint NOT NULL,
    call_id bigint NOT NULL,
    account_id bigint NOT NULL,
    status character varying NOT NULL,
    joined_at timestamp(6) without time zone,
    left_at timestamp(6) without time zone,
    is_screen_sharing boolean DEFAULT false NOT NULL,
    CONSTRAINT ck_call_participants_status CHECK (((status)::text = ANY ((ARRAY['invited'::character varying, 'ringing'::character varying, 'joined'::character varying, 'left'::character varying, 'declined'::character varying, 'missed'::character varying, 'busy'::character varying])::text[])))
);


--
-- Name: call_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.call_participants_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: call_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.call_participants_id_seq OWNED BY public.call_participants.id;


--
-- Name: calls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calls (
    id bigint NOT NULL,
    conversation_id bigint NOT NULL,
    initiator_account_id bigint NOT NULL,
    kind character varying NOT NULL,
    status character varying NOT NULL,
    started_at timestamp(6) without time zone,
    ended_at timestamp(6) without time zone,
    duration_seconds integer,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT ck_calls_kind CHECK (((kind)::text = ANY ((ARRAY['audio'::character varying, 'video'::character varying])::text[]))),
    CONSTRAINT ck_calls_status CHECK (((status)::text = ANY ((ARRAY['ringing'::character varying, 'active'::character varying, 'ended'::character varying, 'missed'::character varying, 'declined'::character varying])::text[])))
);


--
-- Name: calls_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.calls_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: calls_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.calls_id_seq OWNED BY public.calls.id;


--
-- Name: contact_nicknames; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_nicknames (
    id bigint NOT NULL,
    owner_account_id bigint NOT NULL,
    target_account_id bigint NOT NULL,
    nickname text NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT ck_contact_nicknames_not_self CHECK ((owner_account_id <> target_account_id))
);


--
-- Name: contact_nicknames_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contact_nicknames_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contact_nicknames_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contact_nicknames_id_seq OWNED BY public.contact_nicknames.id;


--
-- Name: conversation_folder_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_folder_entries (
    id bigint NOT NULL,
    folder_id bigint NOT NULL,
    conversation_id bigint NOT NULL,
    "position" integer DEFAULT 0 NOT NULL
);


--
-- Name: conversation_folder_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conversation_folder_entries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conversation_folder_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conversation_folder_entries_id_seq OWNED BY public.conversation_folder_entries.id;


--
-- Name: conversation_folders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_folders (
    id bigint NOT NULL,
    account_id bigint NOT NULL,
    name character varying NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: conversation_folders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conversation_folders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conversation_folders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conversation_folders_id_seq OWNED BY public.conversation_folders.id;


--
-- Name: conversation_memberships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_memberships (
    id bigint NOT NULL,
    conversation_id bigint NOT NULL,
    account_id bigint NOT NULL,
    role character varying DEFAULT 'member'::character varying NOT NULL,
    status character varying DEFAULT 'active'::character varying NOT NULL,
    invited_by_account_id bigint,
    joined_at timestamp(6) without time zone NOT NULL,
    muted_until timestamp(6) without time zone,
    archived_at timestamp(6) without time zone,
    last_delivered_position bigint DEFAULT 0 NOT NULL,
    last_read_position bigint DEFAULT 0 NOT NULL,
    last_seen_position bigint DEFAULT 0 NOT NULL,
    last_delivered_at timestamp(6) without time zone,
    last_read_at timestamp(6) without time zone,
    unread_count integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    pinned_at timestamp(6) without time zone,
    manually_unread_at timestamp(6) without time zone,
    last_message_at timestamp(6) without time zone,
    CONSTRAINT ck_memberships_role CHECK (((role)::text = ANY ((ARRAY['member'::character varying, 'admin'::character varying, 'owner'::character varying])::text[]))),
    CONSTRAINT ck_memberships_seen_gte_read CHECK ((last_seen_position >= last_read_position)),
    CONSTRAINT ck_memberships_status CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'left'::character varying, 'removed'::character varying])::text[])))
);


--
-- Name: conversation_memberships_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conversation_memberships_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conversation_memberships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conversation_memberships_id_seq OWNED BY public.conversation_memberships.id;


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id bigint NOT NULL,
    kind character varying NOT NULL,
    title character varying,
    description text,
    direct_key character varying,
    last_message_id bigint,
    last_activity_at timestamp(6) without time zone NOT NULL,
    next_position bigint DEFAULT 0 NOT NULL,
    next_revision bigint DEFAULT 0 NOT NULL,
    context_summary text,
    summarized_through_message_id bigint,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    member_permissions jsonb DEFAULT '{}'::jsonb NOT NULL,
    slow_mode_seconds integer DEFAULT 0 NOT NULL,
    restrict_forwarding boolean DEFAULT false NOT NULL,
    CONSTRAINT ck_conversations_direct_key_only_for_direct CHECK ((((kind)::text = 'direct'::text) = (direct_key IS NOT NULL))),
    CONSTRAINT ck_conversations_groups_have_titles CHECK ((((kind)::text = 'direct'::text) OR (title IS NOT NULL))),
    CONSTRAINT ck_conversations_kind CHECK (((kind)::text = ANY ((ARRAY['direct'::character varying, 'group'::character varying, 'channel'::character varying])::text[]))),
    CONSTRAINT ck_conversations_slow_mode_seconds CHECK ((slow_mode_seconds >= 0))
);


--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conversations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: export_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.export_jobs (
    id bigint NOT NULL,
    account_id bigint NOT NULL,
    conversation_id bigint,
    format character varying NOT NULL,
    include_media boolean DEFAULT false NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    blob_id bigint,
    error_message character varying,
    expires_at timestamp(6) without time zone NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT ck_export_jobs_format CHECK (((format)::text = ANY ((ARRAY['json'::character varying, 'txt'::character varying, 'html'::character varying])::text[]))),
    CONSTRAINT ck_export_jobs_status CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'ready'::character varying, 'failed'::character varying])::text[])))
);


--
-- Name: export_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.export_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: export_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.export_jobs_id_seq OWNED BY public.export_jobs.id;


--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_flags (
    id bigint NOT NULL,
    key public.citext NOT NULL,
    description text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    rollout jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_by_user_id bigint,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: feature_flags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.feature_flags_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: feature_flags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.feature_flags_id_seq OWNED BY public.feature_flags.id;


--
-- Name: font_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.font_configs (
    id bigint NOT NULL,
    name character varying NOT NULL,
    font_family_value character varying NOT NULL,
    google_font_url character varying,
    is_active boolean DEFAULT true NOT NULL,
    "position" integer,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: font_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.font_configs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: font_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.font_configs_id_seq OWNED BY public.font_configs.id;


--
-- Name: global_accent_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.global_accent_configs (
    id character varying NOT NULL,
    label character varying NOT NULL,
    hex character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_dark_compatible boolean DEFAULT true NOT NULL,
    is_light_compatible boolean DEFAULT true NOT NULL,
    is_seasonal boolean DEFAULT false NOT NULL,
    "position" integer,
    updated_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT ck_global_accent_configs_hex CHECK (((hex)::text ~ '^#[0-9A-Fa-f]{6}$'::text))
);


--
-- Name: group_invites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_invites (
    id bigint NOT NULL,
    conversation_id bigint NOT NULL,
    created_by_account_id bigint NOT NULL,
    token character varying NOT NULL,
    max_uses integer,
    uses_count integer DEFAULT 0 NOT NULL,
    requires_approval boolean DEFAULT false NOT NULL,
    expires_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: group_invites_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.group_invites_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_invites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.group_invites_id_seq OWNED BY public.group_invites.id;


--
-- Name: join_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.join_requests (
    id bigint NOT NULL,
    conversation_id bigint NOT NULL,
    account_id bigint NOT NULL,
    group_invite_id bigint,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    reviewed_by_account_id bigint,
    reviewed_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT ck_join_requests_status CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


--
-- Name: join_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.join_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: join_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.join_requests_id_seq OWNED BY public.join_requests.id;


--
-- Name: link_previews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.link_previews (
    id bigint NOT NULL,
    url public.citext NOT NULL,
    title character varying,
    description text,
    site_name character varying,
    remote_image_url character varying,
    cached_image_key character varying,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    fetched_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT ck_link_previews_status CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'ready'::character varying, 'failed'::character varying])::text[])))
);


--
-- Name: link_previews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.link_previews_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: link_previews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.link_previews_id_seq OWNED BY public.link_previews.id;


--
-- Name: message_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_contacts (
    id bigint NOT NULL,
    message_id bigint NOT NULL,
    contact_account_id bigint,
    display_name text NOT NULL,
    phone text,
    email public.citext,
    "position" smallint DEFAULT 0 NOT NULL
);


--
-- Name: message_contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.message_contacts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: message_contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.message_contacts_id_seq OWNED BY public.message_contacts.id;


--
-- Name: message_link_previews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_link_previews (
    id bigint NOT NULL,
    message_id bigint NOT NULL,
    link_preview_id bigint NOT NULL
);


--
-- Name: message_link_previews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.message_link_previews_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: message_link_previews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.message_link_previews_id_seq OWNED BY public.message_link_previews.id;


--
-- Name: message_locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_locations (
    id bigint NOT NULL,
    message_id bigint NOT NULL,
    latitude numeric(9,6) NOT NULL,
    longitude numeric(9,6) NOT NULL,
    accuracy_m integer,
    label text,
    created_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT ck_message_locations_latitude CHECK (((latitude >= ('-90'::integer)::numeric) AND (latitude <= (90)::numeric))),
    CONSTRAINT ck_message_locations_longitude CHECK (((longitude >= ('-180'::integer)::numeric) AND (longitude <= (180)::numeric)))
);


--
-- Name: message_locations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.message_locations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: message_locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.message_locations_id_seq OWNED BY public.message_locations.id;


--
-- Name: message_reminders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_reminders (
    id bigint NOT NULL,
    account_id bigint NOT NULL,
    message_id bigint NOT NULL,
    remind_at timestamp(6) without time zone NOT NULL,
    note text,
    completed_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: message_reminders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.message_reminders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: message_reminders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.message_reminders_id_seq OWNED BY public.message_reminders.id;


--
-- Name: message_revisions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_revisions (
    id bigint NOT NULL,
    message_id bigint NOT NULL,
    body text NOT NULL,
    superseded_at timestamp(6) without time zone NOT NULL
);


--
-- Name: message_revisions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.message_revisions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: message_revisions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.message_revisions_id_seq OWNED BY public.message_revisions.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id bigint NOT NULL,
    conversation_id bigint NOT NULL,
    sender_account_id bigint,
    "position" bigint NOT NULL,
    revision bigint NOT NULL,
    kind character varying DEFAULT 'text'::character varying NOT NULL,
    system_event character varying,
    body text,
    client_nonce uuid,
    reply_to_message_id bigint,
    forwarded_from_account_id bigint,
    forward_count integer DEFAULT 0 NOT NULL,
    attachment_count integer DEFAULT 0 NOT NULL,
    reaction_summary jsonb DEFAULT '{}'::jsonb NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    sender_snapshot jsonb DEFAULT '{}'::jsonb NOT NULL,
    edited_at timestamp(6) without time zone,
    deleted_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    search_vector tsvector GENERATED ALWAYS AS (to_tsvector('simple'::regconfig, COALESCE(body, ''::text))) STORED,
    silent boolean DEFAULT false NOT NULL,
    CONSTRAINT ck_messages_kind CHECK (((kind)::text = ANY ((ARRAY['text'::character varying, 'system'::character varying, 'image'::character varying, 'video'::character varying, 'audio'::character varying, 'voice'::character varying, 'file'::character varying])::text[]))),
    CONSTRAINT ck_messages_sender_required_unless_system CHECK ((((kind)::text = 'system'::text) OR (sender_account_id IS NOT NULL) OR (sender_snapshot <> '{}'::jsonb))),
    CONSTRAINT ck_messages_system_event_iff_system CHECK ((((kind)::text = 'system'::text) = (system_event IS NOT NULL)))
);


--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: passkeys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.passkeys (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    webauthn_credential_id character varying NOT NULL,
    public_key character varying NOT NULL,
    sign_count integer DEFAULT 0 NOT NULL,
    nickname character varying,
    last_used_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: passkeys_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.passkeys_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: passkeys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.passkeys_id_seq OWNED BY public.passkeys.id;


--
-- Name: phone_verification_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phone_verification_requests (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    code_digest character varying NOT NULL,
    expires_at timestamp(6) without time zone NOT NULL,
    confirmed_phone character varying,
    confirmed_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: phone_verification_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.phone_verification_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: phone_verification_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.phone_verification_requests_id_seq OWNED BY public.phone_verification_requests.id;


--
-- Name: pinned_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pinned_messages (
    id bigint NOT NULL,
    conversation_id bigint NOT NULL,
    message_id bigint NOT NULL,
    pinned_by_account_id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: pinned_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pinned_messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pinned_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pinned_messages_id_seq OWNED BY public.pinned_messages.id;


--
-- Name: poll_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.poll_options (
    id bigint NOT NULL,
    poll_id bigint NOT NULL,
    "position" smallint NOT NULL,
    label text NOT NULL,
    vote_count integer DEFAULT 0 NOT NULL
);


--
-- Name: poll_options_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.poll_options_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: poll_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.poll_options_id_seq OWNED BY public.poll_options.id;


--
-- Name: poll_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.poll_votes (
    id bigint NOT NULL,
    poll_id bigint NOT NULL,
    poll_option_id bigint NOT NULL,
    account_id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: poll_votes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.poll_votes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: poll_votes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.poll_votes_id_seq OWNED BY public.poll_votes.id;


--
-- Name: polls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.polls (
    id bigint NOT NULL,
    message_id bigint NOT NULL,
    question text NOT NULL,
    allows_multiple boolean DEFAULT false NOT NULL,
    is_anonymous boolean DEFAULT false NOT NULL,
    closes_at timestamp(6) without time zone,
    closed_at timestamp(6) without time zone,
    voter_count integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: polls_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.polls_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: polls_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.polls_id_seq OWNED BY public.polls.id;


--
-- Name: preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preferences (
    account_id bigint NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: prompt_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prompt_templates (
    id bigint NOT NULL,
    capability character varying NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    template text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    updated_by_user_id bigint,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: prompt_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.prompt_templates_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: prompt_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.prompt_templates_id_seq OWNED BY public.prompt_templates.id;


--
-- Name: reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reactions (
    id bigint NOT NULL,
    message_id bigint NOT NULL,
    account_id bigint NOT NULL,
    emoji character varying NOT NULL,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: reactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reactions_id_seq OWNED BY public.reactions.id;


--
-- Name: receipt_marks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.receipt_marks (
    id bigint NOT NULL,
    membership_id bigint NOT NULL,
    kind character varying NOT NULL,
    "position" bigint NOT NULL,
    occurred_at timestamp(6) without time zone NOT NULL,
    from_position bigint DEFAULT 0 NOT NULL,
    CONSTRAINT ck_receipt_marks_from_position CHECK ((from_position >= 0)),
    CONSTRAINT ck_receipt_marks_kind CHECK (((kind)::text = ANY ((ARRAY['delivered'::character varying, 'read'::character varying])::text[])))
);


--
-- Name: receipt_marks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.receipt_marks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: receipt_marks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.receipt_marks_id_seq OWNED BY public.receipt_marks.id;


--
-- Name: reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reports (
    id bigint NOT NULL,
    reporter_account_id bigint NOT NULL,
    subject_type character varying NOT NULL,
    subject_id bigint NOT NULL,
    reason character varying NOT NULL,
    details text,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    reviewed_by_user_id bigint,
    reviewed_at timestamp(6) without time zone,
    resolution_note text,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT ck_reports_status CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'reviewing'::character varying, 'actioned'::character varying, 'dismissed'::character varying])::text[]))),
    CONSTRAINT ck_reports_subject_type CHECK (((subject_type)::text = ANY ((ARRAY['message'::character varying, 'account'::character varying, 'conversation'::character varying, 'bot'::character varying])::text[])))
);


--
-- Name: reports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reports_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reports_id_seq OWNED BY public.reports.id;


--
-- Name: saved_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_messages (
    id bigint NOT NULL,
    account_id bigint NOT NULL,
    message_id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: saved_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.saved_messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: saved_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.saved_messages_id_seq OWNED BY public.saved_messages.id;


--
-- Name: saved_replies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_replies (
    id bigint NOT NULL,
    account_id bigint NOT NULL,
    shortcut public.citext NOT NULL,
    body text NOT NULL,
    "position" smallint DEFAULT 0 NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT ck_saved_replies_position CHECK (("position" >= 0))
);


--
-- Name: saved_replies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.saved_replies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: saved_replies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.saved_replies_id_seq OWNED BY public.saved_replies.id;


--
-- Name: scheduled_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scheduled_messages (
    id bigint NOT NULL,
    conversation_id bigint NOT NULL,
    sender_account_id bigint NOT NULL,
    reply_to_message_id bigint,
    client_nonce uuid,
    body text NOT NULL,
    scheduled_at timestamp(6) without time zone NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    recurrence_rule text,
    next_run_at timestamp(6) without time zone,
    last_run_at timestamp(6) without time zone,
    occurrences_sent integer DEFAULT 0 NOT NULL,
    ends_at timestamp(6) without time zone,
    CONSTRAINT ck_scheduled_messages_occurrences_sent CHECK ((occurrences_sent >= 0))
);


--
-- Name: scheduled_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.scheduled_messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: scheduled_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.scheduled_messages_id_seq OWNED BY public.scheduled_messages.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying NOT NULL
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    jti uuid NOT NULL,
    device_label text,
    user_agent text,
    ip inet,
    last_seen_at timestamp(6) without time zone NOT NULL,
    expires_at timestamp(6) without time zone NOT NULL,
    revoked_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- Name: solid_cable_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solid_cable_messages (
    id bigint NOT NULL,
    channel bytea NOT NULL,
    payload bytea NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    channel_hash bigint NOT NULL
);


--
-- Name: solid_cable_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solid_cable_messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solid_cable_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solid_cable_messages_id_seq OWNED BY public.solid_cable_messages.id;


--
-- Name: solid_cache_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solid_cache_entries (
    id bigint NOT NULL,
    key bytea NOT NULL,
    value bytea NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    key_hash bigint NOT NULL,
    byte_size integer NOT NULL
);


--
-- Name: solid_cache_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solid_cache_entries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solid_cache_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solid_cache_entries_id_seq OWNED BY public.solid_cache_entries.id;


--
-- Name: solid_queue_blocked_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solid_queue_blocked_executions (
    id bigint NOT NULL,
    job_id bigint NOT NULL,
    queue_name character varying NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    concurrency_key character varying NOT NULL,
    expires_at timestamp(6) without time zone NOT NULL,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: solid_queue_blocked_executions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solid_queue_blocked_executions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solid_queue_blocked_executions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solid_queue_blocked_executions_id_seq OWNED BY public.solid_queue_blocked_executions.id;


--
-- Name: solid_queue_claimed_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solid_queue_claimed_executions (
    id bigint NOT NULL,
    job_id bigint NOT NULL,
    process_id bigint,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: solid_queue_claimed_executions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solid_queue_claimed_executions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solid_queue_claimed_executions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solid_queue_claimed_executions_id_seq OWNED BY public.solid_queue_claimed_executions.id;


--
-- Name: solid_queue_failed_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solid_queue_failed_executions (
    id bigint NOT NULL,
    job_id bigint NOT NULL,
    error text,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: solid_queue_failed_executions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solid_queue_failed_executions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solid_queue_failed_executions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solid_queue_failed_executions_id_seq OWNED BY public.solid_queue_failed_executions.id;


--
-- Name: solid_queue_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solid_queue_jobs (
    id bigint NOT NULL,
    queue_name character varying NOT NULL,
    class_name character varying NOT NULL,
    arguments text,
    priority integer DEFAULT 0 NOT NULL,
    active_job_id character varying,
    scheduled_at timestamp(6) without time zone,
    finished_at timestamp(6) without time zone,
    concurrency_key character varying,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: solid_queue_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solid_queue_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solid_queue_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solid_queue_jobs_id_seq OWNED BY public.solid_queue_jobs.id;


--
-- Name: solid_queue_pauses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solid_queue_pauses (
    id bigint NOT NULL,
    queue_name character varying NOT NULL,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: solid_queue_pauses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solid_queue_pauses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solid_queue_pauses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solid_queue_pauses_id_seq OWNED BY public.solid_queue_pauses.id;


--
-- Name: solid_queue_processes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solid_queue_processes (
    id bigint NOT NULL,
    kind character varying NOT NULL,
    last_heartbeat_at timestamp(6) without time zone NOT NULL,
    supervisor_id bigint,
    pid integer NOT NULL,
    hostname character varying,
    metadata text,
    created_at timestamp(6) without time zone NOT NULL,
    name character varying NOT NULL
);


--
-- Name: solid_queue_processes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solid_queue_processes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solid_queue_processes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solid_queue_processes_id_seq OWNED BY public.solid_queue_processes.id;


--
-- Name: solid_queue_ready_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solid_queue_ready_executions (
    id bigint NOT NULL,
    job_id bigint NOT NULL,
    queue_name character varying NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: solid_queue_ready_executions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solid_queue_ready_executions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solid_queue_ready_executions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solid_queue_ready_executions_id_seq OWNED BY public.solid_queue_ready_executions.id;


--
-- Name: solid_queue_recurring_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solid_queue_recurring_executions (
    id bigint NOT NULL,
    job_id bigint NOT NULL,
    task_key character varying NOT NULL,
    run_at timestamp(6) without time zone NOT NULL,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: solid_queue_recurring_executions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solid_queue_recurring_executions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solid_queue_recurring_executions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solid_queue_recurring_executions_id_seq OWNED BY public.solid_queue_recurring_executions.id;


--
-- Name: solid_queue_recurring_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solid_queue_recurring_tasks (
    id bigint NOT NULL,
    key character varying NOT NULL,
    schedule character varying NOT NULL,
    command character varying(2048),
    class_name character varying,
    arguments text,
    queue_name character varying,
    priority integer DEFAULT 0,
    static boolean DEFAULT true NOT NULL,
    description text,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: solid_queue_recurring_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solid_queue_recurring_tasks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solid_queue_recurring_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solid_queue_recurring_tasks_id_seq OWNED BY public.solid_queue_recurring_tasks.id;


--
-- Name: solid_queue_scheduled_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solid_queue_scheduled_executions (
    id bigint NOT NULL,
    job_id bigint NOT NULL,
    queue_name character varying NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    scheduled_at timestamp(6) without time zone NOT NULL,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: solid_queue_scheduled_executions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solid_queue_scheduled_executions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solid_queue_scheduled_executions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solid_queue_scheduled_executions_id_seq OWNED BY public.solid_queue_scheduled_executions.id;


--
-- Name: solid_queue_semaphores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solid_queue_semaphores (
    id bigint NOT NULL,
    key character varying NOT NULL,
    value integer DEFAULT 1 NOT NULL,
    expires_at timestamp(6) without time zone NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: solid_queue_semaphores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solid_queue_semaphores_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solid_queue_semaphores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solid_queue_semaphores_id_seq OWNED BY public.solid_queue_semaphores.id;


--
-- Name: sticker_packs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sticker_packs (
    id bigint NOT NULL,
    slug public.citext NOT NULL,
    name text NOT NULL,
    kind character varying NOT NULL,
    owner_account_id bigint,
    published_at timestamp(6) without time zone,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT ck_sticker_packs_kind CHECK (((kind)::text = ANY ((ARRAY['sticker'::character varying, 'emoji'::character varying])::text[])))
);


--
-- Name: sticker_packs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sticker_packs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sticker_packs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sticker_packs_id_seq OWNED BY public.sticker_packs.id;


--
-- Name: stickers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stickers (
    id bigint NOT NULL,
    sticker_pack_id bigint NOT NULL,
    shortcode public.citext NOT NULL,
    blob_id bigint NOT NULL,
    "position" smallint DEFAULT 0 NOT NULL
);


--
-- Name: stickers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stickers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stickers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stickers_id_seq OWNED BY public.stickers.id;


--
-- Name: storage_buckets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.storage_buckets (
    id bigint NOT NULL,
    service_name character varying NOT NULL,
    label character varying,
    status character varying DEFAULT 'active'::character varying NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    capacity_bytes bigint DEFAULT '9999999999'::bigint NOT NULL,
    used_bytes bigint DEFAULT 0 NOT NULL,
    last_health_check_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT ck_storage_buckets_capacity_positive CHECK ((capacity_bytes > 0)),
    CONSTRAINT ck_storage_buckets_status CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'full'::character varying, 'failed'::character varying, 'disabled'::character varying])::text[]))),
    CONSTRAINT ck_storage_buckets_used_bytes_non_negative CHECK ((used_bytes >= 0))
);


--
-- Name: storage_buckets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.storage_buckets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: storage_buckets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.storage_buckets_id_seq OWNED BY public.storage_buckets.id;


--
-- Name: storage_quotas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.storage_quotas (
    account_id bigint NOT NULL,
    quota_bytes bigint DEFAULT 524288000 NOT NULL,
    used_bytes bigint DEFAULT 0 NOT NULL,
    recomputed_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT ck_storage_quotas_used_bytes_non_negative CHECK ((used_bytes >= 0))
);


--
-- Name: theme_overrides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.theme_overrides (
    id bigint NOT NULL,
    theme character varying NOT NULL,
    token_name character varying NOT NULL,
    value character varying NOT NULL,
    updated_by_user_id bigint,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT ck_theme_overrides_theme CHECK (((theme)::text = ANY ((ARRAY['light'::character varying, 'dark'::character varying])::text[])))
);


--
-- Name: theme_overrides_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.theme_overrides_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: theme_overrides_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.theme_overrides_id_seq OWNED BY public.theme_overrides.id;


--
-- Name: translation_strings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.translation_strings (
    id bigint NOT NULL,
    key character varying NOT NULL,
    locale character varying DEFAULT 'en'::character varying NOT NULL,
    value text NOT NULL,
    updated_by_user_id bigint,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: translation_strings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.translation_strings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: translation_strings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.translation_strings_id_seq OWNED BY public.translation_strings.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    account_id bigint NOT NULL,
    email public.citext,
    email_verified_at timestamp(6) without time zone,
    phone character varying,
    phone_verified_at timestamp(6) without time zone,
    password_digest character varying,
    google_subject character varying,
    webauthn_handle character varying,
    credentials_epoch integer DEFAULT 0 NOT NULL,
    is_admin boolean DEFAULT false NOT NULL,
    onboarded_at timestamp(6) without time zone,
    last_active_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: verification_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification_codes (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    purpose character varying NOT NULL,
    channel character varying DEFAULT 'email'::character varying NOT NULL,
    destination character varying NOT NULL,
    code_digest character varying NOT NULL,
    expires_at timestamp(6) without time zone NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    consumed_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT ck_verification_codes_channel CHECK (((channel)::text = 'email'::text)),
    CONSTRAINT ck_verification_codes_purpose CHECK (((purpose)::text = ANY ((ARRAY['login'::character varying, 'signup'::character varying, 'password_reset'::character varying, 'email_change'::character varying])::text[])))
);


--
-- Name: verification_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.verification_codes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: verification_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.verification_codes_id_seq OWNED BY public.verification_codes.id;


--
-- Name: web_push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.web_push_subscriptions (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    endpoint text NOT NULL,
    p256dh character varying NOT NULL,
    auth character varying NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: web_push_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.web_push_subscriptions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: web_push_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.web_push_subscriptions_id_seq OWNED BY public.web_push_subscriptions.id;


--
-- Name: accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);


--
-- Name: active_storage_attachments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_storage_attachments ALTER COLUMN id SET DEFAULT nextval('public.active_storage_attachments_id_seq'::regclass);


--
-- Name: active_storage_blobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_storage_blobs ALTER COLUMN id SET DEFAULT nextval('public.active_storage_blobs_id_seq'::regclass);


--
-- Name: active_storage_variant_records id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_storage_variant_records ALTER COLUMN id SET DEFAULT nextval('public.active_storage_variant_records_id_seq'::regclass);


--
-- Name: ai_usage_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage_events ALTER COLUMN id SET DEFAULT nextval('public.ai_usage_events_id_seq'::regclass);


--
-- Name: attachments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attachments ALTER COLUMN id SET DEFAULT nextval('public.attachments_id_seq'::regclass);


--
-- Name: audit_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_events ALTER COLUMN id SET DEFAULT nextval('public.audit_events_id_seq'::regclass);


--
-- Name: blocks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocks ALTER COLUMN id SET DEFAULT nextval('public.blocks_id_seq'::regclass);


--
-- Name: bot_commands id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bot_commands ALTER COLUMN id SET DEFAULT nextval('public.bot_commands_id_seq'::regclass);


--
-- Name: bot_memories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bot_memories ALTER COLUMN id SET DEFAULT nextval('public.bot_memories_id_seq'::regclass);


--
-- Name: bot_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bot_requests ALTER COLUMN id SET DEFAULT nextval('public.bot_requests_id_seq'::regclass);


--
-- Name: bots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bots ALTER COLUMN id SET DEFAULT nextval('public.bots_id_seq'::regclass);


--
-- Name: call_participants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_participants ALTER COLUMN id SET DEFAULT nextval('public.call_participants_id_seq'::regclass);


--
-- Name: calls id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calls ALTER COLUMN id SET DEFAULT nextval('public.calls_id_seq'::regclass);


--
-- Name: contact_nicknames id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_nicknames ALTER COLUMN id SET DEFAULT nextval('public.contact_nicknames_id_seq'::regclass);


--
-- Name: conversation_folder_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_folder_entries ALTER COLUMN id SET DEFAULT nextval('public.conversation_folder_entries_id_seq'::regclass);


--
-- Name: conversation_folders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_folders ALTER COLUMN id SET DEFAULT nextval('public.conversation_folders_id_seq'::regclass);


--
-- Name: conversation_memberships id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_memberships ALTER COLUMN id SET DEFAULT nextval('public.conversation_memberships_id_seq'::regclass);


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: export_jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.export_jobs ALTER COLUMN id SET DEFAULT nextval('public.export_jobs_id_seq'::regclass);


--
-- Name: feature_flags id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags ALTER COLUMN id SET DEFAULT nextval('public.feature_flags_id_seq'::regclass);


--
-- Name: font_configs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.font_configs ALTER COLUMN id SET DEFAULT nextval('public.font_configs_id_seq'::regclass);


--
-- Name: group_invites id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_invites ALTER COLUMN id SET DEFAULT nextval('public.group_invites_id_seq'::regclass);


--
-- Name: join_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.join_requests ALTER COLUMN id SET DEFAULT nextval('public.join_requests_id_seq'::regclass);


--
-- Name: link_previews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.link_previews ALTER COLUMN id SET DEFAULT nextval('public.link_previews_id_seq'::regclass);


--
-- Name: message_contacts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_contacts ALTER COLUMN id SET DEFAULT nextval('public.message_contacts_id_seq'::regclass);


--
-- Name: message_link_previews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_link_previews ALTER COLUMN id SET DEFAULT nextval('public.message_link_previews_id_seq'::regclass);


--
-- Name: message_locations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_locations ALTER COLUMN id SET DEFAULT nextval('public.message_locations_id_seq'::regclass);


--
-- Name: message_reminders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_reminders ALTER COLUMN id SET DEFAULT nextval('public.message_reminders_id_seq'::regclass);


--
-- Name: message_revisions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_revisions ALTER COLUMN id SET DEFAULT nextval('public.message_revisions_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: passkeys id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.passkeys ALTER COLUMN id SET DEFAULT nextval('public.passkeys_id_seq'::regclass);


--
-- Name: phone_verification_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_verification_requests ALTER COLUMN id SET DEFAULT nextval('public.phone_verification_requests_id_seq'::regclass);


--
-- Name: pinned_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pinned_messages ALTER COLUMN id SET DEFAULT nextval('public.pinned_messages_id_seq'::regclass);


--
-- Name: poll_options id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poll_options ALTER COLUMN id SET DEFAULT nextval('public.poll_options_id_seq'::regclass);


--
-- Name: poll_votes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poll_votes ALTER COLUMN id SET DEFAULT nextval('public.poll_votes_id_seq'::regclass);


--
-- Name: polls id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.polls ALTER COLUMN id SET DEFAULT nextval('public.polls_id_seq'::regclass);


--
-- Name: prompt_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prompt_templates ALTER COLUMN id SET DEFAULT nextval('public.prompt_templates_id_seq'::regclass);


--
-- Name: reactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reactions ALTER COLUMN id SET DEFAULT nextval('public.reactions_id_seq'::regclass);


--
-- Name: receipt_marks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipt_marks ALTER COLUMN id SET DEFAULT nextval('public.receipt_marks_id_seq'::regclass);


--
-- Name: reports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports ALTER COLUMN id SET DEFAULT nextval('public.reports_id_seq'::regclass);


--
-- Name: saved_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_messages ALTER COLUMN id SET DEFAULT nextval('public.saved_messages_id_seq'::regclass);


--
-- Name: saved_replies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_replies ALTER COLUMN id SET DEFAULT nextval('public.saved_replies_id_seq'::regclass);


--
-- Name: scheduled_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_messages ALTER COLUMN id SET DEFAULT nextval('public.scheduled_messages_id_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- Name: solid_cable_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_cable_messages ALTER COLUMN id SET DEFAULT nextval('public.solid_cable_messages_id_seq'::regclass);


--
-- Name: solid_cache_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_cache_entries ALTER COLUMN id SET DEFAULT nextval('public.solid_cache_entries_id_seq'::regclass);


--
-- Name: solid_queue_blocked_executions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_blocked_executions ALTER COLUMN id SET DEFAULT nextval('public.solid_queue_blocked_executions_id_seq'::regclass);


--
-- Name: solid_queue_claimed_executions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_claimed_executions ALTER COLUMN id SET DEFAULT nextval('public.solid_queue_claimed_executions_id_seq'::regclass);


--
-- Name: solid_queue_failed_executions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_failed_executions ALTER COLUMN id SET DEFAULT nextval('public.solid_queue_failed_executions_id_seq'::regclass);


--
-- Name: solid_queue_jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_jobs ALTER COLUMN id SET DEFAULT nextval('public.solid_queue_jobs_id_seq'::regclass);


--
-- Name: solid_queue_pauses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_pauses ALTER COLUMN id SET DEFAULT nextval('public.solid_queue_pauses_id_seq'::regclass);


--
-- Name: solid_queue_processes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_processes ALTER COLUMN id SET DEFAULT nextval('public.solid_queue_processes_id_seq'::regclass);


--
-- Name: solid_queue_ready_executions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_ready_executions ALTER COLUMN id SET DEFAULT nextval('public.solid_queue_ready_executions_id_seq'::regclass);


--
-- Name: solid_queue_recurring_executions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_recurring_executions ALTER COLUMN id SET DEFAULT nextval('public.solid_queue_recurring_executions_id_seq'::regclass);


--
-- Name: solid_queue_recurring_tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_recurring_tasks ALTER COLUMN id SET DEFAULT nextval('public.solid_queue_recurring_tasks_id_seq'::regclass);


--
-- Name: solid_queue_scheduled_executions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_scheduled_executions ALTER COLUMN id SET DEFAULT nextval('public.solid_queue_scheduled_executions_id_seq'::regclass);


--
-- Name: solid_queue_semaphores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_semaphores ALTER COLUMN id SET DEFAULT nextval('public.solid_queue_semaphores_id_seq'::regclass);


--
-- Name: sticker_packs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sticker_packs ALTER COLUMN id SET DEFAULT nextval('public.sticker_packs_id_seq'::regclass);


--
-- Name: stickers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stickers ALTER COLUMN id SET DEFAULT nextval('public.stickers_id_seq'::regclass);


--
-- Name: storage_buckets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.storage_buckets ALTER COLUMN id SET DEFAULT nextval('public.storage_buckets_id_seq'::regclass);


--
-- Name: theme_overrides id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theme_overrides ALTER COLUMN id SET DEFAULT nextval('public.theme_overrides_id_seq'::regclass);


--
-- Name: translation_strings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.translation_strings ALTER COLUMN id SET DEFAULT nextval('public.translation_strings_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: verification_codes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_codes ALTER COLUMN id SET DEFAULT nextval('public.verification_codes_id_seq'::regclass);


--
-- Name: web_push_subscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.web_push_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.web_push_subscriptions_id_seq'::regclass);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: active_storage_attachments active_storage_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_storage_attachments
    ADD CONSTRAINT active_storage_attachments_pkey PRIMARY KEY (id);


--
-- Name: active_storage_blobs active_storage_blobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_storage_blobs
    ADD CONSTRAINT active_storage_blobs_pkey PRIMARY KEY (id);


--
-- Name: active_storage_variant_records active_storage_variant_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_storage_variant_records
    ADD CONSTRAINT active_storage_variant_records_pkey PRIMARY KEY (id);


--
-- Name: ai_usage_events ai_usage_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage_events
    ADD CONSTRAINT ai_usage_events_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (key);


--
-- Name: ar_internal_metadata ar_internal_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_internal_metadata
    ADD CONSTRAINT ar_internal_metadata_pkey PRIMARY KEY (key);


--
-- Name: attachments attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_pkey PRIMARY KEY (id);


--
-- Name: audit_events audit_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_events
    ADD CONSTRAINT audit_events_pkey PRIMARY KEY (id);


--
-- Name: blocks blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_pkey PRIMARY KEY (id);


--
-- Name: bot_commands bot_commands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bot_commands
    ADD CONSTRAINT bot_commands_pkey PRIMARY KEY (id);


--
-- Name: bot_memories bot_memories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bot_memories
    ADD CONSTRAINT bot_memories_pkey PRIMARY KEY (id);


--
-- Name: bot_requests bot_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bot_requests
    ADD CONSTRAINT bot_requests_pkey PRIMARY KEY (id);


--
-- Name: bots bots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bots
    ADD CONSTRAINT bots_pkey PRIMARY KEY (id);


--
-- Name: call_participants call_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_participants
    ADD CONSTRAINT call_participants_pkey PRIMARY KEY (id);


--
-- Name: calls calls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calls
    ADD CONSTRAINT calls_pkey PRIMARY KEY (id);


--
-- Name: contact_nicknames contact_nicknames_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_nicknames
    ADD CONSTRAINT contact_nicknames_pkey PRIMARY KEY (id);


--
-- Name: conversation_folder_entries conversation_folder_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_folder_entries
    ADD CONSTRAINT conversation_folder_entries_pkey PRIMARY KEY (id);


--
-- Name: conversation_folders conversation_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_folders
    ADD CONSTRAINT conversation_folders_pkey PRIMARY KEY (id);


--
-- Name: conversation_memberships conversation_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_memberships
    ADD CONSTRAINT conversation_memberships_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: export_jobs export_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.export_jobs
    ADD CONSTRAINT export_jobs_pkey PRIMARY KEY (id);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- Name: font_configs font_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.font_configs
    ADD CONSTRAINT font_configs_pkey PRIMARY KEY (id);


--
-- Name: global_accent_configs global_accent_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_accent_configs
    ADD CONSTRAINT global_accent_configs_pkey PRIMARY KEY (id);


--
-- Name: group_invites group_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_invites
    ADD CONSTRAINT group_invites_pkey PRIMARY KEY (id);


--
-- Name: join_requests join_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.join_requests
    ADD CONSTRAINT join_requests_pkey PRIMARY KEY (id);


--
-- Name: link_previews link_previews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.link_previews
    ADD CONSTRAINT link_previews_pkey PRIMARY KEY (id);


--
-- Name: message_contacts message_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_contacts
    ADD CONSTRAINT message_contacts_pkey PRIMARY KEY (id);


--
-- Name: message_link_previews message_link_previews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_link_previews
    ADD CONSTRAINT message_link_previews_pkey PRIMARY KEY (id);


--
-- Name: message_locations message_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_locations
    ADD CONSTRAINT message_locations_pkey PRIMARY KEY (id);


--
-- Name: message_reminders message_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_reminders
    ADD CONSTRAINT message_reminders_pkey PRIMARY KEY (id);


--
-- Name: message_revisions message_revisions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_revisions
    ADD CONSTRAINT message_revisions_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: passkeys passkeys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.passkeys
    ADD CONSTRAINT passkeys_pkey PRIMARY KEY (id);


--
-- Name: phone_verification_requests phone_verification_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_verification_requests
    ADD CONSTRAINT phone_verification_requests_pkey PRIMARY KEY (id);


--
-- Name: pinned_messages pinned_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pinned_messages
    ADD CONSTRAINT pinned_messages_pkey PRIMARY KEY (id);


--
-- Name: poll_options poll_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poll_options
    ADD CONSTRAINT poll_options_pkey PRIMARY KEY (id);


--
-- Name: poll_votes poll_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_pkey PRIMARY KEY (id);


--
-- Name: polls polls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.polls
    ADD CONSTRAINT polls_pkey PRIMARY KEY (id);


--
-- Name: preferences preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preferences
    ADD CONSTRAINT preferences_pkey PRIMARY KEY (account_id);


--
-- Name: prompt_templates prompt_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prompt_templates
    ADD CONSTRAINT prompt_templates_pkey PRIMARY KEY (id);


--
-- Name: reactions reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT reactions_pkey PRIMARY KEY (id);


--
-- Name: receipt_marks receipt_marks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipt_marks
    ADD CONSTRAINT receipt_marks_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: saved_messages saved_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_messages
    ADD CONSTRAINT saved_messages_pkey PRIMARY KEY (id);


--
-- Name: saved_replies saved_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_replies
    ADD CONSTRAINT saved_replies_pkey PRIMARY KEY (id);


--
-- Name: scheduled_messages scheduled_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_messages
    ADD CONSTRAINT scheduled_messages_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: solid_cable_messages solid_cable_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_cable_messages
    ADD CONSTRAINT solid_cable_messages_pkey PRIMARY KEY (id);


--
-- Name: solid_cache_entries solid_cache_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_cache_entries
    ADD CONSTRAINT solid_cache_entries_pkey PRIMARY KEY (id);


--
-- Name: solid_queue_blocked_executions solid_queue_blocked_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_blocked_executions
    ADD CONSTRAINT solid_queue_blocked_executions_pkey PRIMARY KEY (id);


--
-- Name: solid_queue_claimed_executions solid_queue_claimed_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_claimed_executions
    ADD CONSTRAINT solid_queue_claimed_executions_pkey PRIMARY KEY (id);


--
-- Name: solid_queue_failed_executions solid_queue_failed_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_failed_executions
    ADD CONSTRAINT solid_queue_failed_executions_pkey PRIMARY KEY (id);


--
-- Name: solid_queue_jobs solid_queue_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_jobs
    ADD CONSTRAINT solid_queue_jobs_pkey PRIMARY KEY (id);


--
-- Name: solid_queue_pauses solid_queue_pauses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_pauses
    ADD CONSTRAINT solid_queue_pauses_pkey PRIMARY KEY (id);


--
-- Name: solid_queue_processes solid_queue_processes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_processes
    ADD CONSTRAINT solid_queue_processes_pkey PRIMARY KEY (id);


--
-- Name: solid_queue_ready_executions solid_queue_ready_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_ready_executions
    ADD CONSTRAINT solid_queue_ready_executions_pkey PRIMARY KEY (id);


--
-- Name: solid_queue_recurring_executions solid_queue_recurring_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_recurring_executions
    ADD CONSTRAINT solid_queue_recurring_executions_pkey PRIMARY KEY (id);


--
-- Name: solid_queue_recurring_tasks solid_queue_recurring_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_recurring_tasks
    ADD CONSTRAINT solid_queue_recurring_tasks_pkey PRIMARY KEY (id);


--
-- Name: solid_queue_scheduled_executions solid_queue_scheduled_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_scheduled_executions
    ADD CONSTRAINT solid_queue_scheduled_executions_pkey PRIMARY KEY (id);


--
-- Name: solid_queue_semaphores solid_queue_semaphores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_semaphores
    ADD CONSTRAINT solid_queue_semaphores_pkey PRIMARY KEY (id);


--
-- Name: sticker_packs sticker_packs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sticker_packs
    ADD CONSTRAINT sticker_packs_pkey PRIMARY KEY (id);


--
-- Name: stickers stickers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stickers
    ADD CONSTRAINT stickers_pkey PRIMARY KEY (id);


--
-- Name: storage_buckets storage_buckets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.storage_buckets
    ADD CONSTRAINT storage_buckets_pkey PRIMARY KEY (id);


--
-- Name: storage_quotas storage_quotas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.storage_quotas
    ADD CONSTRAINT storage_quotas_pkey PRIMARY KEY (account_id);


--
-- Name: theme_overrides theme_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theme_overrides
    ADD CONSTRAINT theme_overrides_pkey PRIMARY KEY (id);


--
-- Name: translation_strings translation_strings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.translation_strings
    ADD CONSTRAINT translation_strings_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: verification_codes verification_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_codes
    ADD CONSTRAINT verification_codes_pkey PRIMARY KEY (id);


--
-- Name: web_push_subscriptions web_push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.web_push_subscriptions
    ADD CONSTRAINT web_push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: idx_ai_usage_events_capability; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_usage_events_capability ON public.ai_usage_events USING btree (capability, created_at DESC);


--
-- Name: idx_audit_events_admin_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_events_admin_user ON public.audit_events USING btree (admin_user_id, created_at DESC);


--
-- Name: idx_audit_events_impersonated_account; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_events_impersonated_account ON public.audit_events USING btree (impersonated_account_id, created_at DESC);


--
-- Name: idx_blocks_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_blocks_unique ON public.blocks USING btree (blocker_account_id, blocked_account_id);


--
-- Name: idx_bot_commands_bot_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_bot_commands_bot_name ON public.bot_commands USING btree (bot_id, name);


--
-- Name: idx_bot_memories_bot_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bot_memories_bot_created ON public.bot_memories USING btree (bot_id, created_at DESC);


--
-- Name: idx_bot_memories_embedding_hnsw; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bot_memories_embedding_hnsw ON public.bot_memories USING hnsw (embedding public.vector_cosine_ops);


--
-- Name: idx_call_participants_one_live_per_account; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_call_participants_one_live_per_account ON public.call_participants USING btree (account_id) WHERE ((status)::text = ANY ((ARRAY['ringing'::character varying, 'joined'::character varying])::text[]));


--
-- Name: idx_call_participants_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_call_participants_unique ON public.call_participants USING btree (call_id, account_id);


--
-- Name: idx_contact_nicknames_owner_target; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_contact_nicknames_owner_target ON public.contact_nicknames USING btree (owner_account_id, target_account_id);


--
-- Name: idx_folder_entries_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_folder_entries_unique ON public.conversation_folder_entries USING btree (folder_id, conversation_id);


--
-- Name: idx_font_configs_active_ordered; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_font_configs_active_ordered ON public.font_configs USING btree (is_active, "position");


--
-- Name: idx_join_requests_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_join_requests_unique ON public.join_requests USING btree (conversation_id, account_id);


--
-- Name: idx_memberships_account_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memberships_account_status ON public.conversation_memberships USING btree (account_id, status);


--
-- Name: idx_memberships_account_unarchived; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memberships_account_unarchived ON public.conversation_memberships USING btree (account_id) WHERE (archived_at IS NULL);


--
-- Name: idx_memberships_conversation_account; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_memberships_conversation_account ON public.conversation_memberships USING btree (conversation_id, account_id);


--
-- Name: idx_memberships_pinned; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memberships_pinned ON public.conversation_memberships USING btree (account_id, pinned_at DESC) WHERE (pinned_at IS NOT NULL);


--
-- Name: idx_message_contacts_position; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_message_contacts_position ON public.message_contacts USING btree (message_id, "position");


--
-- Name: idx_message_link_previews_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_message_link_previews_unique ON public.message_link_previews USING btree (message_id, link_preview_id);


--
-- Name: idx_message_reminders_due; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_message_reminders_due ON public.message_reminders USING btree (remind_at) WHERE (completed_at IS NULL);


--
-- Name: idx_message_reminders_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_message_reminders_unique ON public.message_reminders USING btree (account_id, message_id);


--
-- Name: idx_messages_client_nonce_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_messages_client_nonce_unique ON public.messages USING btree (conversation_id, client_nonce) WHERE (client_nonce IS NOT NULL);


--
-- Name: idx_messages_conversation_id_desc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_conversation_id_desc ON public.messages USING btree (conversation_id, id DESC);


--
-- Name: idx_messages_conversation_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_conversation_created ON public.messages USING btree (conversation_id, created_at);


--
-- Name: idx_messages_conversation_kind_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_conversation_kind_created ON public.messages USING btree (conversation_id, kind, created_at DESC);


--
-- Name: idx_messages_conversation_sender_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_conversation_sender_position ON public.messages USING btree (conversation_id, sender_account_id, "position" DESC);


--
-- Name: idx_messages_has_attachment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_has_attachment ON public.messages USING btree (conversation_id, created_at DESC) WHERE (attachment_count > 0);


--
-- Name: idx_messages_has_link; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_has_link ON public.messages USING btree (conversation_id, created_at DESC) WHERE (body ~* 'https?://'::text);


--
-- Name: idx_messages_one_system_per_call; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_messages_one_system_per_call ON public.messages USING btree (((metadata ->> 'call_id'::text))) WHERE (((kind)::text = 'system'::text) AND ((metadata ->> 'call_id'::text) IS NOT NULL));


--
-- Name: idx_phone_verif_requests_code_digest; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_phone_verif_requests_code_digest ON public.phone_verification_requests USING btree (code_digest) WHERE (confirmed_at IS NULL);


--
-- Name: idx_phone_verif_requests_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phone_verif_requests_user_id ON public.phone_verification_requests USING btree (user_id) WHERE (confirmed_at IS NULL);


--
-- Name: idx_pinned_messages_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_pinned_messages_unique ON public.pinned_messages USING btree (conversation_id, message_id);


--
-- Name: idx_poll_options_position; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_poll_options_position ON public.poll_options USING btree (poll_id, "position");


--
-- Name: idx_poll_votes_option_account; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_poll_votes_option_account ON public.poll_votes USING btree (poll_option_id, account_id);


--
-- Name: idx_poll_votes_poll_account; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_poll_votes_poll_account ON public.poll_votes USING btree (poll_id, account_id);


--
-- Name: idx_reactions_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_reactions_unique ON public.reactions USING btree (message_id, account_id, emoji);


--
-- Name: idx_receipt_marks_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_receipt_marks_unique ON public.receipt_marks USING btree (membership_id, kind, "position");


--
-- Name: idx_reports_open_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_reports_open_unique ON public.reports USING btree (reporter_account_id, subject_type, subject_id) WHERE ((status)::text = 'pending'::text);


--
-- Name: idx_reports_status_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_status_created ON public.reports USING btree (status, created_at);


--
-- Name: idx_saved_messages_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_saved_messages_unique ON public.saved_messages USING btree (account_id, message_id);


--
-- Name: idx_saved_replies_shortcut; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_saved_replies_shortcut ON public.saved_replies USING btree (account_id, shortcut);


--
-- Name: index_sticker_packs_on_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_sticker_packs_on_slug ON public.sticker_packs USING btree (slug);


--
-- Name: index_stickers_on_blob_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_stickers_on_blob_id ON public.stickers USING btree (blob_id);


--
-- Name: index_stickers_on_sticker_pack_id_and_shortcode; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_stickers_on_sticker_pack_id_and_shortcode ON public.stickers USING btree (sticker_pack_id, shortcode);


--
-- Name: idx_scheduled_messages_client_nonce; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_scheduled_messages_client_nonce ON public.scheduled_messages USING btree (client_nonce) WHERE (client_nonce IS NOT NULL);


--
-- Name: idx_scheduled_messages_next_run; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scheduled_messages_next_run ON public.scheduled_messages USING btree (next_run_at) WHERE (recurrence_rule IS NOT NULL);


--
-- Name: idx_verification_codes_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_verification_codes_active ON public.verification_codes USING btree (user_id, purpose) WHERE (consumed_at IS NULL);


--
-- Name: idx_web_push_subs_user_endpoint; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_web_push_subs_user_endpoint ON public.web_push_subscriptions USING btree (user_id, endpoint);


--
-- Name: index_accounts_on_kind; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_accounts_on_kind ON public.accounts USING btree (kind) WHERE (deactivated_at IS NULL);


--
-- Name: index_accounts_on_username; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_accounts_on_username ON public.accounts USING btree (username);


--
-- Name: index_active_storage_attachments_on_blob_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_active_storage_attachments_on_blob_id ON public.active_storage_attachments USING btree (blob_id);


--
-- Name: index_active_storage_attachments_uniqueness; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_active_storage_attachments_uniqueness ON public.active_storage_attachments USING btree (record_type, record_id, name, blob_id);


--
-- Name: index_active_storage_blobs_on_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_active_storage_blobs_on_key ON public.active_storage_blobs USING btree (key);


--
-- Name: index_active_storage_variant_records_uniqueness; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_active_storage_variant_records_uniqueness ON public.active_storage_variant_records USING btree (blob_id, variation_digest);


--
-- Name: index_ai_usage_events_on_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_ai_usage_events_on_created_at ON public.ai_usage_events USING btree (created_at DESC);


--
-- Name: index_attachments_on_checksum; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_attachments_on_checksum ON public.attachments USING btree (checksum);


--
-- Name: index_attachments_on_kind; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_attachments_on_kind ON public.attachments USING btree (kind);


--
-- Name: index_attachments_on_message_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_attachments_on_message_id ON public.attachments USING btree (message_id);


--
-- Name: index_blocks_on_blocked_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_blocks_on_blocked_account_id ON public.blocks USING btree (blocked_account_id);


--
-- Name: index_bot_requests_on_bot_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_bot_requests_on_bot_id ON public.bot_requests USING btree (bot_id);


--
-- Name: index_bot_requests_on_kind; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_bot_requests_on_kind ON public.bot_requests USING btree (kind);


--
-- Name: index_bot_requests_on_requester_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_bot_requests_on_requester_account_id ON public.bot_requests USING btree (requester_account_id);


--
-- Name: index_bot_requests_on_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_bot_requests_on_status ON public.bot_requests USING btree (status);


--
-- Name: index_bot_requests_on_target_bot_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_bot_requests_on_target_bot_id ON public.bot_requests USING btree (target_bot_id);


--
-- Name: index_bots_on_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_bots_on_account_id ON public.bots USING btree (account_id);


--
-- Name: index_bots_on_owner_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_bots_on_owner_account_id ON public.bots USING btree (owner_account_id);


--
-- Name: index_conversation_folder_entries_on_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_conversation_folder_entries_on_conversation_id ON public.conversation_folder_entries USING btree (conversation_id);


--
-- Name: index_conversation_folder_entries_on_folder_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_conversation_folder_entries_on_folder_id ON public.conversation_folder_entries USING btree (folder_id);


--
-- Name: index_conversation_folders_on_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_conversation_folders_on_account_id ON public.conversation_folders USING btree (account_id);


--
-- Name: index_conversations_on_direct_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_conversations_on_direct_key ON public.conversations USING btree (direct_key);


--
-- Name: index_conversations_on_last_activity_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_conversations_on_last_activity_at ON public.conversations USING btree (last_activity_at DESC);


--
-- Name: index_export_jobs_on_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_export_jobs_on_account_id ON public.export_jobs USING btree (account_id);


--
-- Name: index_export_jobs_on_blob_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_export_jobs_on_blob_id ON public.export_jobs USING btree (blob_id);


--
-- Name: index_export_jobs_on_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_export_jobs_on_conversation_id ON public.export_jobs USING btree (conversation_id);


--
-- Name: index_export_jobs_on_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_export_jobs_on_expires_at ON public.export_jobs USING btree (expires_at);


--
-- Name: index_feature_flags_on_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_feature_flags_on_key ON public.feature_flags USING btree (key);


--
-- Name: index_font_configs_on_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_font_configs_on_name ON public.font_configs USING btree (name);


--
-- Name: index_group_invites_on_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_group_invites_on_conversation_id ON public.group_invites USING btree (conversation_id);


--
-- Name: index_group_invites_on_token; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_group_invites_on_token ON public.group_invites USING btree (token);


--
-- Name: index_join_requests_on_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_join_requests_on_account_id ON public.join_requests USING btree (account_id);


--
-- Name: index_join_requests_on_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_join_requests_on_conversation_id ON public.join_requests USING btree (conversation_id);


--
-- Name: index_link_previews_on_url; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_link_previews_on_url ON public.link_previews USING btree (url);


--
-- Name: index_message_link_previews_on_link_preview_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_message_link_previews_on_link_preview_id ON public.message_link_previews USING btree (link_preview_id);


--
-- Name: index_message_link_previews_on_message_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_message_link_previews_on_message_id ON public.message_link_previews USING btree (message_id);


--
-- Name: index_message_locations_on_message_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_message_locations_on_message_id ON public.message_locations USING btree (message_id);


--
-- Name: index_message_revisions_on_message_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_message_revisions_on_message_id ON public.message_revisions USING btree (message_id);


--
-- Name: index_messages_on_conversation_id_and_position; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_messages_on_conversation_id_and_position ON public.messages USING btree (conversation_id, "position");


--
-- Name: index_messages_on_conversation_id_and_revision; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_messages_on_conversation_id_and_revision ON public.messages USING btree (conversation_id, revision);


--
-- Name: index_messages_on_search_vector; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_messages_on_search_vector ON public.messages USING gin (search_vector);


--
-- Name: index_messages_on_sender_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_messages_on_sender_account_id ON public.messages USING btree (sender_account_id);


--
-- Name: index_passkeys_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_passkeys_on_user_id ON public.passkeys USING btree (user_id);


--
-- Name: index_passkeys_on_webauthn_credential_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_passkeys_on_webauthn_credential_id ON public.passkeys USING btree (webauthn_credential_id);


--
-- Name: index_polls_on_message_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_polls_on_message_id ON public.polls USING btree (message_id);


--
-- Name: index_prompt_templates_on_capability_and_version; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_prompt_templates_on_capability_and_version ON public.prompt_templates USING btree (capability, version);


--
-- Name: index_reactions_on_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_reactions_on_account_id ON public.reactions USING btree (account_id);


--
-- Name: index_reactions_on_message_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_reactions_on_message_id ON public.reactions USING btree (message_id);


--
-- Name: index_scheduled_messages_on_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_scheduled_messages_on_conversation_id ON public.scheduled_messages USING btree (conversation_id);


--
-- Name: index_scheduled_messages_on_scheduled_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_scheduled_messages_on_scheduled_at ON public.scheduled_messages USING btree (scheduled_at);


--
-- Name: index_scheduled_messages_on_sender_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_scheduled_messages_on_sender_account_id ON public.scheduled_messages USING btree (sender_account_id);


--
-- Name: index_sessions_on_jti; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_sessions_on_jti ON public.sessions USING btree (jti);


--
-- Name: index_sessions_on_user_id_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sessions_on_user_id_active ON public.sessions USING btree (user_id) WHERE (revoked_at IS NULL);


--
-- Name: index_solid_cable_messages_on_channel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_cable_messages_on_channel ON public.solid_cable_messages USING btree (channel);


--
-- Name: index_solid_cable_messages_on_channel_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_cable_messages_on_channel_hash ON public.solid_cable_messages USING btree (channel_hash);


--
-- Name: index_solid_cable_messages_on_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_cable_messages_on_created_at ON public.solid_cable_messages USING btree (created_at);


--
-- Name: index_solid_cache_entries_on_byte_size; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_cache_entries_on_byte_size ON public.solid_cache_entries USING btree (byte_size);


--
-- Name: index_solid_cache_entries_on_key_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_solid_cache_entries_on_key_hash ON public.solid_cache_entries USING btree (key_hash);


--
-- Name: index_solid_cache_entries_on_key_hash_and_byte_size; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_cache_entries_on_key_hash_and_byte_size ON public.solid_cache_entries USING btree (key_hash, byte_size);


--
-- Name: index_solid_queue_blocked_executions_for_maintenance; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_blocked_executions_for_maintenance ON public.solid_queue_blocked_executions USING btree (expires_at, concurrency_key);


--
-- Name: index_solid_queue_blocked_executions_for_release; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_blocked_executions_for_release ON public.solid_queue_blocked_executions USING btree (concurrency_key, priority, job_id);


--
-- Name: index_solid_queue_blocked_executions_on_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_solid_queue_blocked_executions_on_job_id ON public.solid_queue_blocked_executions USING btree (job_id);


--
-- Name: index_solid_queue_claimed_executions_on_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_solid_queue_claimed_executions_on_job_id ON public.solid_queue_claimed_executions USING btree (job_id);


--
-- Name: index_solid_queue_claimed_executions_on_process_id_and_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_claimed_executions_on_process_id_and_job_id ON public.solid_queue_claimed_executions USING btree (process_id, job_id);


--
-- Name: index_solid_queue_dispatch_all; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_dispatch_all ON public.solid_queue_scheduled_executions USING btree (scheduled_at, priority, job_id);


--
-- Name: index_solid_queue_failed_executions_on_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_solid_queue_failed_executions_on_job_id ON public.solid_queue_failed_executions USING btree (job_id);


--
-- Name: index_solid_queue_jobs_for_alerting; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_jobs_for_alerting ON public.solid_queue_jobs USING btree (scheduled_at, finished_at);


--
-- Name: index_solid_queue_jobs_for_filtering; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_jobs_for_filtering ON public.solid_queue_jobs USING btree (queue_name, finished_at);


--
-- Name: index_solid_queue_jobs_on_active_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_jobs_on_active_job_id ON public.solid_queue_jobs USING btree (active_job_id);


--
-- Name: index_solid_queue_jobs_on_class_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_jobs_on_class_name ON public.solid_queue_jobs USING btree (class_name);


--
-- Name: index_solid_queue_jobs_on_finished_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_jobs_on_finished_at ON public.solid_queue_jobs USING btree (finished_at);


--
-- Name: index_solid_queue_pauses_on_queue_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_solid_queue_pauses_on_queue_name ON public.solid_queue_pauses USING btree (queue_name);


--
-- Name: index_solid_queue_poll_all; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_poll_all ON public.solid_queue_ready_executions USING btree (priority, job_id);


--
-- Name: index_solid_queue_poll_by_queue; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_poll_by_queue ON public.solid_queue_ready_executions USING btree (queue_name, priority, job_id);


--
-- Name: index_solid_queue_processes_on_last_heartbeat_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_processes_on_last_heartbeat_at ON public.solid_queue_processes USING btree (last_heartbeat_at);


--
-- Name: index_solid_queue_processes_on_name_and_supervisor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_solid_queue_processes_on_name_and_supervisor_id ON public.solid_queue_processes USING btree (name, supervisor_id);


--
-- Name: index_solid_queue_processes_on_supervisor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_processes_on_supervisor_id ON public.solid_queue_processes USING btree (supervisor_id);


--
-- Name: index_solid_queue_ready_executions_on_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_solid_queue_ready_executions_on_job_id ON public.solid_queue_ready_executions USING btree (job_id);


--
-- Name: index_solid_queue_recurring_executions_on_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_solid_queue_recurring_executions_on_job_id ON public.solid_queue_recurring_executions USING btree (job_id);


--
-- Name: index_solid_queue_recurring_executions_on_task_key_and_run_at; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_solid_queue_recurring_executions_on_task_key_and_run_at ON public.solid_queue_recurring_executions USING btree (task_key, run_at);


--
-- Name: index_solid_queue_recurring_tasks_on_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_solid_queue_recurring_tasks_on_key ON public.solid_queue_recurring_tasks USING btree (key);


--
-- Name: index_solid_queue_recurring_tasks_on_static; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_recurring_tasks_on_static ON public.solid_queue_recurring_tasks USING btree (static);


--
-- Name: index_solid_queue_scheduled_executions_on_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_solid_queue_scheduled_executions_on_job_id ON public.solid_queue_scheduled_executions USING btree (job_id);


--
-- Name: index_solid_queue_semaphores_on_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_semaphores_on_expires_at ON public.solid_queue_semaphores USING btree (expires_at);


--
-- Name: index_solid_queue_semaphores_on_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_solid_queue_semaphores_on_key ON public.solid_queue_semaphores USING btree (key);


--
-- Name: index_solid_queue_semaphores_on_key_and_value; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_solid_queue_semaphores_on_key_and_value ON public.solid_queue_semaphores USING btree (key, value);


--
-- Name: index_storage_buckets_on_service_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_storage_buckets_on_service_name ON public.storage_buckets USING btree (service_name);


--
-- Name: index_storage_buckets_on_status_and_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_storage_buckets_on_status_and_priority ON public.storage_buckets USING btree (status, priority);


--
-- Name: index_theme_overrides_on_theme_and_token_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_theme_overrides_on_theme_and_token_name ON public.theme_overrides USING btree (theme, token_name);


--
-- Name: index_translation_strings_on_key_and_locale; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_translation_strings_on_key_and_locale ON public.translation_strings USING btree (key, locale);


--
-- Name: index_users_on_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_users_on_account_id ON public.users USING btree (account_id);


--
-- Name: index_users_on_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_users_on_email ON public.users USING btree (email);


--
-- Name: index_users_on_google_subject; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_users_on_google_subject ON public.users USING btree (google_subject);


--
-- Name: index_users_on_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_users_on_phone ON public.users USING btree (phone) WHERE (phone IS NOT NULL);


--
-- Name: index_users_on_webauthn_handle; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_users_on_webauthn_handle ON public.users USING btree (webauthn_handle);


--
-- Name: index_web_push_subscriptions_on_endpoint; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_web_push_subscriptions_on_endpoint ON public.web_push_subscriptions USING btree (endpoint);


--
-- Name: messages fk_rails_0348d0c85c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_rails_0348d0c85c FOREIGN KEY (reply_to_message_id) REFERENCES public.messages(id) ON DELETE SET NULL;


--
-- Name: group_invites fk_rails_05ccd7dcd1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_invites
    ADD CONSTRAINT fk_rails_05ccd7dcd1 FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: polls fk_rails_09aa6c0c53; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.polls
    ADD CONSTRAINT fk_rails_09aa6c0c53 FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: message_locations fk_rails_0a70a8021b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_locations
    ADD CONSTRAINT fk_rails_0a70a8021b FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: receipt_marks fk_rails_0b3f6aad97; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipt_marks
    ADD CONSTRAINT fk_rails_0b3f6aad97 FOREIGN KEY (membership_id) REFERENCES public.conversation_memberships(id) ON DELETE CASCADE;


--
-- Name: saved_replies fk_rails_0d50a1473c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_replies
    ADD CONSTRAINT fk_rails_0d50a1473c FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: conversation_memberships fk_rails_1735334e15; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_memberships
    ADD CONSTRAINT fk_rails_1735334e15 FOREIGN KEY (invited_by_account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- Name: pinned_messages fk_rails_1801e5ee07; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pinned_messages
    ADD CONSTRAINT fk_rails_1801e5ee07 FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: message_link_previews fk_rails_19edd68416; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_link_previews
    ADD CONSTRAINT fk_rails_19edd68416 FOREIGN KEY (link_preview_id) REFERENCES public.link_previews(id) ON DELETE CASCADE;


--
-- Name: message_revisions fk_rails_1e42adec78; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_revisions
    ADD CONSTRAINT fk_rails_1e42adec78 FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: bot_memories fk_rails_22f52479ff; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bot_memories
    ADD CONSTRAINT fk_rails_22f52479ff FOREIGN KEY (source_message_id) REFERENCES public.messages(id) ON DELETE SET NULL;


--
-- Name: bot_memories fk_rails_23e1650e76; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bot_memories
    ADD CONSTRAINT fk_rails_23e1650e76 FOREIGN KEY (bot_id) REFERENCES public.bots(id) ON DELETE CASCADE;


--
-- Name: messages fk_rails_24e8f4336a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_rails_24e8f4336a FOREIGN KEY (forwarded_from_account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- Name: verification_codes fk_rails_28623a8649; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_codes
    ADD CONSTRAINT fk_rails_28623a8649 FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: audit_events fk_rails_2a7425a870; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_events
    ADD CONSTRAINT fk_rails_2a7425a870 FOREIGN KEY (admin_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: reports fk_rails_2b49dbebe5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT fk_rails_2b49dbebe5 FOREIGN KEY (reviewed_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: conversation_folder_entries fk_rails_2c58611139; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_folder_entries
    ADD CONSTRAINT fk_rails_2c58611139 FOREIGN KEY (folder_id) REFERENCES public.conversation_folders(id) ON DELETE CASCADE;


--
-- Name: attachments fk_rails_2e464e7384; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT fk_rails_2e464e7384 FOREIGN KEY (storage_bucket_id) REFERENCES public.storage_buckets(id) ON DELETE SET NULL;


--
-- Name: blocks fk_rails_2e81753314; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT fk_rails_2e81753314 FOREIGN KEY (blocker_account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: call_participants fk_rails_2ebb1c0034; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_participants
    ADD CONSTRAINT fk_rails_2ebb1c0034 FOREIGN KEY (call_id) REFERENCES public.calls(id) ON DELETE CASCADE;


--
-- Name: solid_queue_recurring_executions fk_rails_318a5533ed; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_recurring_executions
    ADD CONSTRAINT fk_rails_318a5533ed FOREIGN KEY (job_id) REFERENCES public.solid_queue_jobs(id) ON DELETE CASCADE;


--
-- Name: scheduled_messages fk_rails_3465c6cd26; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_messages
    ADD CONSTRAINT fk_rails_3465c6cd26 FOREIGN KEY (reply_to_message_id) REFERENCES public.messages(id) ON DELETE SET NULL;


--
-- Name: phone_verification_requests fk_rails_378a38ef90; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_verification_requests
    ADD CONSTRAINT fk_rails_378a38ef90 FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: solid_queue_failed_executions fk_rails_39bbc7a631; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_failed_executions
    ADD CONSTRAINT fk_rails_39bbc7a631 FOREIGN KEY (job_id) REFERENCES public.solid_queue_jobs(id) ON DELETE CASCADE;


--
-- Name: join_requests fk_rails_3e0dae3d38; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.join_requests
    ADD CONSTRAINT fk_rails_3e0dae3d38 FOREIGN KEY (reviewed_by_account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- Name: ai_usage_events fk_rails_3eafbbc4a8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage_events
    ADD CONSTRAINT fk_rails_3eafbbc4a8 FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- Name: feature_flags fk_rails_42c3909528; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT fk_rails_42c3909528 FOREIGN KEY (updated_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: messages fk_rails_45444cdc6b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_rails_45444cdc6b FOREIGN KEY (sender_account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- Name: pinned_messages fk_rails_4a5f237c43; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pinned_messages
    ADD CONSTRAINT fk_rails_4a5f237c43 FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: solid_queue_blocked_executions fk_rails_4cd34e2228; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_blocked_executions
    ADD CONSTRAINT fk_rails_4cd34e2228 FOREIGN KEY (job_id) REFERENCES public.solid_queue_jobs(id) ON DELETE CASCADE;


--
-- Name: join_requests fk_rails_4d8b9989a2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.join_requests
    ADD CONSTRAINT fk_rails_4d8b9989a2 FOREIGN KEY (group_invite_id) REFERENCES public.group_invites(id) ON DELETE SET NULL;


--
-- Name: saved_messages fk_rails_4de06c177f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_messages
    ADD CONSTRAINT fk_rails_4de06c177f FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: saved_messages fk_rails_575c03d0eb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_messages
    ADD CONSTRAINT fk_rails_575c03d0eb FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: conversation_memberships fk_rails_5bb1008867; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_memberships
    ADD CONSTRAINT fk_rails_5bb1008867 FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: join_requests fk_rails_5e21d1315a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.join_requests
    ADD CONSTRAINT fk_rails_5e21d1315a FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: users fk_rails_61ac11da2b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_rails_61ac11da2b FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: message_reminders fk_rails_64b334a761; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_reminders
    ADD CONSTRAINT fk_rails_64b334a761 FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: conversation_memberships fk_rails_67a38991f3; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_memberships
    ADD CONSTRAINT fk_rails_67a38991f3 FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: group_invites fk_rails_68303df2fb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_invites
    ADD CONSTRAINT fk_rails_68303df2fb FOREIGN KEY (created_by_account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: reactions fk_rails_6bb5033c5f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT fk_rails_6bb5033c5f FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: sessions fk_rails_758836b4f0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT fk_rails_758836b4f0 FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: bot_requests fk_rails_7aa28fe07c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bot_requests
    ADD CONSTRAINT fk_rails_7aa28fe07c FOREIGN KEY (target_bot_id) REFERENCES public.bots(id) ON DELETE SET NULL;


--
-- Name: messages fk_rails_7f927086d2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_rails_7f927086d2 FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: conversations fk_rails_7f99971094; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT fk_rails_7f99971094 FOREIGN KEY (last_message_id) REFERENCES public.messages(id) ON DELETE SET NULL;


--
-- Name: export_jobs fk_rails_export_jobs_account; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.export_jobs
    ADD CONSTRAINT fk_rails_export_jobs_account FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: export_jobs fk_rails_export_jobs_blob; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.export_jobs
    ADD CONSTRAINT fk_rails_export_jobs_blob FOREIGN KEY (blob_id) REFERENCES public.active_storage_blobs(id) ON DELETE SET NULL;


--
-- Name: export_jobs fk_rails_export_jobs_conversation; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.export_jobs
    ADD CONSTRAINT fk_rails_export_jobs_conversation FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: solid_queue_ready_executions fk_rails_81fcbd66af; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_ready_executions
    ADD CONSTRAINT fk_rails_81fcbd66af FOREIGN KEY (job_id) REFERENCES public.solid_queue_jobs(id) ON DELETE CASCADE;


--
-- Name: poll_votes fk_rails_848ece0184; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT fk_rails_848ece0184 FOREIGN KEY (poll_option_id) REFERENCES public.poll_options(id) ON DELETE CASCADE;


--
-- Name: conversations fk_rails_88c0de3c54; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT fk_rails_88c0de3c54 FOREIGN KEY (summarized_through_message_id) REFERENCES public.messages(id) ON DELETE SET NULL;


--
-- Name: conversation_folder_entries fk_rails_8c0ab5d855; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_folder_entries
    ADD CONSTRAINT fk_rails_8c0ab5d855 FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: call_participants fk_rails_8cc3141197; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_participants
    ADD CONSTRAINT fk_rails_8cc3141197 FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: scheduled_messages fk_rails_8e2fe8f92e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_messages
    ADD CONSTRAINT fk_rails_8e2fe8f92e FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: translation_strings fk_rails_8f6b35e063; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.translation_strings
    ADD CONSTRAINT fk_rails_8f6b35e063 FOREIGN KEY (updated_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: passkeys fk_rails_902db11bce; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.passkeys
    ADD CONSTRAINT fk_rails_902db11bce FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: bot_requests fk_rails_914ca4b314; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bot_requests
    ADD CONSTRAINT fk_rails_914ca4b314 FOREIGN KEY (requester_account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: audit_events fk_rails_9367c8ecf6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_events
    ADD CONSTRAINT fk_rails_9367c8ecf6 FOREIGN KEY (impersonated_account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- Name: scheduled_messages fk_rails_97ca2bfa8f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_messages
    ADD CONSTRAINT fk_rails_97ca2bfa8f FOREIGN KEY (sender_account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: active_storage_variant_records fk_rails_993965df05; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_storage_variant_records
    ADD CONSTRAINT fk_rails_993965df05 FOREIGN KEY (blob_id) REFERENCES public.active_storage_blobs(id);


--
-- Name: bots fk_rails_9b21ca3b89; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bots
    ADD CONSTRAINT fk_rails_9b21ca3b89 FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: solid_queue_claimed_executions fk_rails_9cfe4d4944; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_claimed_executions
    ADD CONSTRAINT fk_rails_9cfe4d4944 FOREIGN KEY (job_id) REFERENCES public.solid_queue_jobs(id) ON DELETE CASCADE;


--
-- Name: poll_votes fk_rails_a6e6974b7e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT fk_rails_a6e6974b7e FOREIGN KEY (poll_id) REFERENCES public.polls(id) ON DELETE CASCADE;


--
-- Name: contact_nicknames fk_rails_a777958b87; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_nicknames
    ADD CONSTRAINT fk_rails_a777958b87 FOREIGN KEY (target_account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: calls fk_rails_a7815d2447; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calls
    ADD CONSTRAINT fk_rails_a7815d2447 FOREIGN KEY (initiator_account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: poll_options fk_rails_aa85becb42; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poll_options
    ADD CONSTRAINT fk_rails_aa85becb42 FOREIGN KEY (poll_id) REFERENCES public.polls(id) ON DELETE CASCADE;


--
-- Name: message_contacts fk_rails_acfaedb38f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_contacts
    ADD CONSTRAINT fk_rails_acfaedb38f FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: bot_requests fk_rails_ad263696a2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bot_requests
    ADD CONSTRAINT fk_rails_ad263696a2 FOREIGN KEY (bot_id) REFERENCES public.bots(id) ON DELETE SET NULL;


--
-- Name: blocks fk_rails_af5d876eda; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT fk_rails_af5d876eda FOREIGN KEY (blocked_account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: web_push_subscriptions fk_rails_b006f28dac; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.web_push_subscriptions
    ADD CONSTRAINT fk_rails_b006f28dac FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: poll_votes fk_rails_b6c18cf44a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT fk_rails_b6c18cf44a FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: attachments fk_rails_b804ba74cc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT fk_rails_b804ba74cc FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: theme_overrides fk_rails_b94bab4178; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theme_overrides
    ADD CONSTRAINT fk_rails_b94bab4178 FOREIGN KEY (updated_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: pinned_messages fk_rails_bda7591d4f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pinned_messages
    ADD CONSTRAINT fk_rails_bda7591d4f FOREIGN KEY (pinned_by_account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: bot_memories fk_rails_be088b96a0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bot_memories
    ADD CONSTRAINT fk_rails_be088b96a0 FOREIGN KEY (source_account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- Name: active_storage_attachments fk_rails_c3b3935057; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_storage_attachments
    ADD CONSTRAINT fk_rails_c3b3935057 FOREIGN KEY (blob_id) REFERENCES public.active_storage_blobs(id);


--
-- Name: solid_queue_scheduled_executions fk_rails_c4316f352d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solid_queue_scheduled_executions
    ADD CONSTRAINT fk_rails_c4316f352d FOREIGN KEY (job_id) REFERENCES public.solid_queue_jobs(id) ON DELETE CASCADE;


--
-- Name: contact_nicknames fk_rails_c478085334; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_nicknames
    ADD CONSTRAINT fk_rails_c478085334 FOREIGN KEY (owner_account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: ai_usage_events fk_rails_c4ce20fceb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage_events
    ADD CONSTRAINT fk_rails_c4ce20fceb FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE SET NULL;


--
-- Name: app_settings fk_rails_cae782806b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT fk_rails_cae782806b FOREIGN KEY (updated_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: message_contacts fk_rails_cc45cf32a0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_contacts
    ADD CONSTRAINT fk_rails_cc45cf32a0 FOREIGN KEY (contact_account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- Name: conversation_folders fk_rails_cf9a247271; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_folders
    ADD CONSTRAINT fk_rails_cf9a247271 FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: prompt_templates fk_rails_d39e2ee1ec; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prompt_templates
    ADD CONSTRAINT fk_rails_d39e2ee1ec FOREIGN KEY (updated_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: calls fk_rails_d52ed8fe71; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calls
    ADD CONSTRAINT fk_rails_d52ed8fe71 FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: reports fk_rails_dc81cbf026; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT fk_rails_dc81cbf026 FOREIGN KEY (reporter_account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: storage_quotas fk_rails_df3ac85a1f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.storage_quotas
    ADD CONSTRAINT fk_rails_df3ac85a1f FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: sticker_packs fk_sticker_packs_owner; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sticker_packs
    ADD CONSTRAINT fk_sticker_packs_owner FOREIGN KEY (owner_account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: stickers fk_stickers_blob; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stickers
    ADD CONSTRAINT fk_stickers_blob FOREIGN KEY (blob_id) REFERENCES public.active_storage_blobs(id) ON DELETE RESTRICT;


--
-- Name: stickers fk_stickers_pack; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stickers
    ADD CONSTRAINT fk_stickers_pack FOREIGN KEY (sticker_pack_id) REFERENCES public.sticker_packs(id) ON DELETE CASCADE;


--
-- Name: preferences fk_rails_e25e938d7c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preferences
    ADD CONSTRAINT fk_rails_e25e938d7c FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: join_requests fk_rails_e626791730; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.join_requests
    ADD CONSTRAINT fk_rails_e626791730 FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: reactions fk_rails_f1a9895a1f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT fk_rails_f1a9895a1f FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: message_reminders fk_rails_f5db81e968; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_reminders
    ADD CONSTRAINT fk_rails_f5db81e968 FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: bots fk_rails_fc2479a1d3; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bots
    ADD CONSTRAINT fk_rails_fc2479a1d3 FOREIGN KEY (owner_account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- Name: message_link_previews fk_rails_fcc7327676; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_link_previews
    ADD CONSTRAINT fk_rails_fcc7327676 FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: bot_commands fk_rails_fe7c59d7b8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bot_commands
    ADD CONSTRAINT fk_rails_fe7c59d7b8 FOREIGN KEY (bot_id) REFERENCES public.bots(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

SET search_path TO "$user", public;

INSERT INTO "schema_migrations" (version) VALUES
('20260831183000'),
('20260831163000'),
('20260831140000'),
('20260831053000'),
('20260830235000'),
('20260830223100'),
('20260830203400'),
('20260830193700'),
('20260830100000'),
('20260830085500'),
('20260830074100'),
('20260830052200'),
('20260830040900'),
('20260830000000'),
('20260826143000'),
('20260812025731'),
('20260812025517');

