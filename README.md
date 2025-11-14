# MNGo - Online Auction Platform auction

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![build](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/MinhHCMUSsv/Online-Auction-Platform-Web-Dev-Final-Project-)
[![tech](https://img.shields.io/badge/Tech-Node.js%20%26%20Handlebars-yellowgreen)](https://nodejs.org)
> This is the final project for the Web Development (PTUDW) course, built by Minh and Nam. MNGo is a full-featured Online Auction Platform built on a modern SSR (Server-Side Rendering) architecture.
## Table of Contents
* [Key Features](#key-features)
* [Tech Stack](#tech-stack)
* [Getting Started](#getting-started)
  * [Requirements](#requirements)
  * [Installation](#installation)
* [Usage](#usage)
* [Website Figma Design](#website-figma-design)
* [Authors](#authors)
## Key Features
This project simulates a complete auction marketplace supporting four distinct user roles:
* **Guest:** Browse, search (Full-Text Search), and view products and categories.
* **Bidder:**
  * Place bids on items.
  * Add items to a personal Watchlist.
  * View bidding history (with masked usernames).
  * **Reputation System:** Must have >80% positive feedback to bid.
  * Provide (+/-) feedback to sellers after winning.
* **Seller:**
  * List items for auction (at least 3+ photos).
  * Set Starting Price, Bid Increment, and Buy It Now Price.
  * **Manage Bidders:** Can allow new users (with 0 feedback) to participate.
  * Answer questions from bidders and provide (+/-) feedback.
* **Administrator:**
  * Full CRUD management of users, categories, and products.
  * Approve "Bidder-to-Seller" upgrade requests.
## Tech Stack
1. Backend
   * **Runtime:** Node.js
   * **Framework:** Express.js
   * **View Engine:** Express Handlebars
   * **Authentication:** Express Session
   * **Database:** PostgreSQL
   * **Query Builder:** Knex.js
   * **Security:** Bcrypt.js (Password Hashing)
   * **Tooling:** nodemon for auto-reloading
2. Frontend
   * **Styling:** Bootstrap 5
## Getting started
### Requirements
You must have the following software installed on your machine:
* [Node.js](https://nodejs.org/) (v18 or later)
* [npm](https://www.npmjs.com/) (comes with Node.js)
* [Git](https://git-scm.com/)
* A running instance of [PostgreSQL](https://www.postgresql.org/download/)
### Installation
1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/MinhHCMUSsv/Online-Auction-Platform-Web-Dev-Final-Project-.git](https://github.com/MinhHCMUSsv/Online-Auction-Platform-Web-Dev-Final-Project-.git)
    ```

2.  **Navigate to the Project Directory**
    ```bash
    cd Online-Auction-Platform-Web-Dev-Final-Project-
    ```

3.  **Install Dependencies**
    ```bash
    npm install
    ```
## Usage

Once installation is complete, you can run the server.

1.  **Start the Server (Development Mode)**
    * This command uses `nodemon` to automatically restart when you change files.
    ```bash
    npm run dev
    ```

2.  **Start the Server (Production Mode)**
    ```bash
    npm run start
    ```

The application will be running on `http://localhost:3000`.
## Website Figma Design
## Authors

* **Nhật Minh - 23127425**
* **Hoàng Nam - 23127430** 
