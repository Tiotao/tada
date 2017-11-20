# TADA

## Setup

Follow the following steps to setup TADA server. Alternatively, you can run `sh deploy/build.sh` if you already have all the dependency installed and database created and running.

### Step 1: Clone Repo
```
git clone https://github.com/Tiotao/tada.git
```

### Step 2: Install MongoDB and Node

- Install [MongoDB 3.4.9](https://www.mongodb.com/download-center#community)

- Install [Node 8.4.0](https://nodejs.org/download/release/v8.4.0/)


### Step 3: Start database

Keep the following command running all the time
```
$ mongod --dbpath={YOUR_DB_PATH}
```

In another terminal, create a database
```
$ mongo
$ use {YOUR DB NAME}
```

### Step 4: Install dependencies from npm

```
$ npm install
```

### Step 5: Install React and its dependency

```
$ cd react
$ npm install
$ npm run-script build
$ cd ..
```

### Step 6: Create config file

- Create a config file at `config/`. An example is given at `config/config.yml.sample`.


## Development

Using the following command for real-time React development
```
$ cd react
$ webpack --watch
```

## Run Server

```
$ node server.js --env={YOUR_CONFIG_FILE_NAME}
```

## Migrate Data

Make sure your database is running while migrating.

### Import

```
$ sh deploy/backup_db.sh
```

### Export

```
$ sh deploy/import_db.sh

```

