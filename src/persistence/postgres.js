const waitPort = require('wait-port');
const fs = require('fs');
const {Client, Pool} = require('pg');
require('dotenv').config();


const {
    PGHOST: HOST,
    PGUSER: USER,
    PGPASSWORD: PASSWORD,
    PGDATABASE: DB,
} = process.env;

let pool;

async function init() {
    pool = new Pool({
		user: USER,
		host: HOST,
		database: DB,
		password: PASSWORD,
		port: 5432,
});

    await pool.connect();
	console.log(`Connected to PostgreSQL at ${HOST}`);

    return new Promise((acc, rej) => {
        pool.query(
            'CREATE TABLE IF NOT EXISTS todo_items (id varchar(36), name varchar(255), completed boolean)',
            err => {
                if (err) return rej(err);

                console.log(`Connected to postgres db at host ${HOST}`);
                acc();
            },
        );
    });
}
	module.exports = {
		init,
};


async function teardown() {
    return new Promise((acc, rej) => {
        pool.end(err => {
            if (err) rej(err);
            else acc();
        });
    });
}

async function getItems() {
    return new Promise((acc, rej) => {
        pool.query('SELECT * FROM todo_items', (err, rows) => {
            if (err) return rej(err);
            acc(
                rows.rows.map(item =>
                    Object.assign({}, item, {
                        completed: item.completed === 1 || item.completed === true,
                    }),
                ),
            );
        });
    });
}

async function getItem(id) {
    return new Promise((acc, rej) => {
        pool.query('SELECT * FROM todo_items WHERE id=$1', [id], (err, rows) => {
            if (err) return rej(err);
            acc(
                rows.rows.map(item =>
                    Object.assign({}, item, {
                        completed: item.completed === 1 || item.completed === true,
                    }),
                )[0],
            );
        });
    });
}

async function storeItem(item) {
    return new Promise((acc, rej) => {
        pool.query(
            'INSERT INTO todo_items (id, name, completed) VALUES ($1, $2, $3)',
            [item.id, item.name, item.completed ? 1 : 0],
            err => {
                if (err) return rej(err);
                acc();
            },
        );
    });
}

async function updateItem(id, item) {
    return new Promise((acc, rej) => {
        pool.query(
            'UPDATE todo_items SET name=$1, completed=$2 WHERE id=$3',
            [item.name, item.completed ? 1 : 0, id],
            err => {
                if (err) return rej(err);
                acc();
            },
        );
    });
}

async function removeItem(id) {
    return new Promise((acc, rej) => {
        pool.query('DELETE FROM todo_items WHERE id = $1', [id], err => {
            if (err) return rej(err);
            acc();
        });
    });
}

module.exports = {
    init,
    teardown,
    getItems,
    getItem,
    storeItem,
    updateItem,
    removeItem,
};
