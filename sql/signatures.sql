DROP TABLE IF EXISTS signatures;


CREATE TABLE signatures (
    id SERIAL primary key,
    first VARCHAR(255) NOT NULL CHECK (first != ''),
    last VARCHAR(255) NOT NULL CHECK (last != ''),
    signature TEXT NOT NULL CHECK (signature != ''),
    created_at TIMESTAMP
);

-- //modify the table: delte first and last; new COl "user_id" (foreign id!) (stored in a cookie!!!)
