-- Etap 5: zaszyfrowane wiadomości użytkowników.
-- Przechowywany jest wyłącznie pakiet szyfrogramu (format v1); treść jawna nie trafia do bazy.
create table messages (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references app_users (id) on delete cascade,
    encrypted_packet text not null,
    created_at timestamptz not null default now(),

    constraint messages_encrypted_packet_not_blank check (length(btrim(encrypted_packet)) > 0)
);

create index idx_messages_owner_created_at
    on messages (owner_id, created_at desc, id desc);

comment on table messages is
    'Zaszyfrowane wiadomości. Przechowywany jest tylko pakiet (nonce+ciphertext+tag), nigdy tekst jawny.';
comment on column messages.encrypted_packet is
    'Pakiet szyfrogramu w formacie v1.<nonce>.<ciphertext+tag> (Base64).';
