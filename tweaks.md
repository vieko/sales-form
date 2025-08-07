# Tweaks to implementation plan

OVERALL: this is a POC, take this into account when reasoning about the
implementation.

0. Console Component The app has a console component that sits next to the form
   on the landing page route. The landing route is meant to function as a
   sandbox. There is a logger utility that will log events as they occur on the
   console component. The purpose is to showcase what the system does to
   non-technical and technical users alike. The goal is to implement as much of
   the functionality as possible, but do consider mocking as needed and using
   the console to communicate.

1. Queue Infrastructure

- consider Vercel KV for queues

2. Cost + Performance

- disregard lead target cost for this POC
- disregard tiered approach for this POC

3. Database Design Improvements

- Add separate companies table to avoid duplicate enrichment
- Keep high-query fields as native columns, not just JSONB
- Investigate: neon connection pooling with Vercel

4. Missing Components

- Mock behavioural: add a "mock behavioral data" switch to the form to insert
  mock data to the transaction
- disregard PII/GDPR for this POC
- "SSE on Vercel": there is no need for real-time features for this POC.
  However, do report on the console component: build status streaming during
  enrichment, progress indicators for each step, final classification with
  confidence level, "live" score updates is a bonus, but not required

RE: Recommendations

1. Add durable queue system: Vercel KV preferred, but Upstash works as well.
   Research documentation.
2. Implement company-level caching: YES
3. Relax performance targets: Absolutely, disregard as a goal for this POC
4. Create tiered enrichment strategy for cost control: disregard as a goal for
   this POC
5. Plan GDPR compliance and data retention policies: disregard as a goal for
   this POC
6. Prototype SSE early with polling fallback: see above "SSE on Vercel"
7. Add cost monitoring dashboard during development: helpful bonus, but not
   required

ANSWERS TO QUESTIONS

1. See above RE: budget
2. See above RE: PII/GDPR
3. Vercel KV is preferred, Upstash is also an option
4. See above RE: tiered enrichment approach

Questions? Comments? Further clarification?
