CREATE TABLE definitions(
    phrase TEXT,
    definition TEXT,
    name TEXT,
    UNIQUE (phrase,name)
);
    
