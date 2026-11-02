---
name: paris-sport-hub-email-responder
description: >
  Use this skill whenever the user wants to monitor, review, or reply to incoming emails
  related to Paris Sport Hub. Triggers when the user asks to "check emails", "review inbox",
  "draft replies for customer emails", "handle store emails", or anything involving responding
  to customer inquiries on behalf of Paris Sport Hub. This skill fetches the last 5 emails,
  analyzes each one, and creates a Gmail draft reply using store-specific product and service
  information. Always use this skill when Paris Sport Hub email handling is mentioned.
---

# Paris Sport Hub — Email Responder Skill

This skill monitors the last 5 incoming emails via Gmail, analyzes each one for customer intent,
and creates a friendly draft reply grounded in Paris Sport Hub's store info and product catalog.

## Step-by-step Workflow

### 1. Load Store Knowledge
Before fetching emails, read `references/store-info.md` for the full store context:
- Store details (address, hours, phone, services)
- Full product catalog with prices and stock levels

### 2. Fetch the Last 5 Emails
Use the Gmail `search_threads` tool to retrieve recent inbox threads:
```
query: "in:inbox"
max_results: 5
```
For each thread returned, use `get_thread` to read the full message content.

### 3. Analyze Each Email
For each email, identify:
- **Customer intent**: What are they asking about? (product info, stock, hours, services, returns, etc.)
- **Relevant info**: Which products, services, or store details apply?
- **Tone**: Is the customer friendly, frustrated, urgent?

Only draft replies for emails that are genuine customer inquiries. Skip automated/marketing emails,
newsletters, or spam — note these as "skipped" with a brief reason.

### 4. Draft a Reply
For each relevant email, compose a reply that is:
- **Friendly and warm** — greet the customer by name if available
- **Concise** — answer their question directly without over-explaining
- **Accurate** — only reference products/prices/stock from `references/store-info.md`; never invent information
- **Helpful** — if we can't fully answer (e.g. out of stock, question outside our scope), acknowledge it and suggest next steps (call us, visit the store)
- **Signed off** with: "The Paris Sport Hub Team"

If the email is in French, reply in French. If in English, reply in English.

### 5. Save as Gmail Draft
Use the Gmail `create_draft` tool to save each reply as a draft. Do **not** send. Just save as a draft.

Fields to populate:
- `to`: the sender's email address
- `subject`: "Re: [original subject]"
- `body`: the drafted reply

### 6. Report Back
After processing all 5 emails, summarize to the user:
- How many emails were reviewed
- How many drafts were created (with subject lines)
- How many were skipped and why

---

## Tone & Style Guidelines

**Do:**
- Start with a warm greeting: "Bonjour [Name]!" or "Hi [Name],"
- Be specific: mention exact product names and prices when relevant
- If stock is low (≤5 units), mention limited availability to create gentle urgency
- Offer to help further: "Feel free to call us or stop by the store!"

**Don't:**
- Make up products, prices, or policies not in the catalog
- Promise things the store can't deliver (e.g. online ordering if not offered)
- Send the email — only create a draft

---

## Example Draft Reply

> Bonjour Marie,
>
> Merci pour votre message ! Nous avons bien le Wilson Pro Spin 3000 en stock (25 unités disponibles) au prix de 129,99 €. C'est une excellente raquette en graphite, idéale pour les joueurs intermédiaires.
>
> N'hésitez pas à passer en boutique ou à nous appeler au +33 1 23 45 67 89 pour toute question supplémentaire.
>
> À bientôt,
> The Paris Sport Hub Team

---

## Reference Files
- **`references/store-info.md`** — Full store details + product catalog. Always read this before drafting replies.
