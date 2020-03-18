# Synthetics command

Run Synthetics tests from your CI.

## Usage

### Setup

You need to either have `DD_API_KEY` and `DD_APP_KEY` in your environment or pass them to the CLI.
```bash
# Environment setup
export DD_API_KEY="<DATADOG_API_KEY>"
export DD_APP_KEY="<DATADOG_APPLICATION_KEY>"

# Passing to CLI
datadog-ci synthetics <command> --apiKey "<DATADOG_API_KEY>" --appKey "<DATADOG_APPLICATION_KEY>"
```

### API

By default it runs at the root of the working directory and finds `{,!(node_modules)/**/}*.synthetics.json` files (every files ending with `.synthetics.json` except those in the `node_modules` folder).

#### Configuration

Configuration is done via a json file, by default the tool load `datadog-ci.json` which can be overriden through the `--config` argument.

The configuration file structure is the following:

```json
{
    "apiKey": "<DATADOG_API_KEY>",
    "appKey": "<DATADOG_APPLICATION_KEY>",
    "datadogHost": "https://app.datadoghq.com/api/v1",
    "files": "{,!(node_modules)/**/}*.synthetics.json",
    "global": {
        "allowInsecureCertificates": true,
        "basicAuth": { "username": "test", "password": "test" },
        "body": "{\"fakeContent\":true}",
        "bodyType": "application/json",
        "cookies": "name1=value1;name2=value2;",
        "deviceIds": ["laptop_large"],
        "followRedirects": true,
        "headers": { "NEW_HEADER": "NEW VALUE" },
        "locations": ["aws:us-east-1"],
        "retry": { "count": 2, "interval": 300 },
        "skip": true,
        "startUrl": "{{URL}}?static_hash={{STATIC_HASH}}",
        "variables": { "titleVariable": "new title" },
    },
    "timeout": 120000,
}
```

Then run:

```bash
datadog-ci synthetics run-tests
```

#### Commands

The available command is:

- `run-tests`: run the tests discovered in the folder according to the `files` configuration key

### Test files

Your test files must be named with a `.synthetics.json` suffix.

```json
// myTest.synthetics.json
{
    "tests": [
        {
            "id": "<TEST_PUBLIC_ID>",
            "config": {
                "allowInsecureCertificates": true,
                "basicAuth": { "username": "test", "password": "test" },
                "body": "{\"fakeContent\":true}",
                "bodyType": "application/json",
                "cookies": "name1=value1;name2=value2;",
                "deviceIds": ["laptop_large"],
                "followRedirects": true,
                "headers": { "NEW_HEADER": "NEW VALUE" },
                "locations": ["aws:us-east-1"],
                "retry": { "count": 2, "interval": 300 },
                "skip": true,
                "startUrl": "{{URL}}?static_hash={{STATIC_HASH}}",
                "variables": { "titleVariable": "new title" },
            }
        }
    ]
}
```

You can configure on which url your test starts by providing a `config.startUrl` to your test object and build your own starting url using any part of your test's original starting url and the following environment variables: 

| Environment variable | Description                  | Example                                                |
|----------------------|------------------------------|--------------------------------------------------------|
| `URL`                | Test's original starting url | `https://www.example.org:81/path/to/something?abc=123` |
| `DOMAIN`             | Test's domain name           | `example.org`                                          |
| `HOST`               | Test's host                  | `www.example.org:81`                                   |
| `HOSTNAME`           | Test's hostname              | `www.example.org`                                      |
| `ORIGIN`             | Test's origin                | `https://www.example.org:81`                           |
| `PARAMS`             | Test's query parameters      | `?abc=123`                                             |
| `PATHNAME`           | Test's URl path              | `/path/to/something`                                   |
| `PORT`               | Test's host port             | `81`                                                   |
| `PROTOCOL`           | Test's protocol              | `https:`                                               |
| `SUBDOMAIN`          | Test's sub domain            | `www`                                                  |

For instance, if your test's starting url is `https://www.example.org:81/path/to/something?abc=123`

It can be written as :

* `{{PROTOCOL}}//{{SUBDOMAIN}}.{{DOMAIN}}:{{PORT}}{{PATHNAME}}{{PARAMS}}`
* `{{PROTOCOL}}//{{HOST}}{{PATHNAME}}{{PARAMS}}`
* `{{URL}}`

and so on...