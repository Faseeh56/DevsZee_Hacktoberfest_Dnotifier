# Hotel FAQ ingestion - test locally first

This package adds local extraction and an explicitly invoked live uploader. It does not connect the website to retrieval, alter API contracts, merge PRs or push Git commits. The generation provider remains unresolved. Keep NEXT_PUBLIC_USE_MOCK=true.

## 1. Install into the existing project

From the extracted package directory:

```bash
python3 install.py "$HOME/Development/projects/hackathons/Best-use-of-Dnotifier/support-triage-frontend"
```

The installer copies only new files and adds .knowledge-cache/ to .gitignore. It refuses to overwrite a differing file. It does not replace package.json, .env.local, existing components or API routes. The upload ledger and preview must stay local.

From the project directory:

```bash
npm install --save-dev pdf-parse@2.4.5
node --test tests/hotel-faq.test.mjs
node scripts/extract-hotel-faq.mjs
```

pdf-parse 2.4.5 supports Node >=20.16 <21 or >=22.3; your Node 24 installation qualifies. It is used only by the offline CLI. No new SDK methods are invented. getText()/destroy() follow the parser's official guide: https://github.com/mehmet-kozan/pdf-parse

## 2. Review the offline preview

Source: data/knowledge/Aster_House_Lahore_Fictional_Business_FAQ.pdf

Output: .knowledge-cache/aster-house-faq.json

Expected: 4 pages, 24 ordered FAQs and approximately 1,537 words in the records. Each record includes the complete question and answer, a stable record ID, page, source, filename and a fictional-content flag. Headings are matched at line starts so inline references such as FAQ-19 do not create new chunks.

Review FAQ-02 prices, FAQ-09 deposit arithmetic, FAQ-13 cancellation boundary and FAQ-24 unknown information. The script rejects missing/duplicate/out-of-order FAQs and short answers. It is specific to this approved PDF, not a general PDF ingestion service. No credentials are read, no network calls occur and no records are uploaded during extraction.

## 3. Upload only after local review

Use your existing App ID and App Secret in .env.local. This command performs LIVE provider operations and consumes applicable indexing/storage quota:

```bash
node --env-file=.env.local scripts/upload-hotel-faq.mjs --create
```

The uploader authenticates, checks the document fits the plan's knowledge-base word capacity, then submits the 24 records sequentially. This capacity is not remaining account usage; other documents may still cause quota failures. Responses with an explicit error envelope stop the run. Accepted requests are not proof of completed indexing; semantic search must be checked afterward.

It uses the same server identity as the retrieval helper, DNOTIFIER_KB_USER_ID or nexa-knowledge. Source filter: aster-house-lahore-v1. Record IDs: aster-house-lahore-v1-faq-01 through -24. It neither deletes existing documents nor automatically retries a failed request. No AI generation calls are made.

## 4. Re-runs and edits

Once a create is attempted, .knowledge-cache/upload-<scope>.json records IDs attempted and accepted. The scope hashes App ID, owner ID and source; raw credentials are not written. A repeated --create is refused in this checkout, including after partial failure. Do not delete this ledger to bypass the safeguard.

After a COMPLETE initial import, edit the approved source if needed, rerun extraction and use:

```bash
node --env-file=.env.local scripts/upload-hotel-faq.mjs --update
```

Update uses updateDocument with the same IDs. It does not fall back to create. The local ledger does not guarantee global idempotency across machines/checkouts or unknown backend duplicate behavior. Stable IDs alone do not establish an upsert contract.

If upload stops partway, inspect attempted/accepted IDs before recovery. An attempted but unacknowledged operation may have reached the service. Do not blindly rerun create, use update for records that do not exist, or delete unrelated documents. Recover individual IDs only after checking their server state. A hung network operation may require Ctrl+C; the script has no SDK cancellation/retry mechanism and cannot roll back accepted remote writes.

## 5. Website integration comes next

Successful ingestion will be followed by semantic-search checks for relevant and unrelated questions, then an /api/chat integration returning source excerpts and safe handoff. Lead persistence and dashboard API integration also remain outstanding. This is retrieval preparation, not a claim of a finished generated-answer RAG system.

## DNotifier references

https://dnotifier.gitbook.io/product-docs/ai/manage-documents/javascript-typescript

addDocument({senderId,recordId,content,type,metadata}) and updateDocument with the same shape are documented and were checked against the installed SDK. No dashboard access or extra provider credential is used by these scripts.
