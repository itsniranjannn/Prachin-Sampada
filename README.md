<div align="center">

<img src="https://capsule-render.vercel.app/api?type=soft&height=125&color=0:0d1117,50:7c2d12,100:ea580c&section=header&text=Hamro%20Prachin%20Sampada&fontSize=38&fontColor=ffffff&fontAlignY=45&animation=twinkling" width="100%" alt="Hamro Prachin Sampada Header"/>

<a href="https://hamrosampada-umber.vercel.app">
  <img src="https://readme-typing-svg.demolab.com?font=Space+Grotesk&weight=600&size=21&duration=2600&pause=800&color=FB923C&center=true&vCenter=true&width=680&lines=116+Nepalese+heritage+sites+in+3D.;Interactive+story+map+%26+yatra+planner.;Live+multiplayer+hunts+via+Socket.io.;Adaptive+quizzes+%26+heritage+passport." alt="Typing animation"/>
</a>

<br/>

[![Live Demo](https://img.shields.io/badge/Live_Demo-hamrosampada--umber.vercel.app-ea580c?style=for-the-badge&logo=vercel&logoColor=white)](https://hamrosampada-umber.vercel.app)
![React](https://img.shields.io/badge/React-Vite-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

<br/>

**[Overview](#overview) · [Features](#features) · [Quick Start](#quick-start) · [Connect](#connect)**

</div>

---

## Overview

**Hamro Prachin Sampada (हाम्रो प्राचीन सम्पदा)** is an interactive Nepal cultural heritage explorer featuring **116 heritage sites**, a **3D model per site**, a **story map**, a **yatra planner**, **adaptive quizzes**, **Find the Monument**, **live multiplayer hunts**, and a **heritage passport**.

<p align="center">
  <a href="https://hamrosampada-umber.vercel.app">
    <img src="docs/screenshots/live-preview.png" alt="Hamro Prachin Sampada Live Preview" width="92%" />
  </a>
</p>

---

## Features

<table>
<tr>
<td width="50%" valign="top">

### Explore & 3D
- **116 heritage sites** with 3D monument models
- **Story map** with geographic and historical context
- **Yatra planner** for building cultural routes
- **Heritage passport** tracking visited & unlocked sites

</td>
<td width="50%" valign="top">

### Play & Compete
- **Live multiplayer hunts** powered by Socket.io
- **Adaptive quiz** engine (1,160+ curated questions)
- **Find the Monument** visual/clue challenge (696 clues)
- **12 unit tests + 18 API flow tests**

</td>
</tr>
</table>

---

<details>
<summary><b>Quick Start & Demo Accounts (click to expand)</b></summary>

### Requirements
- Node.js 20+
- MySQL 8.x (default port `3306`, user `root`)

### Setup
```bash
# 1) Import database (creates "sampada")
mysql -u root -p < database/sampada.sql

# 2) Start Server (http://localhost:5050)
cd server
npm install
npm run dev

# 3) Start Client (http://localhost:5174)
cd ../client
npm install
npm run dev
```

### Demo Accounts
| Role | Email | Password |
| :--- | :--- | :--- |
| Explorer | `demo@sampada.np` | `explorer123` |
| Admin | `admin@sampada.np` | `admin123` |

</details>

---

## Connect

<div align="center">

<a href="mailto:katwalniranjan7@gmail.com"><img src="https://img.shields.io/badge/katwalniranjan7%40gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Email"/></a>
<a href="https://github.com/itsniranjannn"><img src="https://img.shields.io/badge/itsniranjannn-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/></a>

<img src="https://capsule-render.vercel.app/api?type=waving&height=80&color=0:0d1117,50:7c2d12,100:ea580c&section=footer" width="100%" alt=""/>

</div>
