--
-- PostgreSQL database dump
--

\restrict 5KrA8DoaBnEWT1Mi19YCWDjcvgsIU7Ai8GscZ8tCFEBd8gJ8Hnc1yx3CPzCxdta

-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 18.4

-- Started on 2026-08-27 16:19:55

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 223 (class 1259 OID 34572)
-- Name: families; Type: TABLE; Schema: public; Owner: app-133
--

CREATE TABLE public.families (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(8) NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.families OWNER TO "app-133";

--
-- TOC entry 222 (class 1259 OID 34571)
-- Name: families_id_seq; Type: SEQUENCE; Schema: public; Owner: app-133
--

CREATE SEQUENCE public.families_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.families_id_seq OWNER TO "app-133";

--
-- TOC entry 3434 (class 0 OID 0)
-- Dependencies: 222
-- Name: families_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: app-133
--

ALTER SEQUENCE public.families_id_seq OWNED BY public.families.id;


--
-- TOC entry 3278 (class 2604 OID 34575)
-- Name: families id; Type: DEFAULT; Schema: public; Owner: app-133
--

ALTER TABLE ONLY public.families ALTER COLUMN id SET DEFAULT nextval('public.families_id_seq'::regclass);


--
-- TOC entry 3428 (class 0 OID 34572)
-- Dependencies: 223
-- Data for Name: families; Type: TABLE DATA; Schema: public; Owner: app-133
--

COPY public.families (id, name, code, created_by, created_at) FROM stdin;
1	Dubová5531	7C272A7F	1	2026-04-30 22:38:17.969539
\.


--
-- TOC entry 3435 (class 0 OID 0)
-- Dependencies: 222
-- Name: families_id_seq; Type: SEQUENCE SET; Schema: public; Owner: app-133
--

SELECT pg_catalog.setval('public.families_id_seq', 1, true);


--
-- TOC entry 3281 (class 2606 OID 34580)
-- Name: families families_code_unique; Type: CONSTRAINT; Schema: public; Owner: app-133
--

ALTER TABLE ONLY public.families
    ADD CONSTRAINT families_code_unique UNIQUE (code);


--
-- TOC entry 3283 (class 2606 OID 34578)
-- Name: families families_pkey; Type: CONSTRAINT; Schema: public; Owner: app-133
--

ALTER TABLE ONLY public.families
    ADD CONSTRAINT families_pkey PRIMARY KEY (id);


-- Completed on 2026-08-27 16:19:56

--
-- PostgreSQL database dump complete
--

\unrestrict 5KrA8DoaBnEWT1Mi19YCWDjcvgsIU7Ai8GscZ8tCFEBd8gJ8Hnc1yx3CPzCxdta

