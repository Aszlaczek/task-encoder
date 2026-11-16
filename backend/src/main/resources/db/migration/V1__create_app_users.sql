-- Etap 2: konta aplikacji.
-- Przechowywany jest wyłącznie hash hasła; kolumna z hasłem jawnym nie istnieje.
create table app_users (
    id uuid primary key default gen_random_uuid(),
    username varchar(50) not null,
    password_hash varchar(100) not null,
    created_at timestamptz not null default now(),

    constraint app_users_username_unique unique (username),
    constraint app_users_username_normalized check (username = lower(btrim(username))),
    constraint app_users_username_format check (username ~ '^[a-z0-9][a-z0-9._-]{2,49}$'),
    constraint app_users_password_hash_not_blank check (length(btrim(password_hash)) > 0)
);

comment on table app_users is
    'Konta aplikacji. Hasła są przechowywane wyłącznie jako hash BCrypt.';
comment on column app_users.username is
    'Znormalizowany login (małe litery); unikalny.';
comment on column app_users.password_hash is
    'Hash BCrypt; nigdy hasło jawne.';
