# Management API for PCM [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=groupclaes_pcm-api-manage&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=groupclaes_pcm-api-manage) [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=groupclaes_pcm-api-manage&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=groupclaes_pcm-api-manage) [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=groupclaes_pcm-api-manage&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=groupclaes_pcm-api-manage) [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=groupclaes_pcm-api-manage&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=groupclaes_pcm-api-manage) [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=groupclaes_pcm-api-manage&metric=bugs)](https://sonarcloud.io/summary/new_code?id=groupclaes_pcm-api-manage) [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=groupclaes_pcm-api-manage&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=groupclaes_pcm-api-manage)

This api contains all controllers for the management interface available on https://pcm.groupclaes.be/

## Available controllers & routes
- /access-log
  - GET / #retrieve list of access known in DB
- /attributes
  - GET / #retrieve list of access known in DB
- /browse
  - GET /
- /check
  - GET / #get a list of items and datasheet availablility for the provided supplier_id
  - GET /search #query suppliers based on search parameters
  - POST /export #generate export csv based on body send in request
- /directories
  - GET / # list of directories known in DB
  - GET /:id #retrieve details of request directory #id
- /document
  - 
- /languages
  - GET / #retrieve list of languages known in DB
- /profile
  - GET /dashboard #retrieve user's dashboard view; showing items last changed
- /search
  - GET / #execute search query
- /upload
  -
- /users
  - GET / #retrieve list of users known in DB