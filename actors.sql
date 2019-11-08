DROP TABLE IF EXISTS actors;

CREATE TABLE actors (
    name VARCHAR(100) NOT NULL,
    age INT,
    num_oscars INT
);

INSERT INTO actors (name, age, num_oscars) VALUES ('Leonardo DiCaprio', 41, 1);
INSERT INTO actors (name, age, num_oscars) VALUES ('Jennifer Lawrence', 25, 1);
INSERT INTO actors (name, age, num_oscars) VALUES ('Samuel L. Jackson', 67, 0);
INSERT INTO actors (name, age, num_oscars) VALUES ('Maryl Streep', 66, 3);
INSERT INTO actors (name, age, num_oscars) VALUES ('John Cho', 43, 0);

SELECT name FROM actors WHERE num_oscars > 1;

SELECT name FROM actors WHERE age > 30;
