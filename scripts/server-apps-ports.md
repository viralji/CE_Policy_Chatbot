# Server Port Assignment (4 apps, only ports 80/443 open externally)

| App | URL | Location | Frontend Port | Backend Port | Nginx |
|-----|-----|----------|--------------|--------------|-------|
| Policy Assistant | chatbot.cloudextel.com | /var/www/ce-policy-chatbot | 5174 | 4001 | proxy 80/443 → 5174 |
| Portal | portal.cloudextel.com | /var/www/cloudextel-portal | (static) | - | root 80/443 |
| Wireline | wireline.cloudextel.com | /var/www/trenching-extractor-fresh | 3000 | 8000 | proxy 80/443 → 3000, /api → 8000 |
| Workflow | workflows.cloudextel.com | /var/www/Workflow_App | (static) | 4000 | root 80/443, /api → 4000 |
