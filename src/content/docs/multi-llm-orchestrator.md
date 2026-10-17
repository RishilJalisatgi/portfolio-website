---
title: Multi-LLM Coding Orchestrator
summary: Technical guide to the orchestrator's workflow, setup, configuration, and operation.
order: 3
links: GitHub | https://github.com/RishilJalisatgiv/multi-llm-coding-orchestrator
---

> **Purpose:** A resource-aware software-development orchestrator that accepts a natural-language requirement, decides whether one model is sufficient or whether a competitive multi-model workflow is justified, benchmarks candidate coding models on a reduced task, then coordinates architecture, implementation, evaluation, review, and revision.

**Documentation scope:** This guide describes the project represented by this [repository](https://github.com/RishilJalisatgi/multi-llm-coding-orchestrator). Configuration and implementation details may change as the project evolves.
---
## Contents

1.  [Project Overview](#1-project-overview)
2.  [Goals and Design Principles](#2-goals-and-design-principles)
3.  [Key Concepts](#3-key-concepts)
4.  [End-to-End Workflow](#4-end-to-end-workflow)
5.  [Architecture](#5-architecture)
6.  [Repository Layout](#6-repository-layout)
7.  [Requirements and Installation](#7-requirements-and-installation)
8.  [Configuration](#8-configuration)
9.  [Environment Variables and Credentials](#9-environment-variables-and-credentials)
10. [Command-Line Interface](#10-command-line-interface)
11. [Model Providers and Adapters](#11-model-providers-and-adapters)
12. [Task Analysis and Routing](#12-task-analysis-and-routing)
13. [Competitive Lite Benchmark](#13-competitive-lite-benchmark)
14. [Architecture and Implementation](#14-architecture-and-implementation)
15. [Evaluation and Scoring](#15-evaluation-and-scoring)
16. [Review, Revision, and Escalation](#16-review-revision-and-escalation)
17. [Resource and Quota Management](#17-resource-and-quota-management)
18. [Persistence, Resume, and Project Artifacts](#18-persistence-resume-and-project-artifacts)
19. [Logging and Decision Traceability](#19-logging-and-decision-traceability)
20. [Execution Safety](#20-execution-safety)
21. [Testing and Validation](#21-testing-and-validation)
22. [Operational Runbooks](#22-operational-runbooks)
23. [Troubleshooting](#23-troubleshooting)
24. [Security and Privacy Considerations](#24-security-and-privacy-considerations)
25. [Known Limitations and Current Status](#25-known-limitations-and-current-status)
26. [Glossary](#26-glossary)
---
## 1. Project Overview

The Multi-LLM Coding Orchestrator is a Python command-line application for coordinating AI systems that help build software. Instead of sending every request to several models, it first analyzes the task and selects a workflow appropriate to the task's complexity, available models, quotas, and expected value of comparison.

The central idea is **competitive, resource-aware model selection**:

1.  Interpret a user's software requirement.
2.  Estimate task type, complexity, scope, and technical needs.
3.  Decide whether direct single-model execution is adequate or a multi-model process is worth its cost.
4.  For orchestrated tasks, ask a small set of eligible candidate models to implement a deliberately reduced but representative version of the task.
5.  Evaluate candidate outputs with reproducible checks and scoring.
6.  Select a coding model and, where possible, a separate reviewer.
7.  Produce a high-level design (HLD), implement the full project in batches, and evaluate/review the result.
8.  Revise within bounded iteration limits, retain useful checkpoints, and report completion or the remaining blockers.

The system is designed to avoid unnecessary model calls. A straightforward utility can use one model; a complicated project can justify the cost of benchmarking and independent review. Previous benchmark results may also be used to reduce repeated evaluation work when they are sufficiently relevant.

### What it is, and is not

-   **It is** an orchestration layer around coding-capable model providers, evaluators, project state, and resource policies.
-   **It is** intended to make model selection evidence-informed rather than based solely on a fixed preference or a model's reputation.
-   **It is not** itself a foundation model or a guarantee that generated software is correct.
-   **It is not** a replacement for human review, threat modeling, integration testing, or production release controls.
-   **It does not automatically run every generated program.** Automatic execution is intentionally restricted.
-   **It does not make a ChatGPT subscription equivalent to API access.** CLI subscription adapters, provider APIs, and local models have different authentication, availability, and terms.
---
## 2. Goals and Design Principles

### 2.1 Primary goals

-   **Adaptive orchestration:** use one model for simple tasks and multiple models only when justified.
-   **Evidence-based selection:** compare candidate implementations using tests, static analysis, execution observations where safe, and resource metrics.
-   **Role separation:** distinguish architecture planning, implementation, review, and optional judging.
-   **Quota awareness:** account for provider limits and cooldowns; avoid spending the entire available budget during the benchmark.
-   **Resumability:** persist stage progress so a paused or interrupted run can continue.
-   **Bounded iteration:** limit revision cycles to reduce runaway costs and endless review loops.
-   **Auditability:** retain project artifacts and structured decision logs explaining what happened.
-   **Graceful degradation:** when a provider is unavailable or quota-limited, seek an eligible fallback or pause instead of repeatedly making futile calls.

### 2.2 Design principles

1.  **Measure before selecting, where measurement is worth the cost.** Candidate benchmark performance should be relevant to the actual task, not treated as a universal model ranking.
2.  **Reserve budget for the entire lifecycle.** Benchmarking is useful only if enough capacity remains for architecture, implementation, and review.
3.  **Prefer objective checks over self-reported confidence.** Tests and static checks are more actionable than a model merely claiming that its code is correct.
4.  **Keep soft judgments separate from hard gates.** An optional LLM judge can help compare qualitative attributes, but should not override failed critical tests or security checks.
5.  **Persist important transitions.** A process interruption should not require the user to restart an expensive project from the beginning.
6.  **Limit execution privileges.** Generated code is untrusted input and should not receive unrestricted access to the host.
7.  **Make failure visible.** The final report should disclose skipped checks, unavailable providers, incomplete stages, and unresolved issues.

### 2.3 Non-goals for the current version

The current project does not require a vector database, a full autonomous-agent framework, or MCP simply to perform its core workflow. Those technologies are not required by the core workflow. Repository indexing and context selection already have dedicated modules; these are not, by themselves, evidence that a vector database is necessary.
---
## 3. Key Concepts

| Term | Meaning |
|---|---|
| Requirement | The natural-language description supplied by the user. |
| Task analysis | An estimate of the task's category, complexity, size, and technical demands. |
| Direct mode | A single-model path without competitive benchmarking or a second reviewer. |
| Orchestrated mode | A multi-stage path that benchmarks candidates and uses an independent reviewer when available. |
| Lite task / lite specification | A smaller task designed to preserve the important technical characteristics of the full request while being cheaper to implement and evaluate. |
| Candidate | A model/provider combination eligible to participate in the benchmark. |
| Benchmark | The process of generating candidate solutions and comparing their evaluated results. |
| HLD | High-level design: system structure, components, interfaces, data flow, and implementation plan. |
| Coder | The model selected to implement the project. |
| Reviewer | A model or agent asked to inspect implementation quality and identify problems independently. |
| Judge | An optional model-based evaluator for qualitative or otherwise soft scoring dimensions. |
| Hard gate | A condition that must pass, such as a required test or critical safety check. |
| Soft metric | A qualitative score such as readability or architectural clarity. |
| Quota window | A provider-defined interval in which usage is limited or budgeted. |
| Checkpoint | Persisted project state/artifacts used to resume a workflow. |
| Escalation | A bounded attempt to use a different strategy or model when a blocker persists. |
| Cooldown | A wait period before a rate-limited or quota-limited model should be tried again. |
---
## 4. End-to-End Workflow

The orchestrator's conceptual workflow is shown below.

``` mermaid
flowchart TD
    A[User requirement] --> B[Load configuration and usable models]
    B --> C[Analyze task and estimate complexity]
    C --> D{Direct or orchestrated?}
    D -->|Direct| E[Choose one suitable model]
    D -->|Orchestrated| F[Build lite specification]
    F --> G[Select eligible benchmark candidates]
    G --> H[Generate candidate implementations]
    H --> I[Run evaluation and calculate scores]
    I --> J[Select coder and independent reviewer]
    E --> K[Architecture / implementation path]
    J --> K
    K --> L[Create HLD]
    L --> M[Implement in batches]
    M --> N[Evaluate implementation]
    N --> O[Independent review]
    O --> P{Acceptable?}
    P -->|Yes| Q[Finalize report and artifacts]
    P -->|No, iterations remain| R[Revise and re-evaluate]
    R --> N
    P -->|Blocker persists| S[Bounded escalation or needs-attention]
    S --> Q
```

The diagram is a high-level representation. Exact stage ordering and branch behavior are governed by `core/orchestrator.py`, `core/scheduler.py`, `core/resource_manager.py`, and the configuration.

### Stage 1 --- Intake and setup

-   Accept a requirement as command-line text or read it from a file.
-   Load the configuration and provider settings.
-   Discover which model adapters are currently usable.
-   Fail early with a setup error if no usable model exists.

### Stage 2 --- Task analysis and route selection

The task analyzer estimates properties such as task type, complexity, and scope. The orchestrator uses this analysis to decide whether competitive evaluation is worth the added latency and usage.

-   **Direct path:** appropriate for a small, well-bounded task or when orchestration is not worthwhile.
-   **Orchestrated path:** appropriate when the task is complex or uncertain enough that comparing candidate implementations could materially improve the result.
-   **Forced mode:** command-line flags can override the automatic choice for experimentation or debugging.

### Stage 3 --- Lite benchmark (orchestrated path)

A reduced task is derived from the requirement. Candidate models implement it, and the evaluation system compares the results. The goal is to measure performance on a task that is cheaper than the full project but still representative of the core technical challenge.

Candidate selection is constrained by availability and resource policy. The configured default maximum is three candidates, but it is configurable.

### Stage 4 --- Select roles

The system selects a coder based on benchmark evidence and model eligibility. It also seeks an independent reviewer when the workflow and available models permit it. A model may be unavailable due to credentials, disabled configuration, quota/cooldown, or adapter failure.

### Stage 5 --- HLD

The HLD agent produces an architecture/design artifact to guide implementation. It should establish component boundaries, responsibilities, interfaces, data flow, and implementation sequencing before large-scale coding begins.

### Stage 6 --- Implementation

The coder implements the project according to the requirement and HLD. Large work may be split into batches to keep individual model calls and context sizes manageable. Repository context helpers can identify relevant existing files and code.

### Stage 7 --- Evaluation and review

The implementation is checked using available tests, static analysis, and safe runtime checks. An independent reviewer examines issues that automated checks may miss. The optional judge can adjust soft metrics, but should not be considered a substitute for hard verification.

### Stage 8 --- Revision

If problems remain, the system may request a revision and repeat evaluation/review. The default configuration permits at most three review iterations. A revision that degrades the result may be rolled back. A persistent blocker may trigger a bounded escalation; if it remains unresolved, the project should finish as needing attention rather than falsely claiming success.

### Stage 9 --- Finalization

The project artifacts, checkpoints, logs, and final report are stored under the project directory. The result status is translated to a CLI exit code.
---
## 5. Architecture

The project is organized into modules with relatively distinct responsibilities.

``` mermaid
flowchart LR
    CLI[main.py] --> ORCH[core/orchestrator.py]
    ORCH --> ANALYZER[core/task_analyzer.py]
    ORCH --> SCHED[core/scheduler.py]
    ORCH --> RESOURCE[core/resource_manager.py]
    ORCH --> STATE[core/state_manager.py]
    ORCH --> MODELS[models adapters]
    ORCH --> AGENTS[agents]
    ORCH --> CONTEXT[context tools]
    ORCH --> EVAL[evaluation]
    ORCH --> STORE[core/benchmark_store.py]
    ORCH --> LOG[core/logger.py]
    MODELS --> API[Provider APIs / CLIs / local runtime]
    EVAL --> CHECKS[Tests, static checks, safe runtime checks]
    STATE --> PROJECTS[projects/<project-id>/]
    STORE --> DB[(data/benchmarks.db)]
    LOG --> LOGFILES[data/logs/]
```

### 5.1 `main.py` --- CLI boundary

Responsibilities include argument parsing, configuration loading, logging setup, account-management commands, progress output, invoking the orchestrator, printing the final summary, and returning the documented exit code.

### 5.2 `core/orchestrator.py` --- workflow coordinator

This is the central coordinator. It connects task analysis, model selection, benchmark execution, architecture, coding, evaluation, review, persistence, and final status reporting. Workflow order and stage transitions are coordinated here.

### 5.3 `core/task_analyzer.py` --- task characterization

Analyzes the requirement to support routing and planning. The analyzer's output is a decision aid rather than a guarantee that the estimated complexity is correct. Poor task classification can lead to over-orchestration or under-orchestration.

### 5.4 `core/scheduler.py` --- stage and model scheduling

Coordinates which work should run and when. Scheduling decisions must account for role suitability, availability, resource constraints, and the current workflow stage.

### 5.5 `core/resource_manager.py` --- budgets and availability

Tracks usage constraints and provider availability, including configured budgets, quota windows, and cooldowns. Its role is to avoid selecting a model that cannot reasonably complete the remaining work and to preserve resources for later stages.

### 5.6 `core/state_manager.py` --- persistent project state

Stores project metadata and stage progress. It supports listing projects and resuming paused, failed, or interrupted runs. The state manager stores project metadata and stage progress; saved state is used when resuming runs.

### 5.7 `core/benchmark_store.py` --- historical benchmark records

Persists benchmark data in SQLite (`data/benchmarks.db`). Historical results can reduce repeat benchmark cost when they are sufficiently applicable. A benchmark result should be interpreted in context: model version, provider, task characteristics, scoring version, and evaluation environment can all affect comparability.

### 5.8 `models/` --- provider adapters

Implements a common model interface and adapters for API providers, local inference, and command-line subscription tools. The adapter layer should normalize provider differences into a predictable interface for the rest of the application.

### 5.9 `agents/` --- specialized roles

-   `agents/hld.py`: architecture and design generation.
-   `agents/coder.py`: implementation and code changes.
-   `agents/reviewer.py`: independent review and revision feedback.
-   `agents/judge.py`: optional qualitative scoring or judgment.

These are workflow roles, not necessarily separate model families. Different roles may use the same underlying model if resource constraints require it, though independent review is stronger when the reviewer is genuinely independent.

### 5.10 `evaluation/` --- candidate and project verification

Contains the evaluator and supporting modules for test execution, static analysis, runtime observations, and scoring. Evaluation results should retain both the aggregate score and the underlying evidence so failures remain explainable.

### 5.11 `context/` --- repository understanding

-   `indexer.py`: builds searchable/indexed representations of repository content.
-   `repository.py`: repository-level file and context operations.
-   `selector.py`: selects relevant context for a particular task or model call.

Context selection reduces irrelevant prompt content and helps manage context-window costs. Indexing is not proof that every relevant file has been found; critical interfaces and project configuration still need verification.

### 5.12 `config/` --- settings

`settings.py` loads and validates settings, including model configuration and overrides from `config/config.json`. Model names and capability values in configuration are operational inputs, not independently verified performance claims.
---
## 6. Repository Layout

The supplied archive contains the following principal structure:

``` text
orchestrator/
├── main.py
├── README.md
├── requirements.txt
├── env.example
├── config/
│   ├── config.json
│   └── settings.py
├── core/
│   ├── orchestrator.py
│   ├── task_analyzer.py
│   ├── scheduler.py
│   ├── resource_manager.py
│   ├── state_manager.py
│   ├── benchmark_store.py
│   └── logger.py
├── models/
│   ├── base.py
│   ├── openai.py
│   ├── claude.py
│   ├── gemini.py
│   ├── local.py
│   ├── cli_common.py
│   ├── claude_cli.py
│   └── codex_cli.py
├── agents/
│   ├── hld.py
│   ├── coder.py
│   ├── reviewer.py
│   └── judge.py
├── context/
│   ├── indexer.py
│   ├── repository.py
│   └── selector.py
├── evaluation/
│   ├── evaluator.py
│   ├── tests.py
│   ├── static_analysis.py
│   ├── runtime.py
│   └── scoring.py
├── data/
│   ├── benchmarks.db
│   ├── logs/
│   └── state/
└── projects/
    └── <project-id>/
        ├── task_spec.json
        ├── architecture.md
        ├── benchmark/
        ├── implementation/
        ├── reviews/
        ├── checkpoints/
        ├── state.json
        └── final_report.md
```

The exact files present under a project depend on which stages ran and whether the workflow completed. The archive also contains Python bytecode caches (`__pycache__`) and a sample project with benchmark and revision artifacts. Bytecode caches are generated files and should not be treated as the source of truth.
---
## 7. Requirements and Installation

### 7.1 Runtime

The README and requirements file state Python 3.10 or newer. The orchestrator's core is designed to use the Python standard library. Provider SDKs and evaluation tools are optional and should be installed only if the corresponding integrations are used.

### 7.2 Create an isolated environment

From the extracted project directory:

``` bash
python -m venv .venv
```

Activate it:

**Windows PowerShell**

``` powershell
.\.venv\Scripts\Activate.ps1
```

**Windows Command Prompt**

``` bat
.venv\Scripts\activate.bat
```

**Linux/macOS**

``` bash
source .venv/bin/activate
```

Then install dependencies:

``` bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

The listed dependencies include provider SDKs for Anthropic, OpenAI-compatible endpoints, and Google GenAI, plus optional tools such as `pytest`, `ruff`, `mypy`, and `bandit`. Installing all provider SDKs is not mandatory if only a subset of providers will be used.

### 7.3 Configure environment

Create a local `.env` from the example if the project setup expects one:

``` bash
# Linux/macOS
cp env.example .env
```

``` powershell
# Windows PowerShell
Copy-Item env.example .env
```

Inspect the example file and `config/settings.py` to confirm the exact supported variable names. Add credentials only for the providers you intend to use. Never commit `.env` or real API keys.

### 7.4 Configure at least one model

Review `config/config.json` and `config/settings.py`. Enable and configure at least one provider that is actually available to you. The archive's defaults include disabled entries and placeholder model names; they are not guaranteed to work without changes.

### 7.5 Verify the installation

``` bash
python main.py --help
python main.py --models
python -m config.settings
```

The `--models` output should identify usable models and explain why configured models were skipped. Resolve those reasons before attempting a large project.

### 7.6 Optional local model

For the Ollama adapter, install Ollama separately, download a model that your machine can run, and start the Ollama service. The README gives this example:

``` bash
ollama pull qwen2.5-coder
ollama serve
```

Use a model name that matches the installed local model and the adapter's expectations. Hardware capacity, memory, model size, and inference speed determine whether a local model is suitable.
---
## 8. Configuration

Configuration has two related layers:

-   `config/config.json` contains user-overridable settings.
-   `config/settings.py` defines loading, defaults, validation, and the supported configuration behavior.

Prefer editing the JSON configuration for ordinary project-specific changes rather than hard-coding values into orchestration modules.

### 8.1 Orchestrator settings

The supplied configuration contains:

| Setting | Snapshot value | Meaning |
|---|---:|---|
| `max_review_iterations` | `3` | Maximum review/revision cycles before stopping or escalating. |
| `max_benchmark_candidates` | `3` | Upper bound for the number of candidate models considered in a benchmark. |
| `log_level` | `INFO` | Default logging verbosity. The CLI can override it. |

These are snapshot values; inspect the implementation before assuming every setting affects every workflow path.

### 8.2 Model entries

Each model entry typically identifies a logical model ID and provider/model name, and may include fields such as:

| Field | Purpose |
|---|---|
| `id` | Stable identifier used inside the orchestrator. |
| `provider` | Adapter family, when explicitly specified. |
| `model_name` | Provider-side model identifier or local model name. |
| `enabled` | Explicitly enables or disables an entry where supported. |
| `api_key_env` | Environment variable containing the provider key. |
| `base_url` | Custom OpenAI-compatible endpoint, useful for compatible gateways. |
| `capabilities` | Configured estimates for coding, HLD, and review suitability. |
| `token_budget_per_window` | Configured budget for a quota window. |
| `window_seconds` | Duration of that quota window in seconds. |
| `requests_per_minute` | Configured request-rate ceiling, if supported by the adapter/resource manager. |
| `max_output_tokens` | Requested/allowed output limit for a model call. |
| `cost_per_1k_input` | Estimated cost per 1,000 input tokens, where applicable. |
| `cost_per_1k_output` | Estimated cost per 1,000 output tokens, where applicable. |

Not every field is required for every provider. The settings loader determines accepted fields and defaults. Capability scores and cost values are estimates supplied by configuration; they should be tuned from observed results and verified pricing rather than treated as facts about model quality.

### 8.3 Example model entry

``` json
{
  "id": "example-coder",
  "provider": "openai",
  "model_name": "provider-model-id",
  "api_key_env": "EXAMPLE_API_KEY",
  "capabilities": {
    "coding": 8.0,
    "hld": 7.5,
    "review": 7.0
  },
  "token_budget_per_window": 50000,
  "window_seconds": 3600,
  "max_output_tokens": 8000
}
```

This is an illustrative template, not a claim that a provider recognizes `provider-model-id`. Use the provider's current documented model identifier and the adapter name supported by this codebase.
---
## 9. Environment Variables and Credentials

The exact variables supported by the supplied snapshot are defined in `config/settings.py`, provider adapters, and `env.example`. Inspect those files before copying variable names from external examples.

### API-key authentication

For API providers, credentials normally come from environment variables. For a compatible gateway, the configured base URL and key variable must correspond to that gateway.

Example shell setup (replace the value locally; do not paste a real secret into documentation or source control):

``` bash
export GROQ_API_KEY="replace-with-your-key"
```

PowerShell:

``` powershell
$env:GROQ_API_KEY = "replace-with-your-key"
```

Environment-variable assignments made in a terminal generally apply only to that shell session unless persisted through your operating system's environment settings or a local environment-loading mechanism.

### Subscription CLI authentication

The CLI supports account commands for the Claude and Codex command-line integrations:

``` bash
python main.py --accounts
python main.py --login claude
python main.py --login codex
python main.py --logout claude
python main.py --logout all
python main.py --switch claude
```

For headless or SSH environments, the CLI provides `--device-auth` with supported login/switch commands:

``` bash
python main.py --login codex --device-auth
```

These commands rely on the relevant CLI being installed and on its own authentication mechanism. They do not convert a subscription into a general-purpose API key. Confirm the provider's terms, rate limits, and permitted automation use before relying on a subscription CLI for orchestration.
---
## 10. Command-Line Interface

Run commands from the extracted `orchestrator/` directory.

### 10.1 Build a project

``` bash
python main.py "Build a desktop app that monitors my downloads and categorizes them"
```

The orchestrator analyzes the requirement and chooses a route automatically.

### 10.2 Read a requirement from a file

``` bash
python main.py --file requirement.txt
```

The file is read as UTF-8 text. Keep the requirement focused and include acceptance criteria, expected interfaces, constraints, and test expectations where possible.

### 10.3 Force direct mode

``` bash
python main.py --direct "Write a script that renames files to lowercase"
```

This bypasses the competitive benchmark and second-reviewer workflow. Use it for small tasks, quick experiments, or comparisons against the orchestrated path.

### 10.4 Force orchestrated mode

``` bash
python main.py --orchestrate "Build a multi-module Python package with tests and documentation"
```

This forces the benchmark/reviewer path even if automatic analysis might choose direct mode. It is useful for experiments, but can spend more tokens and time.

### 10.5 List previous projects

``` bash
python main.py --list
```

Lists known projects and their statuses.

### 10.6 Resume a project

``` bash
python main.py --resume <project_id>
```

Replace `<project_id>` with an exact ID printed by `--list` or found in the project directory. Resume is intended for paused, failed, or interrupted workflows; the state manager and orchestrator determine which stage is next.

### 10.7 Inspect model availability

``` bash
python main.py --models
```

Shows usable model IDs and skipped models with reasons. This is the first diagnostic step when a run fails before generation.

### 10.8 Use an alternate configuration

``` bash
python main.py --config config/test-config.json "Build a small CLI"
```

The supplied path must exist and conform to the settings schema.

### 10.9 Project ID, waiting, judge, logging

``` bash
python main.py --project-id my-project "Build a small Python package"
python main.py --no-wait "Build a small Python package"
python main.py --no-judge "Build a small Python package"
python main.py --log-level INFO "Build a small Python package"
python main.py --quiet "Build a small Python package"
```

-   `--project-id`: chooses a project folder ID for a new run.
-   `--no-wait`: pauses instead of sleeping while waiting for quota reset.
-   `--no-judge`: disables the optional LLM judge.
-   `--log-level`: overrides logging verbosity (`DEBUG`, `INFO`, `WARNING`, or `ERROR`).
-   `--quiet`: suppresses progress lines; it does not mean that logs or project artifacts are disabled.

### 10.10 Exit codes

| Code | Meaning | Typical action |
|---:|---|---|
| `0` | Completed | Inspect the final report and run project tests yourself. |
| `1` | Failed or needs attention | Read the final report, state, review notes, and logs. |
| `2` | Paused/interrupted | Resume the project after addressing the pause reason. |
| `3` | Usage or setup error | Check CLI arguments, settings, model availability, credentials, and paths. |

A zero exit code means the orchestrator reports completion; it does not guarantee production readiness.
---
## 11. Model Providers and Adapters

The `models/` package separates provider-specific request/response behavior from workflow logic.

### 11.1 Common interface

`models/base.py` provides shared abstractions used by adapters. The intent is to let agents request model completions without needing to know each provider's SDK or response format.

When adding a provider, implement the common interface and ensure that the adapter handles:

-   Authentication and missing credentials.
-   Model-name validation where feasible.
-   Prompt and response conversion.
-   Output limits.
-   Timeouts and provider errors.
-   Rate-limit and quota signals.
-   Empty, malformed, or truncated responses.
-   Usage metadata when the provider returns it.
-   Clear diagnostics without logging secrets.

### 11.2 Provider modules in this snapshot

| Module | Role |
|---|---|
| `models/openai.py` | OpenAI-compatible API adapter; may also support configured compatible endpoints. |
| `models/claude.py` | Anthropic API adapter. |
| `models/gemini.py` | Google GenAI adapter. |
| `models/local.py` | Local model integration, documented around Ollama. |
| `models/claude_cli.py` | Claude subscription CLI integration. |
| `models/codex_cli.py` | Codex subscription CLI integration. |
| `models/cli_common.py` | Shared CLI authentication and process helpers. |
| `models/__init__.py` | Registry/factory logic and adapter availability handling. |

Actual availability depends on configuration, installed SDKs/CLIs, authentication, provider access, and network/service state. `--models` is the practical runtime check.

### 11.3 OpenAI-compatible endpoints

A gateway such as a hosted inference service may expose an OpenAI-compatible API. In that case, configure the adapter, model name, base URL, API-key environment variable, budgets, and rate limits consistently. Compatibility is not universal: tool calling, response fields, reasoning modes, streaming, and usage reporting can differ by provider.

### 11.4 Local inference

Local models can reduce external API use and may improve privacy, but they consume local compute and memory and may be weaker or slower than hosted alternatives. The orchestrator should not assume that local inference is unlimited or free of operational cost.

### 11.5 Adapter validation

The repository README states that the project has been tested with scripted fake models against real orchestration components, while provider adapters had not yet been validated against live APIs in the supplied snapshot. Treat real-provider behavior as requiring smoke tests before a long run.
---
## 12. Task Analysis and Routing

The task analyzer supports the choice between direct and orchestrated execution.

### 12.1 Why routing matters

Benchmarking and independent review introduce additional model calls, wall-clock time, and potential cost. If a task is trivial, this overhead may exceed the value of comparing models. Conversely, a complex project may benefit from competitive evaluation, architecture planning, and independent review.

### 12.2 Routing factors

Relevant factors for routing include:

-   Number of modules and components.
-   Number and complexity of requirements.
-   Need for integration across libraries or services.
-   Ambiguity and uncertainty.
-   Data modeling and architectural choices.
-   Security or reliability implications.
-   Need for tests, packaging, deployment, or documentation.
-   Available models and their role capabilities.
-   Remaining token/request budget and quota reset time.
-   Availability of useful historical benchmark results.

The exact scoring/routing formula is implementation-defined; do not assume the list above is a literal formula.

### 12.3 When to force a route

Use `--direct` when evaluating the minimum viable path, testing a single provider, or requesting a small bounded artifact. Use `--orchestrate` when deliberately testing candidate comparison, reviewer behavior, or the multi-stage lifecycle.

For reproducible comparisons, keep the requirement, configuration, candidate set, evaluation tools, and scoring version fixed. Otherwise, differences may reflect the experiment setup rather than model quality.

### 12.4 Good requirement writing

A useful requirement should state:

-   The problem and intended users.
-   Required features and explicit non-goals.
-   Runtime, language, framework, and operating-system constraints.
-   Inputs, outputs, file formats, and API contracts.
-   Acceptance criteria and edge cases.
-   Security, privacy, and performance requirements.
-   How the project should be tested and run.
-   Any budget or latency constraints.

Avoid putting secrets, personal data, production credentials, or confidential source material into prompts unless the provider and environment are approved for that data.
---
## 13. Competitive Lite Benchmark

The lite benchmark is the distinctive selection stage in the orchestrated workflow.

### 13.1 Purpose

The full project may be too large or expensive to ask every candidate model to build. Instead, the orchestrator uses a smaller task that preserves the central technical challenge. Each candidate's output is then evaluated using the same or equivalent criteria.

For example, if the full requirement is a multi-module Python library, the lite task might implement one representative API and its edge cases, include a few tests, and demonstrate the project's core design constraints. It should not be so small that it tests only syntax, nor so large that it costs nearly as much as the full project.

### 13.2 Benchmark lifecycle

1.  Generate or load a lite specification.
2.  Select eligible candidates, respecting configured candidate limits and resource availability.
3.  Ask each candidate to implement the specification in an isolated candidate directory.
4.  Record candidate metadata and artifacts.
5.  Run applicable tests and static checks.
6.  Gather safe runtime/resource measurements when eligible.
7.  Calculate a score and preserve detailed evaluation evidence.
8.  Compare candidates and select a model for the full coding stage.
9.  Store the benchmark so relevant future tasks may reuse it.

### 13.3 Evaluation dimensions

Depending on available tools and the task, candidate evaluation can include:

-   Correctness and acceptance-test pass rate.
-   Test quality and edge-case handling.
-   Static-analysis findings.
-   Runtime success and execution output.
-   Runtime duration and memory use when measured.
-   Code structure, maintainability, and readability.
-   Architecture fit and interface quality.
-   Security-related findings.
-   Documentation completeness.

Not every dimension can be measured reliably for every language or project type. Missing measurements should be marked unavailable rather than silently interpreted as perfect.

### 13.4 Fairness and validity

A benchmark is only useful when candidates receive equivalent requirements, comparable context, and the same evaluation criteria. Potential sources of bias include:

-   Different prompt lengths or hidden context.
-   Different output budgets or timeouts.
-   Different dependency availability.
-   Nondeterministic tests or network access.
-   Different static-analysis tools or versions.
-   A candidate that was given extra hints.
-   Scoring weights that favor one programming style.
-   Reusing a benchmark whose model version or environment changed.

The benchmark should be treated as task-specific evidence, not a permanent global leaderboard.

### 13.5 Historical benchmark reuse

Historical results may save calls, but should only be reused when relevant. A sensible match should consider the task category, language, technical profile, model/version, scoring version, and age of the result. If no suitably relevant result exists, run a fresh benchmark.

### 13.6 Candidate count and costs

The snapshot sets `max_benchmark_candidates` to three. More candidates may increase the chance of finding a strong implementation, but also increase latency and token consumption. Start small and expand only when observed quality improvements justify the cost.
---
## 14. Architecture and Implementation

### 14.1 HLD artifact

The architecture agent produces an `architecture.md` file describing the intended design. A useful HLD should specify:

-   System overview and design rationale.
-   Components, responsibilities, and dependencies.
-   Public interfaces and data contracts.
-   Persistence and error-handling strategy.
-   Security boundaries.
-   Testing strategy.
-   Implementation order and acceptance criteria.
-   Important trade-offs and assumptions.

A generated HLD is a plan, not proof that the implementation follows it. Review the HLD before implementation for contradictions, missing requirements, unjustified complexity, and infeasible dependencies.

### 14.2 Coding in batches

The coder implements the project in bounded units. Batching reduces prompt size and makes it easier to target specific files or features. It also creates risks: later batches may conflict with earlier interfaces, so integration tests and repository context are important.

### 14.3 Repository context

The context package helps select relevant files for each task. For reliable results, keep project instructions and public interfaces explicit. If the codebase has important conventions, document them in stable project-level instructions rather than relying on the model to infer them from scattered files.

### 14.4 Implementation output

The main implementation is written to:

``` text
projects/<project-id>/implementation/
```

The generated project should contain its own run instructions and tests where appropriate. The orchestrator's final report and architecture/review artifacts are stored alongside the implementation rather than mixed into the generated source package.
---
## 15. Evaluation and Scoring

The `evaluation/` package is responsible for gathering evidence about generated code and turning it into a result usable by the orchestrator.

### 15.1 Evaluation components

| Module | Responsibility |
|---|---|
| `evaluation/evaluator.py` | Coordinates applicable checks and assembles evaluation results. |
| `evaluation/tests.py` | Runs tests where supported and records outcomes. |
| `evaluation/static_analysis.py` | Invokes available static-analysis tools and parses findings. |
| `evaluation/runtime.py` | Performs limited runtime checks and gathers runtime/resource observations where safe. |
| `evaluation/scoring.py` | Converts evaluation evidence into comparative scores. |

### 15.2 Hard and soft signals

A robust decision should distinguish hard requirements from preferences.

**Hard signals** may include required tests, successful imports/builds, critical static checks, or required outputs. A failed hard requirement should not be hidden by a high readability score.

**Soft signals** may include architecture quality, maintainability, clarity, and completeness. These can help break ties or rank otherwise acceptable candidates, but their subjectivity should be documented.

### 15.3 Interpreting scores

A score is a decision aid, not an objective measurement of overall software quality. Always inspect the detailed evidence and consider whether the checks are appropriate for the language and task. A score can be misleading when tests are weak, dependencies are missing, static tools do not support the project, or important runtime paths are not exercised.

### 15.4 Optional LLM judge

The judge can add qualitative assessment to the evaluation. Its role should remain limited: it may help compare architecture or code quality, but it should not erase concrete test failures or critical security findings. The CLI flag `--no-judge` disables this stage.

### 15.5 External verification remains necessary

Before shipping generated code:

-   Run tests in the intended target environment.
-   Review dependency versions and licenses.
-   Perform security review for sensitive applications.
-   Check concurrency, migrations, and failure recovery where relevant.
-   Test deployment and rollback procedures.
-   Verify requirements against actual behavior, not only generated documentation.
---
## 16. Review, Revision, and Escalation

### 16.1 Independent review

The reviewer inspects the implementation for defects, missed requirements, architectural problems, security risks, and maintainability issues. Review is most valuable when it is not merely repeating the coder's own claims. When possible, use a separate model or a fresh context.

### 16.2 Revision loop

The configured maximum is three review iterations. The general loop is:

1.  Evaluate the current implementation.
2.  Gather review findings.
3.  Convert actionable findings into a bounded revision request.
4.  Apply the revision.
5.  Re-run evaluation.
6.  Compare the revised result with the prior checkpoint.
7.  Keep the revision if it improves the result; otherwise restore the previous known-good state when rollback is supported.
8.  Stop when accepted, the iteration limit is reached, or escalation policy decides the blocker needs a different approach.

### 16.3 Preventing regressions

Revision prompts should distinguish mandatory fixes from optional refactoring. The system should avoid asking a model to rewrite the entire codebase when a narrow patch can address the issue. Each revision should be checked against both the original acceptance criteria and previously passing tests.

### 16.4 Escalation

If a blocking problem persists, a bounded escalation may switch model or strategy. Escalation should not become an unbounded chain of retries. If the blocker remains, the final status should explain it and identify the evidence needed to resolve it.
---
## 17. Resource and Quota Management

Resource awareness is a core design requirement because providers can enforce rate limits, usage caps, or time-window quotas.

### 17.1 What is managed

The resource manager uses configured budgets and provider information to guide selection and scheduling. Depending on the adapter and provider metadata, the system may account for:

-   Estimated or observed token use.
-   Request-rate limits.
-   Quota-window duration.
-   Cooldown after rate limiting.
-   Maximum output size.
-   Remaining budget for architecture, implementation, and review.
-   Whether waiting for a reset is preferable to switching models.

Provider quotas are not necessarily exposed exactly, and estimates can be imperfect. Do not treat the local budget tracker as authoritative provider-side usage.

### 17.2 Reserve budget for later stages

A common failure mode in multi-model systems is spending too much on candidate comparison and leaving insufficient capacity for the actual project. A good policy reserves expected capacity for:

-   Architecture generation.
-   Main implementation.
-   Integration fixes.
-   Independent review.
-   At least one correction pass.
-   Final report generation.

Benchmark candidates should be limited when budget is low or the task is not likely to benefit from comparison.

### 17.3 Wait versus fallback

By default, the orchestrator may wait for a quota reset. With `--no-wait`, it pauses rather than sleeping until a quota resets. A fallback is appropriate only if another eligible model is available and its use does not violate the workflow's budget or quality constraints.
---
## 18. Persistence, Resume, and Project Artifacts

### 18.1 Persistent locations

The project uses several storage locations:

-   `data/benchmarks.db`: SQLite benchmark history.
-   `data/state/`: resource or state snapshots.
-   `data/logs/`: application and decision logs.
-   `projects/<project-id>/`: per-project artifacts, state, and checkpoints.

Do not delete these locations while a project is running. Back them up before schema migrations or major changes.

### 18.2 Project artifacts

| Artifact | Purpose |
|---|---|
| `task_spec.json` | Structured task or requirement specification. |
| `architecture.md` | HLD/design document. |
| `benchmark/` | Lite specification, candidate outputs, metadata, and benchmark results. |
| `implementation/` | Generated project source and its own tests/docs. |
| `reviews/` | Review findings and revision-round outputs. |
| `checkpoints/` | Persisted state snapshots at stage boundaries. |
| `state.json` | Current project status and workflow metadata. |
| `final_report.md` | Human-readable summary, outcome, and remaining issues. |
| `decisions/` and `history/` | Additional decision/history artifacts where generated by a run. |

Exact artifact names may vary with workflow progress and implementation changes.

### 18.3 Resume behavior

If a run is interrupted, the CLI reports that progress has been saved and recommends:

``` bash
python main.py --list
python main.py --resume <project_id>
```

Before resuming, verify that credentials are still available and the configuration has not changed incompatibly. A resume may need to skip, retry, or revalidate a stage depending on its saved state. Inspect `state.json`, checkpoints, and logs if the resume result is unexpected.

### 18.4 Backups and portability

For an important run, back up the project directory and relevant benchmark/state data. Treat provider credentials as separate secrets and do not include them in backups that will be shared. SQLite database compatibility and state schema compatibility should be considered before moving data between versions of the orchestrator.
---
## 19. Logging and Decision Traceability

### 19.1 Logs

The snapshot includes:

-   `data/logs/orchestrator.log`: operational log output.
-   `data/logs/decisions.jsonl`: newline-delimited structured decision records.

The CLI also prints progress messages unless `--quiet` is enabled.

### 19.2 Decision log value

Decision records help answer questions such as:

-   Why did the system choose direct or orchestrated mode?
-   Which models were considered or skipped?
-   Why was a particular coder selected?
-   Was a benchmark reused or freshly run?
-   Did quota or cooldown constraints affect selection?
-   Which evaluation/review findings caused another revision?
-   Why did the project stop or pause?

The exact event schema is implementation-defined. Inspect the JSONL records produced by the current version before building external tooling around their fields.

### 19.3 Diagnostics

For a failed run, inspect information in this order:

1.  CLI error message and exit code.
2.  `python main.py --models`.
3.  `data/logs/orchestrator.log`.
4.  The project's `state.json` and latest checkpoint.
5.  `reviews/` and benchmark result artifacts.
6.  `data/logs/decisions.jsonl`.

Avoid logging API keys, raw authorization headers, or sensitive user source code unless explicitly necessary and appropriately protected.
---
## 20. Execution Safety

Generated code must be treated as untrusted. It may be incorrect, destructive, insecure, or intentionally malicious if the requirement or model output is compromised.

### 20.1 Current execution restriction

The README states that generated programs are automatically run only when they are plain, terminating Python scripts. GUIs, servers, and programs requiring input or arguments are not automatically run. Candidate code runs in subprocesses with a scrubbed environment.

This restriction reduces risk, but it is **not equivalent to a secure sandbox**. A subprocess can still access files, consume resources, or attempt network activity depending on operating-system permissions and the execution environment.

### 20.2 Recommended stronger isolation

Before using the orchestrator with untrusted requirements or production-sensitive code, consider running evaluation inside a dedicated container or disposable VM with:

-   No host credentials mounted.
-   No access to the user's home directory.
-   Network disabled by default.
-   Read-only source mount where practical.
-   A separate writable temporary directory.
-   CPU, memory, process-count, and execution-time limits.
-   A non-root user and reduced Linux capabilities.
-   No Docker socket or privileged device access.
-   Cleanup after each candidate run.
-   Explicit allowlisting for any required network access.

A container is a useful boundary but must be configured correctly. For higher-risk workloads, use a disposable VM or a purpose-built sandbox.

### 20.3 Never run blindly

Do not automatically run generated code that performs filesystem changes, manages credentials, installs packages, connects to production systems, deletes data, or modifies infrastructure without additional inspection and explicit approval.

### 20.4 Dependency safety

Generated projects may include malicious or compromised dependencies. Review dependency names and versions, lock dependencies where possible, inspect install scripts, and use vulnerability scanning before executing or deploying the result.
---
## 21. Testing and Validation

### 21.1 Module self-tests

The README indicates that modules expose self-test entry points. Examples include:

``` bash
PYTHONPATH=. python -m core.orchestrator
PYTHONPATH=. python -m core.scheduler
PYTHONPATH=. python -m agents.coder
```

Run these from the project root. Not every module necessarily has a self-test, and self-tests are not a replacement for a cohesive test suite.

### 21.2 Optional quality tools

If installed, the project may use tools such as:

``` bash
pytest
ruff check .
mypy .
bandit -r .
```

These commands are generic starting points. Tool configuration and project scope may require adjustment; do not assume every command is currently wired into every orchestrator evaluation path.

### 21.3 Validation layers

A good validation plan should include:

1.  **Unit tests:** module-level behavior.
2.  **Integration tests:** state manager, scheduler, resource manager, registry, and orchestration interaction.
3.  **Fake-model tests:** deterministic workflow tests without live API calls.
4.  **Adapter smoke tests:** minimal real request/response for each configured provider.
5.  **Resume tests:** interrupt and continue a run from saved state.
6.  **Quota tests:** simulated rate limits, cooldowns, budget exhaustion, and fallback.
7.  **Evaluation tests:** known-good and known-bad candidate programs.
8.  **Security tests:** ensure generated code cannot access secrets or unintended host resources.
9.  **End-to-end tests:** complete small project through final report.

### 21.4 Fake models and live providers

Scripted fake models are useful for deterministic tests, but they cannot validate live authentication, model identifiers, SDK response changes, provider quota behavior, or current API compatibility. Keep live smoke tests small, inexpensive, and explicit.

### 21.5 Reproducibility

Record the configuration, Python version, dependency versions, provider/model identifiers, scoring version, and evaluation tool versions for benchmark runs. Without these details, historical comparisons may be misleading.
---
## 22. Operational Runbooks

### Runbook A --- First-time setup

1.  Extract the archive.
2.  Open a terminal in the `orchestrator/` directory.
3.  Create and activate a virtual environment.
4.  Install dependencies.
5.  Configure credentials for one provider.
6.  Configure a valid model ID.
7.  Run `python -m config.settings`.
8.  Run `python main.py --models`.
9.  Run a small direct-mode task.
10. Inspect the generated project and logs.
11. Only then test the orchestrated workflow.

### Runbook B --- First direct-mode smoke test

``` bash
python main.py --direct --project-id smoke-direct "Create a Python function that normalizes whitespace and add unit tests."
```

Verify that the project directory exists, the implementation is readable, and the final report accurately describes the checks performed.

### Runbook C --- First orchestrated smoke test

``` bash
python main.py --orchestrate --project-id smoke-orchestrated "Create a small Python package with two functions, tests, and a README."
```

Use a small task to avoid unnecessary spend. Check the benchmark candidate artifacts, selected coder/reviewer, architecture, tests, review rounds, final report, and decision log.

### Runbook D --- Interrupted run

``` bash
python main.py --list
python main.py --resume <project_id>
```

If resuming fails, inspect the project's state/checkpoint files and application log. Do not delete the state to force a restart unless you understand which work will be lost.

### Runbook E --- Provider unavailable

1.  Run `python main.py --models`.
2.  Read the skip reason.
3.  Check the relevant SDK or CLI installation.
4.  Check credential availability and the configured model ID.
5.  Verify network access and provider status.
6.  Test the adapter with a minimal request.
7.  Use a configured fallback or pause the project if no safe fallback exists.

### Runbook F --- Quota exhausted

1.  Inspect the resource state and decision log.
2.  Determine whether the issue is a provider quota, request-rate limit, or local configured budget.
3.  If a reset is expected, allow waiting or rerun without `--no-wait`.
4.  If waiting is undesirable, use `--no-wait` to pause rather than sleep.
5.  Switch to a valid fallback only after checking its capabilities and remaining budget.
6.  Avoid restarting the entire project if `--resume` can continue from a checkpoint.

### Runbook G --- Benchmark appears wrong

1.  Confirm candidates received the same lite specification.
2.  Compare candidate metadata and model IDs.
3.  Inspect tests and their output.
4.  Confirm static-analysis tools were available and comparable.
5.  Review scoring weights and missing-metric handling.
6.  Confirm whether a historical benchmark was reused.
7.  Re-run with a fresh benchmark if the cached result is not relevant.
---
## 23. Troubleshooting

### `No model is usable`

**Likely causes:** missing credentials, disabled entries, unsupported model names, absent provider SDK/CLI, or unavailable local runtime.

**Actions:** - Run `python main.py --models`. - Read each skipped model's reason. - Check `config/config.json`, `config/settings.py`, and `env.example`. - Confirm the environment variable is present in the current shell. - Confirm the provider CLI is installed and logged in, if using a subscription adapter.

### Settings cannot be loaded

**Likely causes:** malformed JSON, unsupported fields, invalid values, or a wrong `--config` path.

**Actions:** - Validate JSON syntax. - Compare against the default config structure. - Run `python -m config.settings`. - Retry with the default config to isolate the problem.

### Provider authentication fails

**Actions:** - Verify the key belongs to the intended provider and account. - Check that the environment variable name matches configuration. - Ensure the current terminal has the variable. - For CLI adapters, use `python main.py --accounts`. - Do not log or share the key while debugging.

### Model name is not found

Provider model names change. Confirm the current identifier with the provider, then update `model_name`. A logical ID such as `groq-gptoss120b` is an internal identifier and need not match the provider-side name.

### Run pauses instead of completing

**Possible causes:** quota exhaustion, cooldown, or workflow state requiring resumption.

**Actions:** - Read the printed status and exit code. - Inspect `data/logs/orchestrator.log` and the decision JSONL. - Run `python main.py --list`. - Resume using the project ID. - If `--no-wait` was supplied, retry without it only if waiting is acceptable.

### Candidate code does not run

Not all generated programs are eligible for automatic execution. The current documented policy excludes GUIs, servers, and programs requiring input or arguments. A skipped runtime check is not a successful runtime check. Run the project manually in a controlled environment and add explicit tests.

### Static-analysis results are missing

Optional tools may not be installed, or a tool may not support the language/project. Install the appropriate tool and inspect the evaluation output to determine whether the check was skipped or failed.

### Review loop reaches its limit

Inspect the latest review artifact and evaluation output. Determine whether findings are contradictory, tests are too weak, or the revision scope is too broad. Reduce the task to a concrete failing test or minimal reproduction before trying again.

### Resume produces unexpected results

Check that the project ID is exact, state files are valid, and the configuration has not changed in a way that invalidates saved model IDs or paths. Preserve a backup before manually editing state.

### Results differ between runs

Model generation is nondeterministic in many environments. Provider versions, sampling parameters, context, dependency versions, benchmark cache reuse, test ordering, and resource conditions may all affect results. Compare artifacts and decision logs rather than only final scores.
---
## 24. Security and Privacy Considerations

### Secrets

-   Keep `.env`, API keys, access tokens, and CLI authentication material out of Git.
-   Do not include secrets in requirements or generated prompts.
-   Scrub environment variables passed to candidate subprocesses.
-   Avoid printing credentials in exceptions or debug logs.
-   Rotate any secret accidentally committed or exposed.

### User source code and prompts

Prompts and source files may be sent to external providers. Review provider retention, privacy, and contractual terms before using proprietary or personal data. Local inference can reduce external disclosure but does not automatically make a machine secure.

### Generated code

Treat model output as untrusted. Review shell commands, package-install steps, filesystem access, network calls, authentication code, and data migrations. Never assume generated tests prove the absence of vulnerabilities.

### Supply chain

Pin dependencies, inspect lockfiles, verify package names, use trusted package indexes, and scan dependencies. Avoid allowing candidate models unrestricted package installation during evaluation.

### Logging and stored artifacts

Logs, benchmark outputs, project state, and source code may contain sensitive details. Apply suitable filesystem permissions, retention policies, and backup controls. Clean up sensitive test data when it is no longer needed.

### Human approval gates

For deployments, database changes, destructive filesystem operations, external communications, or production credentials, require an explicit human approval step. The orchestrator's current CLI workflow should not be treated as a deployment authorization system.
---
## 25. Known Limitations and Current Status

The following points are grounded in the supplied repository snapshot and should be rechecked as the code evolves.

1.  **Live provider adapters require validation.** The README reports testing with scripted fake models against orchestration components, while provider adapters had not yet been tested against live APIs.
2.  **Default model configuration contains placeholders and disabled entries.** A user must configure model IDs, credentials, and enabled providers for their environment.
3.  **Capability and cost settings are estimates.** They require calibration from observed performance and current provider pricing.
4.  **Automatic runtime execution is deliberately limited.** Many project types will need manual or separately sandboxed testing.
5.  **The subprocess restriction is not a complete security sandbox.** Stronger isolation is recommended before running untrusted generated code.
6.  **Historical benchmarks may become stale.** Model revisions, task changes, evaluator changes, and environment differences can reduce comparability.
7.  **Scores depend on evaluation quality.** Weak tests or missing tools can make a weak implementation appear strong.
8.  **Not every metric applies to every task.** Missing metrics must be handled transparently.
9.  **Provider quotas are not necessarily fully observable.** Local tracking may be approximate and should not be assumed to reflect authoritative provider usage.
10. **The project is CLI-oriented.** The supplied snapshot documents a command-line entry point rather than a web UI.
11. **MCP, vector databases, and agent frameworks are optional extensions, not prerequisites.** Add them only when a concrete integration or capability requires them.
---
## 26. Glossary

-   **API adapter:** Code that translates the orchestrator's common model interface into a provider-specific API call.
-   **Benchmark cache:** Stored results used to avoid repeating a sufficiently similar candidate evaluation.
-   **Capability score:** A configured estimate of a model's suitability for a role, not a verified guarantee.
-   **Checkpoint:** A saved state/artifact snapshot used to preserve progress.
-   **Direct mode:** A path that uses one model without the competitive benchmark/reviewer workflow.
-   **HLD:** High-level design, documenting the architecture and implementation plan.
-   **Lite benchmark:** A reduced, representative task used to compare candidate models before spending resources on the full project.
-   **Orchestrated mode:** The multi-stage workflow with candidate benchmarking and independent review where available.
-   **Quota window:** A period over which a provider or local policy limits usage.
-   **Reviewer:** A model role that critiques the implementation and proposes corrections.
-   **Soft metric:** A qualitative or subjective evaluation dimension.
-   **State manager:** The component that persists project status and supports resuming a workflow.
---
## Appendix A --- Quick Reference

``` bash
# Help
python main.py --help

# Model availability
python main.py --models

# Show subscription CLI login state
python main.py --accounts

# Create project (automatic routing)
python main.py "Your software requirement"

# Read requirement from file
python main.py --file requirement.txt

# Force single-model path
python main.py --direct "Small bounded task"

# Force competitive orchestration
python main.py --orchestrate "Complex project requirement"

# List saved projects
python main.py --list

# Resume an existing project
python main.py --resume <project_id>

# Avoid waiting for quota resets
python main.py --no-wait "Your requirement"

# Disable optional LLM judge
python main.py --no-judge "Your requirement"

# Use a different configuration file
python main.py --config path/to/config.json "Your requirement"
```

## Appendix B --- Pre-Run Checklist

-   [ ] Requirement has clear acceptance criteria.
-   [ ] At least one model is usable (`python main.py --models`).
-   [ ] Model names and credentials are valid.
-   [ ] Candidate count and budgets are appropriate for the task.
-   [ ] Enough budget is reserved for implementation and review.
-   [ ] Generated code will be evaluated in an isolated environment.
-   [ ] Project ID will not overwrite an important existing project.
-   [ ] No secrets or unapproved confidential data are included in prompts.
-   [ ] A plan exists for reviewing and testing the final output.
