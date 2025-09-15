# Requirement Checklist - Confirm item by item

## ✅ core technology stack - must use
- [] Node.js - Server runtime
- [] HTML - Page structure
- [] JavaScript - Interactive logic
- [] DOM - Dynamic Content Manipulation
- [] MySQL - Database
- [] AngularJS is prohibited

## ✅ three core pages
Home Page (index.html)
- [] Display static information of charity organizations (hard-coded)
Dynamically display current and upcoming activities (API must be used)
- [] Automatically classify "past "/" upcoming" activities based on date
- [] Do not display activities where is_active = false
Each activity card has a link to the detail page

search page (search.html)
The search form contains three fields:
- [] date - Date selector
- [] location - Text input
- [] Activity category - Drop-down selection
- [] Supports multi-condition combined search
- [] "Clear Filter" button - Reset form
- [] Display the list of search results
- [] Error message display (DOM operation)

event Details Page (event.html)
- [] Display complete event information:
Name, time, place, purpose
- [] Complete description
- [] Ticket Information (Price, Free/Paid)
Fundraising goal vs. current progress
- [] The "Register" button displays a modal box that reads: "This feature is currently under construction"
- [] Pass event_id through the URL parameter

## ✅ technical architecture requirements
Database layer
- [] Database name: charityevents_db
- [] Reasonable schema design
- [] Primary key and foreign key relationship
At least 8 sample activities
Several different classifications
- [] Export SQL files

API layer
- [] RESTful design
- [] GET endpoint:
- [] Home Page event List: /api/events
- [] search activities: /api/events/search
Event details: /api/events/:id
- [] Category list: /api/categories
- [] No POST/PUT/DELETE is required

Client layer
- [] Responsive Navigation Menu (all pages)
- [] Dynamic Content Loading (API Invocation)
- [] DOM operations
- [] Promise handles asynchronously
Error handling

Non-functional requirements: ✅
- [] GitHub repositories are submitted regularly
Project report document
- [] Demonstration video (15 minutes)
The code can run without errors