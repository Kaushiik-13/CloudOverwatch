☁️ **Cloud Overwatch – Automated Cloud Cleanup Platform**
=========================================================

### 🔹 **Automate. Optimize. Secure.**

**Cloud Overwatch** is a **serverless cloud management platform** that automatically detects and deletes unused AWS resources — helping developers save costs, reduce risks, and simplify their DevOps workflow.

> 💡 Designed for modern cloud teams who want to stop wasting money on idle EC2s, RDS, and S3 resources.

🚀 **Live Demo**
----------------

👉 [**cloud-overwatch.vercel.app**](https://cloud-overwatch.vercel.app)

🧭 **Overview**
---------------

In fast-paced development environments, teams often create AWS resources temporarily for testing or staging.Unfortunately, these resources are often forgotten after use, becoming **"zombie" instances** that silently drain budgets and create security risks.

**Cloud Overwatch** solves this by:

*   Scanning AWS accounts for unused or expired tagged resources.
    
*   Notifying users before deletion.
    
*   Automatically cleaning up expired assets securely.
    

💡 **Key Features**
-------------------

*   🧭 **Secure AWS Integration** – Uses cross-account IAM roles (no key sharing).
    
*   🧮 **Centralized Dashboard** – Displays all tagged resources and their costs.
    
*   ⚙️ **Automated Cleanup** – Daily scans and deletions via AWS Lambda + EventBridge.
    
*   📬 **Notifications** – Email or Slack alerts before deletion.
    
*   🧹 **Manual Delete Option** – Clean up instantly from the dashboard.
    
*   💰 **Cost Tracking** – Estimate monthly savings in real-time.
    

🏗️ **Architecture Overview**
-----------------------------
![Cloud Overwatch Architecture](https://github.com/Kaushiik-13/CloudOverwatch/blob/main/architecture/architecture.jpg)
Layer Technology Purpose **Frontend** Next.js (React) + Tailwind CSS Dashboard UI for resource visibility **Backend** NestJS + AWS LambdaAPI and resource scanning logic **Scheduler** Amazon EventBridgeTriggers daily cleanup **Database** RDS (MySQL) + DynamoDBUser and resource data storage **Security** AWS IAM + STSCross-account access via secure roles

### 🧱 System Flow

`   User → Next.js Dashboard → NestJS API → API Gateway [  EventBridge (Daily Scan) ]→ Lambda → DynamoDB / RDS   `

### 🖼️ **Full AWS Architecture Diagram**

> _Depicts complete system flow — Next.js + NestJS frontend and backend connecting to AWS Lambda, RDS, DynamoDB, and customer AWS accounts via secure IAM roles and STS. EventBridge triggers scheduled cleanup while SES/SNS handles notifications._

📸 **Dashboard Preview**
------------------------
![Cloud Overwatch Dashboard](https://github.com/Kaushiik-13/CloudOverwatch/blob/main/architecture/dashboard.png)
> _(Displays all tagged AWS resources — S3, EC2, Lambda — with delete-after dates and region info.)_

⚙️ **Tech Stack**
-----------------

*   **Frontend:** Next.js 15, React, Tailwind CSS
    
*   **Backend:** NestJS, AWS Lambda, EventBridge, API Gateway
    
*   **Database:** Amazon RDS (MySQL) + DynamoDB
    
*   **Hosting:** Vercel (Frontend), AWS (Backend)
    
*   **Notifications:** Amazon SES / SNS
    
*   **Security:** IAM Roles + STS
    

🧠 **How It Works**
-------------------

1️⃣ **Connect AWS Account**

*   Create an IAM role with a predefined policy.
    
*   Provide the IAM Role ARN in the dashboard.
    

2️⃣ **Tag Resources**

`   overwatch-delete-after: 2025-10-30   `

3️⃣ **Monitor Resources**

*   Dashboard displays all tagged assets with cost and expiry.
    

4️⃣ **Automate Cleanup**

*   EventBridge triggers Lambda daily → scans for expired tags → deletes resources.
    

5️⃣ **Notifications**

*   Users are notified 24h before deletion with an option to “Snooze”.
    

🔮 **Future Enhancements**
--------------------------

*   🤖 AI-based detection of unused resources
    
*   ☁️ Multi-cloud support (Azure, GCP)
    
*   💬 Slack & Discord notifications
    
*   📊 Real-time cost analytics dashboard
    
*   👥 Team role-based access
    

📈 **Impact**
-------------

MetricDescription💸 **Cost Efficiency**Reduces cloud cost by deleting idle resources🛡️ **Security**Prevents risks from unpatched instances⏱️ **Productivity**Eliminates manual auditing time🌍 **Sustainability**Reduces wasted compute energy

🧑‍💻 **Author**
----------------

**👋 Kaushiik Arul**🎓 Cloud & Full-Stack Developer | AWS Certified (in progress)🧠 Passionate about CloudOps, Automation & Serverless Systems

*   🌐 **Live Project:** [cloud-overwatch.vercel.app](https://cloud-overwatch.vercel.app)
    
*   🖋️ **Medium Case Study (Coming Soon)**
    
*   💼 **LinkedIn:** [linkedin.com/in/kaushiik-arul](#)
    

📜 **License**
--------------

**MIT License** © 2025 **Kaushiik Arul**

⭐ _If you found this project helpful, please give it a star on GitHub — it helps a lot!_
