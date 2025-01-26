# Description

Build a CSV to JSON convertor API. Each row in the CSV file will represent one object and a file
with multiple rows will be converted to a list of objects.
The fields in the csv files will be properties inside the object. A complex property will be named
with a dot (.) separator.
Following properties will mandatorily be available in each record at the beginning.
```
name.firstName, name.lastName, age
```

# Installation

## Clone this project

```
git clone https://github.com/prashant-s-n/kelp-online-assessment.git
```

## Copy the environment variables

Copy the environment variables and fill appropriate values of database connectivity, application ports etc.

```
cd kelp-online-assessment

cp .env.example .env
```

## Install dependencies

```
yarn
```

## Create DB table

```
CREATE DATABASE kelp-interview-round;
```

## Create users table

```
CREATE TABLE public.users (
    id serial4 NOT NULL,
    name varchar NOT NULL,
    age int4 NOT NULL, 
    address jsonb NULL,
    additional_info jsonb NULL
);
```

## Start the application

```
yarn start
```

## Initiate the CSV to JSON process

Open the following URL in the browser or Postman (or any other API testing client)

```
http://localhost:{PORT}/process-csv
```