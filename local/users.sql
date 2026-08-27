--
-- PostgreSQL database dump
--

\restrict U3Rie6JEcvJnpJkYUhbtnSSnOcZEzPGu4YUikgvwZocd0PBaeHqnLlgqv5J2etf

-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 18.4

-- Started on 2026-08-27 16:21:22

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
-- TOC entry 228 (class 1259 OID 34597)
-- Name: users; Type: TABLE; Schema: public; Owner: app-133
--

CREATE TABLE public.users (
    id integer NOT NULL,
    google_id character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    display_name character varying(255) NOT NULL,
    photo_url text,
    family_id integer,
    role public.user_role,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO "app-133";

--
-- TOC entry 227 (class 1259 OID 34596)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: app-133
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO "app-133";

--
-- TOC entry 3435 (class 0 OID 0)
-- Dependencies: 227
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: app-133
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3278 (class 2604 OID 34600)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: app-133
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3429 (class 0 OID 34597)
-- Dependencies: 228
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: app-133
--

COPY public.users (id, google_id, email, display_name, photo_url, family_id, role, created_at) FROM stdin;
1	118032264964153073600	tom.kazda@gmail.com	Tomáš Kazda	https://lh3.googleusercontent.com/a/ACg8ocJtu7gXcpmZRpINMmnuSd8u_Mh3GjVhlEv587b1386hFeB5w-jA=s96-c	1	parent	2026-04-30 22:37:43.036479
3	106668804282513074926	kristyna.sulcova@gmail.com	Kristýna Šulcová	https://lh3.googleusercontent.com/a/ACg8ocJIHkB0JXmoqL9Z6qY3sSJn1Ce4VEIP96siMpXWLahDIbyX-Q=s96-c	1	parent	2026-05-01 07:16:31.904732
2	108990502186434854401	onda.kazda@gmail.com	Ondřej Kazda	https://lh3.googleusercontent.com/a-/ALV-UjXiT46CU_hQ87YN5AqPiF5MT5yeNp2kaPg_zplq1Hft6oH4iafvDpNnWZ0BAPjyU334DOXXy_U44FFd34gho0LKFUhpM7tRXA-s6FVOSzO7ETX-I5R7at0tV0fz6GJHiaOM6KIGVAxaVxLF2UiSiWYDrzplyNfQAU8TMpmMJ2-kBG8cUdsK4JcDxvOlNj6VtJFetP29aLDwl-rZTCSiVFNwHLQ6a00RMM71nIsdNQL4U4a2icxu7G-7wWDbQgr-77Al0it9HxEa9hi__NM4Gf2CTEWymG5HdYHf2DL-fWsXMUjFETlOCpfnxdWC3yFskFi6B3NagP17-XoAiABV0CBcvlB0L-EnTBGTVMXO9X4zB_cr14etHi-DGkwPupIiHZclVX3xUlQ4eoNckopgAWsGWNUvsWVF2vL3q_m26We9AAFPv2ifqMdDQf0-tfTUMGsTYb0um6pZqMmaXgeFl4V76a9vk-hKxoKdFF_rpZjGrQrQLNB-r6BtRZzfiKeu3H-geiNE4Wld7kKW72nJ7zDDIoERE672vH9BGblHyKtj4cyM30benVPbXflmz-PumD0DkYoP1_uo5WMCs_tI9ku5aJRdoYGdtmX53N2tK0GDDabAR-DtsXUXw2dW3X9_1pZjZyUZXVrLSOULk3YDosYVYoE9OdgzDUEPE9OfnXcR8cw4PEjWv_Lbf5gv2G4ZrfCN_TYPYZ5W7HEhl7JOTV-BubT3hXmGiLtPtRWunXJH04GYfj6CpP2d5ueN8Zn9WxaSmsVJrkGOedbPfTIWlz_vvbNtwyXAYa4XQu4-LBgrRfZgHpduwTyZmZNABb_o_XbC0QHkIJSKVxijPcFEKot4vefTWMtWaxKqg_IGiBPygjhoqsi2KVfwyTPQwHIb6-gYlS17lssPJjCre4y5VDAmrh38kjiyXNPWz7GHt-QElrj2TF4TUlIlR5x_fsbOwxI7CACAHpKE1Xc-q6zziLgQCoxBEgOFmwzCwvQ8nyBwBi3xouZbzylGV2ZhaZXXak9gCuOhi8UJVbll6aqE9rviINrQPASEjFpJl1x47rFu-vYTucdbZqVV=s96-c	1	child	2026-04-30 22:39:53.881346
4	116647930596989192662	kazdova.magdalena@gmail.com	Majda Kazdová	https://lh3.googleusercontent.com/a-/ALV-UjUOPlg2-vpP_-5N7aAMiKRJvJ6awtghVKLtpTyaIF5tylQ0u3puteMF4f4Z0yFxKolNkR5B9NAPMNKYBzuX78c2wZcimRXLUJMLVwz83I9RtGccQ4OsqPnJdT5_lub0miZpfrxbZJ22D7XbpxVPBhBmfwwS7EPRDYOd1-UuMO-I7mdMwnZ4WJE5gzzJoICvaRTmSKSZiTWrFGKn80xrAOeh02UqyoI1ypSWNaqffZSPp-qgJb10eC99i7-vaNW1HQngvNXSMY8cRxlt01iOb9sredJZfXO4-zrSVhB2xDq_9HgYQutq2rp4M420i7FWQzeqaVsuSzGRWJUlI6wkdI0OSYMMtp8fB-aRXHKojBogUoPU7DAj-dY0uYOVxJRvGtTEIc7uynzPimKSxHx0cQqRPKeIyDweYH8fhETDF4c8LS9QgiKcJpMPiHgrIkuxFvAUk1-B2tRbkb45obg3jr6WFh2RXGtE4AOa3Zjtywj0CjAWV-tD-K00QWtmuryBe_VCBl1H8LS4I_ACZmvWufg35jshBN0qin1zWB3L41nFRk041htqyyzbHDEGt-6q5x4Ft8mYPbmOv3HHjIEcJjyHh7yAmFXL9QTz6XZ5_XO2jfYcIELQcfdBr8yWrtGYi9zRN8sGW-1_zObvyPRQOcY4Id7WUuycr7qOW5Z0ayolE04yG-33_g0_vwFWJ_7t9e4z_v282KgLWA9_H4IiishBPTjrNADVPztcBkGRHcn2A4xHwX1g97unJ7yCmCux_VR-5CpdAcIJRdjc3e3wJdn40BeHq_FtEVxWzaWo0FVvfLZiNqSSVJTLLP1rQEINldYz9Xl5ipIPRZUz_HfYI-2vpml2RHmdVoZNYlCtuPDOdTcZIO1aFTjvu3Wrw1NIPBItWrmlKKnF0SCtWY1VspappmBuEhz5-oOj5DUmi3hkLZn8jtgJRQVh8QEZPnbsLmFaXpquBvJIW7Ak1lE35te8kUos-IVJrtoDYv-rNhQzCQsRFSnQ4XyfWF3aIyq2ygUE94d4tNXIkVg03vAIKK5TN9dv8IFFjMzqlNyqHkK0PcLCJbngwCo=s96-c	1	child	2026-05-01 07:36:21.48766
5	109908543834931776404	tomas@kazda.org	Tomáš Kazda	https://lh3.googleusercontent.com/a/ACg8ocJgFDLYzp01mT1xXOQt7iz2XQilNmT0G8scRQtHr47H-TWfufqVIw=s96-c	1	parent	2026-07-12 19:00:31.521112
\.


--
-- TOC entry 3436 (class 0 OID 0)
-- Dependencies: 227
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: app-133
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


--
-- TOC entry 3281 (class 2606 OID 34607)
-- Name: users users_google_id_unique; Type: CONSTRAINT; Schema: public; Owner: app-133
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_unique UNIQUE (google_id);


--
-- TOC entry 3283 (class 2606 OID 34605)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: app-133
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3284 (class 2606 OID 34657)
-- Name: users users_family_id_families_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: app-133
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_family_id_families_id_fk FOREIGN KEY (family_id) REFERENCES public.families(id);


-- Completed on 2026-08-27 16:21:23

--
-- PostgreSQL database dump complete
--

\unrestrict U3Rie6JEcvJnpJkYUhbtnSSnOcZEzPGu4YUikgvwZocd0PBaeHqnLlgqv5J2etf

