# Estate IQ — Master Project Anchor

Version: 2.0
Owner: Kudsiy
Type: Multi-Tenant SaaS
Market: Ethiopia (Addis Ababa first)

---

# 1. Project Identity

## Name

Estate IQ

## Core Vision

Estate IQ is a **Real Estate Agent Operating System** built specifically for Ethiopian agents and small marketing teams that combines:

* Property Supply (Supplier Feed)
* Marketing Studio
* Lead Capture
* CRM Pipeline
* Analytics

The goal is to **upgrade freelance agents into fast, professional, organized deal closers**.

Estate IQ ensures agents:

* Never lose clients due to lack of property
* Look professional instantly
* Respond faster than competitors
* Track and close more deals

---

# 2. Why Estate IQ Is Unique (Ethiopia 2026)

Estate IQ is designed for **real Ethiopian market conditions**, not generic SaaS.

## Market Reality

Ethiopian agents:

Get supply from:

* Telegram channels
* Facebook marketplace
* Broker groups
* Developers
* TikTok creators

Get leads from:

* TikTok videos (primary)
* Instagram reels
* Facebook posts
* WhatsApp referrals

Lose deals because:

* They don’t have matching property
* They respond too slowly
* They look unprofessional
* Leads get lost in WhatsApp

Estate IQ solves **all four simultaneously**.

---

## Corridor Development Impact

Addis Corridor Project creates:

* Rapid listing turnover
* Constant new supply
* Price volatility
* Competition between agents

Agents must:

* find listings fast
* post quickly
* respond instantly

Estate IQ becomes **speed advantage**.

---

## Local Requirements

Estate IQ supports:

* ETB pricing
* Addis sub-city filtering
* Amharic + English
* Chapa payments
* Telegram-heavy workflow
* TikTok-driven marketing

Global tools don't support these.

This is the **local moat**.

---

# 3. Core Architecture (The 4 Engines)

Estate IQ has **four core engines**:

1. Supplier Engine (Property Feed)
2. Marketing Engine (Studio)
3. Demand Engine (Lead Capture)
4. Closing Engine (CRM)

Full Loop:

Supply → Search → Share → Lead → CRM → Close → Repeat

---

# 4. Core Feature Roadmap

## 1. Supplier Feed (CRITICAL CORE)

Purpose:
Agents instantly find property when client asks.

Sources:

Telegram scraping
Facebook marketplace scraping
Website scraping
Manual supplier upload
TikTok listing saving (future)

Features:

Search by:

* location
* price
* bedrooms
* property type
* furnished
* developer

Actions:

* Save listing
* Share listing
* Convert to "My Listing"
* Generate marketing content

This solves:
"No property when client asks"

---

## 2. Property Listings (Agent Listings)

Agents can:

Create listing
Upload photos
Add price
Add location
Add details

Listings can come from:

* Supplier feed
* Manual input
* Imported data

---

## 3. Studio (Marketing Engine)

Generate:

Property graphics
TikTok video ads
Instagram posts
Captions (Amharic + English)

Uses:

Agent Brand Kit
Listing data
AI generation

Goal:
Make agents look professional instantly.

---

## 4. Publish Engine

Generate ready-to-post:

TikTok caption
Instagram caption
Telegram post
WhatsApp share

Future:
Direct API posting

---

## 5. Lead Capture Engine

Every shared listing includes:

Tracking link
WhatsApp button
Call button
Inquiry form

When clicked:

Lead created
Listing attached
Timestamp saved
Agent notified

---

## 6. Agent CRM

Pipeline:

New Leads
Contacted
Interested
Negotiation
Closed

Features:

Notes
Follow-ups
Call tracking
Listing attached
Lead history

---

## 7. Analytics

Dashboard:

Leads this week
Best listing
Conversion rate
Platform performance
Posting streak

---

## 8. Multi-Team Support

Agency features:

Multiple agents
Lead assignment
Shared listings
Performance dashboard

---

# 5. Tech Stack

Frontend
Next.js
React
TypeScript
Tailwind CSS

Backend
Next.js API routes
Node.js
TypeScript

Database
PostgreSQL
Drizzle ORM
Supabase (optional)

Hosting
Railway

AI
OpenAI / Ollama
Image generation
Caption generation

Payments
Chapa API
ETB subscriptions

---

# 6. Database Schema Logic

## Users

Agents

Fields:
id
name
email
phone
role
created_at

---

## Supplier Properties

Scraped listings

Fields:
id
title
location
price
bedrooms
source
images
supplier_phone
created_at

---

## Agent Listings

Agent-controlled listings

Fields:
id
user_id
supplier_id (optional)
title
location
price
description
images
created_at

---

## Leads

Buyer inquiries

Fields:
id
listing_id
user_id
name
phone
source
status
created_at

---

## CRM Activities

Lead actions

Fields:
lead_id
action
notes
timestamp

---

## Brand Kit

Agent branding

Fields:
user_id
logo
colors
phone
whatsapp
tagline

---

## Subscriptions

Fields:
user_id
plan
status
expires_at

---

# 7. UI Navigation Structure

Dashboard
Supplier Feed
My Listings
Studio
Leads
CRM
Analytics
Settings

Supplier Feed is **primary workspace**.

---

# 8. Coding Guidelines For AI

Always:

Use TypeScript
Write modular code
No hardcoded values
Multi-tenant safe
Use Tailwind CSS
Mobile responsive

Explain:

What changed
Where to paste code
What it does

Assume user is non-programmer.

---

# 9. Current Progress (Based on Repo)

Already Built:

Studio architecture
Listing structure
CRM scaffolding
Leads module (partial)
Notification system
Monetization module
Template system
Brand kit logic

Partially Built:

Lead capture
CRM pipeline
Supplier feed (not yet connected)

Not Built:

Telegram scraping
Facebook scraping
Supplier search UI
Tracking links
Analytics dashboard

---

# 10. Immediate Priority

Build in order:

1 Supplier Feed UI
2 Supplier scraping
3 Supplier search
4 Convert supplier → listing
5 listing tracking links
6 lead capture
7 CRM auto create

This completes system.

---

# 11. Product Definition

Estate IQ is:

A real estate agent operating system that provides property supply, marketing tools, lead capture, and CRM to help Ethiopian agents instantly respond to buyers and close more deals.

---

# 12. End Goal

Estate IQ becomes:

The place agents:

Find property
Create marketing
Capture leads
Manage clients
Close deals

All inside one system.

Leaving Estate IQ means losing:

* supply access
* leads
* listings
* clients
* analytics

This creates strong SaaS retention.

END OF FILE
