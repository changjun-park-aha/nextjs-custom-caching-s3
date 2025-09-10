1. turn on ssh tunnel
   `ssh -L 5433:localhost:5432 ec2-user@aha-fe-ec2`

2. run migration with .env.production.local
   `pnpm --env-file=.env.production.local db:push`
