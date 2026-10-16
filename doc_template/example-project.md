---
title: Example Project
summary: A placeholder project that shows everything the docs can do. Delete or replace it.
order: 1
links: GitHub | https://github.com/RishilJalisatgi, Live demo | https://example.com
---

This is the intro. Anything above the first `##` heading appears at the top of the page, with no sidebar entry.

## Overview

You can write **bold**, *italic*, ~~strikethrough~~, and [links](https://example.com) normally.

- Bullet lists work
- So do numbered ones:

1. First step
2. Second step

> Block quotes are good for callouts and notes.

## Tools

| Tool | Used for |
| --- | --- |
| Python | Core logic |
| PyTorch | Model training |
| React | Front end |

## Architecture

Images live in `public/docs/<project-name>/` and are referenced from the root:

![System architecture](/docs/example-project/architecture.svg)

To control the size, use an HTML tag instead (any width or alignment works):

<img src="/docs/example-project/architecture.svg" alt="Smaller diagram" width="320" />

### Sub-headings

`###` headings are fine inside a section. They don't get their own sidebar entry, only `##` headings do.

## Code

```python
def predict(x):
    return model(x)
```

## Results

Link straight to this section with `/documentation/example-project#results`.
