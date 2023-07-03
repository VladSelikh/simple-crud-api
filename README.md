# simple-crud-api

## Simple CRUD API with NodeJS/TypeScript stack

## Notes

> PORT can be set with .env file PORT param, 4000 is set by default

## Dependencies installation

NodeJS required version is _18 LTS_

```bash
npm install
```

## Building production application

```bash
npm run build
```

## Starting application in different modes

```bash
# Dev mode
npm run start:dev
# Production # after build
npm run start:prod
# Multi instances mode
npm run start:multi
```

## API Tests

```bash
npm run test
```

## Endpoints available

```bash
GET    http://localhost:4000/api/users
GET    http://localhost:4000/api/users/{uuid}
PUT    http://localhost:4000/api/users/{uuid}
DELETE http://localhost:4000/api/users/{uuid}
POST   http://localhost:4000/api/users
```
